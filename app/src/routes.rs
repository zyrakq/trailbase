// app/src/routes.rs
//
// Custom API routes and static file service for the application.

use std::path::Path;

use axum::{extract::State, routing::get, Router};
use tower_http::services::{ServeDir, ServeFile};
use trailbase::AppState;

use crate::settings::FrontendSettings;

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
        .route(
            "/_/auth/reset_password/update/{token}",
            get(password_reset_redirect),
        )
        .with_state(state)
}

/// Build the static file service that serves the SPA with an index.html fallback.
pub fn static_files(settings: &FrontendSettings, manifest_dir: &Path) -> ServeDir<ServeFile> {
    let public_dir = settings.resolve_public_dir(manifest_dir);
    ServeDir::new(&public_dir).fallback(ServeFile::new(public_dir.join("index.html")))
}

async fn health_check() -> &'static str {
    "OK"
}

async fn hello_handler() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({"message": "Hello!"}))
}

/// Return public configuration flags to the frontend.
///
/// Reads `disable_password_auth` from the live TrailBase config — the same
/// value the TrailBase register endpoint enforces. Changes made through the
/// admin panel are reflected immediately without a server restart.
async fn public_config_handler(
    State(state): State<AppState>,
) -> axum::Json<serde_json::Value> {
    let registration_enabled =
        state.access_config(|c| !c.auth.disable_password_auth.unwrap_or(false));
    axum::Json(serde_json::json!({ "registrationEnabled": registration_enabled }))
}

/// Intercept TrailBase's default password-reset email link and redirect to the SPA page.
///
/// TrailBase sends reset emails pointing to `/_/auth/reset_password/update/{TOKEN}`.
/// Because our router is merged before TrailBase's, this handler takes precedence and
/// redirects the browser to our SPA page with the token in the query string.
async fn password_reset_redirect(
    axum::extract::Path(token): axum::extract::Path<String>,
) -> impl axum::response::IntoResponse {
    let location = format!("/reset-password?token={}", token);
    axum::response::Redirect::to(&location)
}
