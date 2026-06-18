// app/src/routes.rs
//
// Custom API routes and static file service for the application.

use std::path::Path;

use axum::{
    Router,
    body::Body,
    extract::State,
    http::{StatusCode, Uri, header},
    response::Response,
    routing::get,
};
use tower_http::services::{ServeDir, ServeFile};
use trailbase::AppState;

use crate::frontend_assets::Assets;
use crate::settings::frontend::{FrontendSettings, PublicConfig};

/// Build the custom API router.
///
/// Receives the TrailBase AppState so handlers can read live config values
/// (e.g. disable_password_auth) without an extra HTTP round-trip.
///
/// Routes:
///   GET /api/health         — liveness probe
///   GET /api/hello          — example JSON endpoint
///   GET /api/config/public  — public config flags for the frontend
pub fn build(state: AppState) -> Router {
    Router::new()
        .route("/api/health", get(health_check))
        .route("/api/hello", get(hello_handler))
        .route("/api/config/public", get(public_config_handler))
        .with_state(state)
}

/// Build the static file service that serves the SPA with an index.html fallback.
pub fn static_files(settings: &FrontendSettings, manifest_dir: &Path) -> ServeDir<ServeFile> {
    let public_dir = settings.resolve_public_dir(manifest_dir);
    ServeDir::new(&public_dir).fallback(ServeFile::new(public_dir.join("index.html")))
}

/// Serve a file from the embedded frontend assets (rust-embed).
///
/// SPA-aware: paths without a file extension fall back to `index.html` so
/// client-side routes (e.g. `/profile`) work on direct navigation. Paths
/// with an extension that are not in the asset set return a real 404.
///
/// Cache headers:
///   - `index.html` → `no-cache` (always revalidate SPA entry point)
///   - hashed assets → `public, max-age=31536000, immutable`
pub async fn embedded_static_handler(uri: Uri) -> Response {
    let path = uri.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    // Direct asset hit.
    if let Some(file) = Assets::get(path) {
        return embedded_response(path, file);
    }

    // SPA fallback: extension-less paths are client-side routes.
    if Path::new(path).extension().is_none() {
        if let Some(file) = Assets::get("index.html") {
            return embedded_response("index.html", file);
        }
    }

    // Extension-bearing path not found → real 404.
    not_found().await
}

/// Build a `Response` from a single embedded file with cache headers.
fn embedded_response(path: &str, file: rust_embed::EmbeddedFile) -> Response {
    let mime = mime_guess::from_path(path).first_or_octet_stream();
    let cache_control = if path == "index.html" {
        "no-cache"
    } else {
        "public, max-age=31536000, immutable"
    };

    Response::builder()
        .header(header::CONTENT_TYPE, mime.as_ref())
        .header(header::CACHE_CONTROL, cache_control)
        .body(Body::from(file.data.into_owned()))
        .unwrap()
}

async fn not_found() -> Response {
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(Body::from("404"))
        .unwrap()
}

async fn health_check() -> &'static str {
    "OK"
}

async fn hello_handler() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({"message": "Hello!"}))
}

/// Return public configuration flags to the frontend.
///
/// Reads `disable_password_auth` and `oauth_providers` from the live TrailBase
/// config. Changes made through the admin panel are reflected immediately without
/// a server restart.
///
/// `passwordAuthEnabled` reflects the app-level setting from `appsettings.toml`
/// and controls whether password-based login, registration, and OTP UI is shown.
async fn public_config_handler(
    State(state): State<AppState>,
    axum::Extension(config): axum::Extension<PublicConfig>,
) -> axum::Json<serde_json::Value> {
    let (registration_enabled, otp_enabled) = state.access_config(|c| {
        let registration_enabled = !c.auth.disable_password_auth.unwrap_or(false);
        let otp_enabled = c.auth.enable_otp_signin();

        (registration_enabled, otp_enabled)
    });

    axum::Json(serde_json::json!({
        "passwordAuthEnabled": config.password_auth_enabled,
        "registrationEnabled": registration_enabled,
        "otpEnabled": otp_enabled,
    }))
}
