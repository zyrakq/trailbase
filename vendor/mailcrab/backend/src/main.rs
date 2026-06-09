use mailcrab::{MailMessage, mail_server};
use std::{
    env,
    net::IpAddr,
    process,
    str::FromStr,
    sync::Arc,
};
use tokio::{signal, task::JoinSet, time::Duration};
use tokio_util::sync::CancellationToken;
use tracing::{error, info};
use tracing_subscriber::{prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt};

use crate::{storage::storage, web_server::web_server};

mod app_state;
mod storage;
mod web_server;

#[cfg(test)]
mod tests;

use app_state::{AppState, Asset, VERSION, load_index};

/// get a configuration from the environment or return default value
fn parse_env_var<T: FromStr>(name: &'static str, default: T) -> T {
    env::var(name)
        .unwrap_or_default()
        .parse::<T>()
        .unwrap_or(default)
}

async fn run() -> i32 {
    let smtp_host: IpAddr = parse_env_var("SMTP_HOST", [0, 0, 0, 0].into());
    let http_host: IpAddr = parse_env_var("HTTP_HOST", [127, 0, 0, 1].into());
    let smtp_port: u16 = parse_env_var("SMTP_PORT", 1025);
    let http_port: u16 = parse_env_var("HTTP_PORT", 1080);
    let queue_capacity: usize = parse_env_var("QUEUE_CAPACITY", 32);

    // Enable auth implicitly enable TLS
    let enable_tls_auth: bool = std::env::var("ENABLE_TLS_AUTH").map_or_else(
        |_| false,
        |v| v.to_ascii_lowercase().parse().unwrap_or(false),
    );

    // construct path prefix
    let prefix = std::env::var("MAILCRAB_PREFIX").unwrap_or_default();
    let prefix = format!("/{}", prefix.trim_matches('/'));

    // optional retention period, the default is 0 - which means messages are kept forever
    let retention_period: u64 = parse_env_var("MAILCRAB_RETENTION_PERIOD", 0);

    info!(
        "MailCrab HTTP server starting on {http_host}:{http_port} and SMTP server on {smtp_host}:{smtp_port}"
    );

    // initialize internal broadcast queue
    let (tx, rx) = tokio::sync::broadcast::channel::<MailMessage>(queue_capacity);
    let storage_rx = rx.resubscribe();
    let app_state = Arc::new(AppState {
        rx,
        storage: Default::default(),
        index: load_index(&prefix).ok(),
        prefix,
        retention_period: Duration::from_secs(retention_period),
    });

    // store broadcasted messages in a key/value store
    let state = app_state.clone();

    // join multiple tasks and handle graceful shutdown on signals
    let token = CancellationToken::new();
    let abort_token = CancellationToken::new();
    let mut set = JoinSet::new();

    set.spawn(storage(storage_rx, state, token.clone()));
    set.spawn(mail_server(
        smtp_host,
        smtp_port,
        tx,
        enable_tls_auth,
        token.clone(),
    ));
    set.spawn(web_server(http_host, http_port, app_state, token.clone()));

    tokio::spawn({
        let abort_token = abort_token.clone();
        async move {
            shutdown_signal().await;
            info!("Received shutdown signal");
            token.cancel();
            tokio::time::sleep(Duration::from_secs(5)).await;
            abort_token.cancel();
        }
    });

    loop {
        tokio::select! {
            r = set.join_next() => match r {
                Some(Ok(_)) => {},
                Some(Err(e)) => error!("{e}"),
                None => {
                    info!("MailCrab graceful shutdown successful");

                    return 0;
                },
            },
            _ = abort_token.cancelled() => {
                set.abort_all();
                error!("MailCrab service aborted");

                return 1;
            }
        }
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

#[tokio::main]
async fn main() {
    // initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "mailcrab_backend=info,tower_http=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let exit_code = run().await;

    process::exit(exit_code);
}
