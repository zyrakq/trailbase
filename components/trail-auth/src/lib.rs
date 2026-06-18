#![forbid(unsafe_code, clippy::unwrap_used)]
#![allow(clippy::needless_return)]

use rust_embed::RustEmbed;
use trailbase_wasm::http::{
    Html, HttpError, HttpRoute, IntoBody, IntoResponse, Json, Request, Response, StatusCode,
    header, routing,
};
use trailbase_wasm::kv::Store;
use trailbase_wasm::{Guest, export};

mod config;
mod error;
mod pages;
mod password;
mod profile;
mod set_password;

use config::{read_reset_password_url, TrailAuthConfig, KV_RESET_PASSWORD_URL};
use error::{bad_request, internal};
use pages::verify_email_page;
use profile::profile_capabilities_handler;
use set_password::set_password_handler;

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
            routing::post(
                "/api/auth/v1/set_password",
                async |mut req: Request| -> Result<Response, HttpError> {
                    let body = req.body().bytes().await.map_err(internal)?;
                    let user = req
                        .user()
                        .ok_or_else(|| HttpError::status(StatusCode::UNAUTHORIZED))?;
                    return set_password_handler(user, body.to_vec()).await;
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
