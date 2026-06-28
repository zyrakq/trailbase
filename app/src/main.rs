mod components;
mod frontend;
mod frontend_assets;
mod logging;
mod preflight;
mod routes;
mod settings;
mod smtp;
mod subscriptions;
mod trailbase_bootstrap;

use axum::routing::get;
use settings::{frontend::PublicConfig, loader::Settings};
use std::path::PathBuf;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let _ = dotenvy::dotenv();

    logging::init();

    tokio_rustls::rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");

    let settings = Settings::load()?;
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));

    for entry in &settings.components.items {
        components::ensure_component(entry, &settings.components, &manifest_dir).await?;
    }

    let _frontend_handle = frontend::start(&settings.frontend, &manifest_dir)?;

    // Detect first start BEFORE Server::init() creates a default config.textproto.
    let data_dir = manifest_dir.join("traildepot");
    let is_first_start = !data_dir.join("config.textproto").exists();

    let trailbase::Server {
        state,
        main_router,
        admin_router,
        tls,
    } = trailbase::Server::init(trailbase::ServerOptions {
        data_dir: trailbase::DataDir(data_dir),
        address: settings.server.address.clone(),
        ..Default::default()
    })
    .await?;

    // Apply bootstrap settings only when this is a fresh TrailBase install.
    // The bootstrap is a one-time operation — if config.textproto already
    // existed before init(), operator changes are preserved unchanged.
    if is_first_start {
        trailbase_bootstrap::apply_bootstrap(&state, &settings.trailbase, &settings.mailcrab)
            .await?;
    }

    let public_config = PublicConfig::from_settings(&settings.frontend, &settings.branding);
    let branding_overlay_config = settings
        .branding
        .overlay_config(&settings.frontend, &manifest_dir);
    let uploads_overlay_config = settings.uploads.overlay_config();

    let interceptor = smtp::setup(&settings.mailcrab);

    let base_router = axum::Router::new()
        .merge(routes::build(state))
        .merge(main_router.1)
        // CookieManagerLayer is applied inside TrailBase's wrap_with_default_layers() only to
        // its own routes. Our custom routes are merged outside that boundary, so we add the
        // layer here to cover the whole base router uniformly.
        .layer(tower_cookies::CookieManagerLayer::new());

    let base_router = match settings.frontend.effective_serve_from() {
        "embedded" => {
            info!("Serving frontend from embedded assets");
            base_router.fallback_service(get(routes::embedded_static_handler))
        }
        _ => {
            info!("Serving frontend from disk (ui/dist)");
            base_router.fallback_service(routes::static_files(&settings.frontend, &manifest_dir))
        }
    };

    let base_router = base_router
        .layer(axum::Extension(public_config))
        .layer(axum::Extension(branding_overlay_config))
        .layer(axum::Extension(uploads_overlay_config));

    let (router, smtp_handle) = smtp::mount(interceptor, base_router);

    info!("Server running at http://{}", settings.server.address);
    let (cleanup_sender, _cleanup_receiver) = tokio::sync::oneshot::channel::<()>();
    trailbase::api::serve((main_router.0, router), admin_router, tls, cleanup_sender).await?;

    smtp::shutdown(smtp_handle);

    Ok(())
}
