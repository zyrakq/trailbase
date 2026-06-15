#![forbid(unsafe_code, clippy::unwrap_used)]
#![allow(clippy::needless_return)]

use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use trailbase_wasm::db;
use trailbase_wasm::http::{
    Html, HttpError, HttpRoute, IntoBody, IntoResponse, Json, Request, Response, StatusCode,
    header, routing,
};
use trailbase_wasm::kv::Store;
use trailbase_wasm::{Guest, export};

const KV_RESET_PASSWORD_URL: &str = "reset_password_redirect_url";
const DEFAULT_RESET_PASSWORD_URL: &str = "/reset-password?token={token}";

#[derive(RustEmbed)]
#[folder = "ui/dist/"]
struct Assets;

struct Endpoints;

impl Guest for Endpoints {
    fn http_handlers() -> Vec<HttpRoute> {
        return vec![
            // Serve the compiled JS bundle with ETag-based cache validation.
            // Cache-Control: no-cache means the browser always revalidates with the server.
            // The ETag is derived from the file's SHA-256 hash embedded at compile time,
            // so it automatically changes whenever the bundle is rebuilt.
            routing::get(
                "/_/auth/bundle.js",
                async |req: Request| -> Result<Response, HttpError> {
                    let file = Assets::get("bundle.iife.js")
                        .ok_or_else(|| internal("bundle.iife.js not found in embedded assets"))?;

                    let etag = {
                        let hash = file.metadata.sha256_hash();
                        let hex: String = hash.iter().map(|b| format!("{b:02x}")).collect();
                        format!("\"{hex}\"")
                    };

                    // Return 304 Not Modified if the client already has this version.
                    if req.header("if-none-match").and_then(|v| v.to_str().ok()) == Some(&etag) {
                        return Response::builder()
                            .status(StatusCode::NOT_MODIFIED)
                            .body(b"".into_body())
                            .map_err(internal);
                    }

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "no-cache")
                        .header(header::CONTENT_TYPE, "application/javascript; charset=utf-8")
                        .header(header::ETAG, etag)
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
            // Reset-password email links point to this route.
            // Instead of serving a standalone page, we redirect to the host app's page
            // so <trail-auth mode="reset-password"> is rendered in the proper app context.
            // The redirect URL is stored in KV (key: reset_password_redirect_url) with
            // {token} as a placeholder. Defaults to /reset-password?token={token}.
            routing::get(
                "/_/auth/reset_password/update/{password_reset_token}",
                async |req: Request| -> Result<Response, HttpError> {
                    let token = req
                        .path_param("password_reset_token")
                        .ok_or_else(|| internal("missing password_reset_token"))?;

                    let url_template = read_reset_password_url()?;
                    let location = url_template.replace("{token}", token);

                    return Response::builder()
                        .status(StatusCode::SEE_OTHER)
                        .header(header::LOCATION, location)
                        .body(b"".into_body())
                        .map_err(internal);
                },
            ),
            // Admin config — read current trail-auth settings.
            routing::get(
                "/_/admin/trail-auth/config",
                async |_req: Request| -> Result<Response, HttpError> {
                    let reset_password_redirect_url = read_reset_password_url()?;
                    return Ok(Json(TrailAuthConfig { reset_password_redirect_url }).into_response());
                },
            ),
            // Admin config — update trail-auth settings.
            routing::post(
                "/_/admin/trail-auth/config",
                async |mut req: Request| -> Result<Response, HttpError> {
                    let body = req.body().bytes().await.map_err(internal)?;
                    let config: TrailAuthConfig =
                        serde_json::from_slice(&body).map_err(bad_request)?;

                    if config.reset_password_redirect_url.is_empty() {
                        return Err(bad_request("reset_password_redirect_url must not be empty"));
                    }

                    let mut store = Store::open().map_err(internal)?;
                    store
                        .set(
                            KV_RESET_PASSWORD_URL,
                            config.reset_password_redirect_url.as_bytes(),
                        )
                        .map_err(internal)?;

                    return Ok(Json(config).into_response());
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
// Config helpers
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
struct TrailAuthConfig {
    reset_password_redirect_url: String,
}

fn read_reset_password_url() -> Result<String, HttpError> {
    let store = Store::open().map_err(internal)?;
    match store.get(KV_RESET_PASSWORD_URL).map_err(internal)? {
        Some(bytes) if !bytes.is_empty() => {
            String::from_utf8(bytes).map_err(|e| internal(format!("invalid UTF-8 in KV: {e}")))
        }
        _ => Ok(DEFAULT_RESET_PASSWORD_URL.to_string()),
    }
}

// ---------------------------------------------------------------------------
// HTML page helpers
// ---------------------------------------------------------------------------

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

fn bad_request(err: impl std::string::ToString) -> HttpError {
    return HttpError::message(StatusCode::BAD_REQUEST, err);
}
