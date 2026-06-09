// app/src/routes.rs
//
// Custom API routes and static file service for the application.

use std::path::Path;

use axum::{extract::State, routing::get, Router};
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
/// Reads `disable_password_auth` and `oauth_providers` from the live TrailBase
/// config. Changes made through the admin panel are reflected immediately without
/// a server restart.
///
/// `passwordAuthEnabled` reflects the app-level setting from `appsettings.toml`
/// and controls whether password-based login, registration, and OTP UI is shown.
async fn public_config_handler(
    State(state): State<AppState>,
    axum::Extension(PasswordAuthEnabled(password_auth_enabled)): axum::Extension<PasswordAuthEnabled>,
) -> axum::Json<serde_json::Value> {
    let (registration_enabled, otp_enabled, oauth_providers) = state.access_config(|c| {
        let registration_enabled = !c.auth.disable_password_auth.unwrap_or(false);
        let otp_enabled = c.auth.enable_otp_signin();

        let oauth_providers: Vec<serde_json::Value> = c
            .auth
            .oauth_providers
            .iter()
            .map(|(key, provider_config)| {
                let provider_id = provider_config.provider_id.unwrap_or(0);
                let (display_name, img_name) = provider_meta(
                    provider_id,
                    provider_config.display_name.as_deref(),
                );
                serde_json::json!({
                    "key": key,
                    "displayName": display_name,
                    "imgName": img_name,
                })
            })
            .collect();

        (registration_enabled, otp_enabled, oauth_providers)
    });

    axum::Json(serde_json::json!({
        "passwordAuthEnabled": password_auth_enabled,
        "registrationEnabled": registration_enabled,
        "otpEnabled": otp_enabled,
        "oauthProviders": oauth_providers,
    }))
}

/// Map a TrailBase `OAuthProviderId` integer to a display name and icon filename.
///
/// The `display_name` proto field (if set in config.textproto) takes precedence
/// over the default derived from the provider type. Integer values match the
/// `OAuthProviderId` enum in `trailbase/crates/core/proto/config.proto`.
fn provider_meta(provider_id: i32, display_name: Option<&str>) -> (String, &'static str) {
    let img_name = match provider_id {
        9  => "apple.svg",
        10 => "discord.svg",
        11 => "gitlab.svg",
        12 => "google.svg",
        13 => "facebook.svg",
        14 => "microsoft.svg",
        15 => "twitch.svg",
        16 => "yandex.svg",
        17 => "github.svg",
        _  => "oidc.svg",  // OIDC0 (2) and unknown providers
    };

    let default_name = match provider_id {
        9  => "Apple",
        10 => "Discord",
        11 => "GitLab",
        12 => "Google",
        13 => "Facebook",
        14 => "Microsoft",
        15 => "Twitch",
        16 => "Yandex",
        17 => "GitHub",
        _  => "OIDC",
    };

    let name = display_name.unwrap_or(default_name).to_string();
    (name, img_name)
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
