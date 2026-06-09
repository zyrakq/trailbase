mod components;
mod frontend;
mod logging;
mod preflight;
mod routes;
mod settings;

use settings::{PasswordAuthEnabled, Settings};
use std::{net::IpAddr, path::PathBuf, str::FromStr};
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

    components::ensure_auth_ui(&manifest_dir)?;

    let _bun_watch = frontend::start(&settings.frontend, &manifest_dir.join("ui"))?;

    let trailbase::Server {
        state,
        main_router,
        admin_router,
        tls,
    } = trailbase::Server::init(trailbase::ServerOptions {
        data_dir: trailbase::DataDir(manifest_dir.join("traildepot")),
        address: settings.server.address.clone(),
        ..Default::default()
    })
    .await?;

    let password_auth_enabled =
        PasswordAuthEnabled(settings.frontend.password_auth_enabled.unwrap_or(true));

    // Conditionally embed the mailcrab email-intercept UI under /emails.
    // Only active when settings.email.dev_intercept = true (development only).
    let (mailcrab_nest, mailcrab_handle) = if settings.email.dev_intercept {
        let smtp_host = IpAddr::from_str("127.0.0.1").expect("valid loopback address");
        let smtp_port: u16 = 1025;
        let (router, handle) =
            mailcrab_backend::mailcrab_router("/emails", smtp_host, smtp_port);
        info!("Mailcrab email interceptor active at /emails (SMTP :{})", smtp_port);
        (Some(router), Some(handle))
    } else {
        (None, None)
    };

    let mut router = axum::Router::new()
        .merge(routes::build(state))
        .merge(main_router.1)
        .fallback_service(routes::static_files(&settings.frontend, &manifest_dir))
        .layer(axum::Extension(password_auth_enabled));

    if let Some(mc_router) = mailcrab_nest {
        router = axum::Router::new()
            .nest("/emails", mc_router)
            .merge(router);
    }

    info!("Server running at http://{}", settings.server.address);
    trailbase::api::serve((main_router.0, router), admin_router, tls).await?;

    // Cancel mailcrab background tasks after the server has shut down.
    if let Some(handle) = mailcrab_handle {
        handle.token.cancel();
    }

    Ok(())
}
