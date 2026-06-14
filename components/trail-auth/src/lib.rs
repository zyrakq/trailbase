#![forbid(unsafe_code, clippy::unwrap_used)]
#![allow(clippy::needless_return)]

use rust_embed::RustEmbed;
use serde::Serialize;
use trailbase_wasm::db;
use trailbase_wasm::http::{
    Html, HttpError, HttpRoute, IntoBody, IntoResponse, Json, Request, Response, StatusCode,
    header, routing,
};
use trailbase_wasm::kv::Store;
use trailbase_wasm::{Guest, export};

#[derive(RustEmbed)]
#[folder = "ui/dist/"]
struct Assets;

struct Endpoints;

impl Guest for Endpoints {
    fn http_handlers() -> Vec<HttpRoute> {
        return vec![
            // Serve the compiled JS bundle.
            routing::get(
                "/_/auth/bundle.js",
                async |_req: Request| -> Result<Response, HttpError> {
                    let file = Assets::get("bundle.iife.js")
                        .ok_or_else(|| internal("bundle.iife.js not found in embedded assets"))?;

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "public, max-age=604800, immutable")
                        .header(header::CONTENT_TYPE, "application/javascript; charset=utf-8")
                        .body(file.data.into_body())
                        .map_err(internal);
                },
            ),
            // Profile capabilities endpoint — required by the Argiago host app
            // to determine whether to show the OTP/change-password sections.
            routing::get(
                "/api/auth/v1/profile",
                async |req: Request| -> Result<Response, HttpError> {
                    let user = req
                        .user()
                        .ok_or_else(|| HttpError::status(StatusCode::UNAUTHORIZED))?;
                    return profile_capabilities_handler(user).await;
                },
            ),
            // HTML wrapper for reset-password links from email.
            // The link in the email points to /_/auth/reset_password/update/<token>.
            // This route serves a minimal page that loads the bundle and renders <trail-auth>
            // with mode="reset-password" so the component can show the new-password form.
            routing::get(
                "/_/auth/reset_password/update/{password_reset_token}",
                async |req: Request| -> Result<Response, HttpError> {
                    let token = req
                        .path_param("password_reset_token")
                        .ok_or_else(|| internal("missing password_reset_token"))?;
                    return Ok(Html(reset_password_page(token)).into_response());
                },
            ),
            // HTML wrapper for email verification links.
            routing::get(
                "/_/auth/verify_email",
                async |_req: Request| -> Result<Response, HttpError> {
                    return Ok(Html(verify_email_page()).into_response());
                },
            ),
            // Static assets — OAuth provider icons and any other public files.
            // Must be last so more specific routes above take precedence.
            routing::get(
                "/_/auth/{*path}",
                async |req: Request| -> Result<Response, HttpError> {
                    let path = req
                        .path_param("path")
                        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

                    let file = Assets::get(path)
                        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "public, max-age=604800, immutable")
                        .header(header::CONTENT_TYPE, file.metadata.mimetype())
                        .body(file.data.into_body())
                        .map_err(internal);
                },
            ),
        ];
    }
}

export!(Endpoints);

// ---------------------------------------------------------------------------
// Profile capabilities
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct ProfileResponse {
    show_otp_section: bool,
    show_change_password: bool,
}

#[derive(serde::Deserialize, Default)]
struct AuthConfig {
    disable_password_auth: bool,
}

async fn profile_capabilities_handler(
    user: &trailbase_wasm::http::User,
) -> Result<Response, HttpError> {
    let rows = db::query(
        r#"SELECT provider_id, password_hash FROM "_user" WHERE email = ?"#,
        vec![db::Value::Text(user.email.clone())],
    )
    .await
    .map_err(internal)?;

    let is_oauth_only = rows
        .first()
        .and_then(|row| {
            let is_oauth = match row.first()? {
                db::Value::Integer(n) => *n != 0,
                _ => false,
            };
            let no_password = match row.get(1)? {
                db::Value::Text(s) => s.is_empty(),
                _ => true,
            };
            Some(is_oauth && no_password)
        })
        .unwrap_or(false);

    let password_auth_enabled = {
        let store = Store::open().map_err(internal)?;
        match store.get("config:auth").map_err(internal)? {
            Some(bytes) if !bytes.is_empty() => {
                serde_json::from_slice::<AuthConfig>(&bytes)
                    .map(|c| !c.disable_password_auth)
                    .unwrap_or(true)
            }
            _ => true,
        }
    };

    return Ok(Json(ProfileResponse {
        show_otp_section: !is_oauth_only && password_auth_enabled,
        show_change_password: !is_oauth_only && password_auth_enabled,
    })
    .into_response());
}

// ---------------------------------------------------------------------------
// HTML page helpers
// ---------------------------------------------------------------------------

fn reset_password_page(token: &str) -> String {
    // Minimal HTML that loads the bundle and mounts <trail-auth> in reset-password mode.
    // The token is passed as a plain attribute — no script needed beyond the bundle load.
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset password</title>
  <style>
    body {{
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
    }}
    trail-auth {{
      max-width: 400px;
      width: 100%;
      margin: 1rem;
    }}
  </style>
</head>
<body>
  <trail-auth mode="reset-password" token="{token}"></trail-auth>
  <script type="module" src="/_/auth/bundle.js"></script>
</body>
</html>"#,
        token = token
    )
}

fn verify_email_page() -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify email</title>
  <style>
    body {{
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      font-family: -apple-system, sans-serif;
    }}
    .card {{
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      margin: 1rem;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="card">
    <p>Your email has been verified. You can close this tab and sign in.</p>
    <a href="/">Go to sign in</a>
  </div>
</body>
</html>"#
    )
}

fn internal(err: impl std::string::ToString) -> HttpError {
    return HttpError::message(StatusCode::INTERNAL_SERVER_ERROR, err);
}
