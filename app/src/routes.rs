// app/src/routes.rs
//
// Custom API routes and static file service for the application.

use std::path::Path;

use axum::{Router, extract::State, routing::get};
use tower_http::services::{ServeDir, ServeFile};
use trailbase::AppState;

use crate::settings::{FrontendSettings, PasswordAuthEnabled};

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
    axum::Extension(PasswordAuthEnabled(password_auth_enabled)): axum::Extension<
        PasswordAuthEnabled,
    >,
) -> axum::Json<serde_json::Value> {
    let (registration_enabled, otp_enabled) = state.access_config(|c| {
        let registration_enabled = !c.auth.disable_password_auth.unwrap_or(false);
        let otp_enabled = c.auth.enable_otp_signin();

        (registration_enabled, otp_enabled)
    });

    axum::Json(serde_json::json!({
        "passwordAuthEnabled": password_auth_enabled,
        "registrationEnabled": registration_enabled,
        "otpEnabled": otp_enabled,
    }))
}
