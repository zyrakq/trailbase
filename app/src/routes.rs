// app/src/routes.rs
//
// Custom API routes and static file service for the application.

use std::path::Path;

use axum::{
    Router,
    body::Body,
    extract::State,
    http::{header, StatusCode, Uri},
    response::Response,
    routing::get,
};
use tower_http::services::{ServeDir, ServeFile};
use trailbase::AppState;

use crate::frontend_assets::Assets;
use crate::settings::branding::{
    resolve_branding_path, sanitize_branding_rel, BrandingOverlayConfig, BrandingSource,
};
use crate::settings::frontend::{FrontendSettings, PublicConfig};

pub fn build(state: AppState) -> Router {
    Router::new()
        .route("/api/health", get(health_check))
        .route("/api/hello", get(hello_handler))
        .route("/api/config/public", get(public_config_handler))
        .route("/branding/{*path}", get(branding_handler))
        .route(
            "/api/subscriptions/subscribe",
            axum::routing::post(crate::subscriptions::subscribe_handler),
        )
        .route(
            "/api/subscriptions/cancel/{id}",
            axum::routing::post(crate::subscriptions::cancel_handler),
        )
        .route(
            "/api/subscriptions/catalog",
            axum::routing::get(crate::subscriptions::catalog_handler),
        )
        .route(
            "/api/subscriptions/mine",
            axum::routing::get(crate::subscriptions::mine_handler),
        )
        .route(
            "/api/admin/subscriptions",
            axum::routing::post(crate::subscriptions::create_subscription_handler),
        )
        .route(
            "/api/admin/subscriptions/{id}",
            axum::routing::put(crate::subscriptions::update_subscription_handler),
        )
        .route(
            "/api/admin/subscriptions/{id}/archive",
            axum::routing::put(crate::subscriptions::archive_subscription_handler),
        )
        .route(
            "/api/admin/subscriptions/{id}/restore",
            axum::routing::put(crate::subscriptions::restore_subscription_handler),
        )
        .route(
            "/api/admin/subscriptions/{id}",
            axum::routing::delete(crate::subscriptions::delete_subscription_handler),
        )
        .with_state(state)
}

pub fn static_files(settings: &FrontendSettings, manifest_dir: &Path) -> ServeDir<ServeFile> {
    let public_dir = settings.resolve_public_dir(manifest_dir);
    ServeDir::new(&public_dir).fallback(ServeFile::new(public_dir.join("index.html")))
}

pub async fn embedded_static_handler(uri: Uri) -> Response {
    let path = uri.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    if let Some(file) = Assets::get(path) {
        return embedded_response(path, file);
    }

    if Path::new(path).extension().is_none() {
        if let Some(file) = Assets::get("index.html") {
            return embedded_response("index.html", file);
        }
    }

    not_found().await
}

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
        "brandName": config.brand_name,
        "themeColorLight": config.theme_color_light,
        "themeColorDark": config.theme_color_dark,
        "copyrightYear": config.copyright_year,
        "termsUrl": config.terms_url,
        "privacyUrl": config.privacy_url,
        "supportUrl": config.support_url,
    }))
}

pub async fn branding_handler(
    uri: Uri,
    axum::Extension(cfg): axum::Extension<BrandingOverlayConfig>,
) -> Response {
    let path = uri.path().trim_start_matches('/');
    let Some(rel) = path.strip_prefix("branding/") else {
        return not_found().await;
    };
    let Some(rel) = sanitize_branding_rel(rel) else {
        return not_found().await;
    };

    match resolve_branding_path(rel, cfg.volume_dir.as_deref(), cfg.disk_base.as_deref()) {
        BrandingSource::Disk(file_path) => match std::fs::read(&file_path) {
            Ok(bytes) => branding_file_response(rel, bytes),
            Err(_) => not_found().await,
        },
        BrandingSource::Embedded => match Assets::get(&format!("branding/{rel}")) {
            Some(file) => branding_file_response(rel, file.data.into_owned()),
            None => not_found().await,
        },
        BrandingSource::NotFound => not_found().await,
    }
}

fn branding_file_response(rel: &str, data: Vec<u8>) -> Response {
    let mime = mime_guess::from_path(rel).first_or_octet_stream();
    Response::builder()
        .header(header::CONTENT_TYPE, mime.as_ref())
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from(data))
        .unwrap()
}
