mod components;
mod frontend;
mod logging;
mod preflight;
mod routes;
mod settings;
mod smtp;
mod trailbase_bootstrap;

use settings::{ActiveComponent, PublicConfig, Settings};
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

    match settings.components.active {
        ActiveComponent::AuthUi => {
            components::ensure_auth_ui(&manifest_dir, settings.components.vendor_auth_ui)?
        }
        ActiveComponent::TrailAuth => {
            components::ensure_trail_auth(&manifest_dir, settings.components.vendor_auth_ui)?
        }
    };

    let _bun_watch = frontend::start(&settings.frontend, &manifest_dir.join("ui"))?;

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

    let public_config = PublicConfig {
        password_auth_enabled: settings.frontend.password_auth_enabled.unwrap_or(true),
    };

    let interceptor = smtp::setup(&settings.mailcrab);

    let base_router = axum::Router::new()
        .merge(routes::build(state))
        .merge(main_router.1)
        .fallback_service(routes::static_files(&settings.frontend, &manifest_dir))
        .layer(axum::Extension(public_config));

    let (router, smtp_handle) = smtp::mount(interceptor, base_router);

    info!("Server running at http://{}", settings.server.address);
    let (cleanup_sender, _cleanup_receiver) = tokio::sync::oneshot::channel::<()>();
    trailbase::api::serve((main_router.0, router), admin_router, tls, cleanup_sender).await?;

    smtp::shutdown(smtp_handle);

    Ok(())
}
