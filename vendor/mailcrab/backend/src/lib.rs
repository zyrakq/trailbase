//! Public library interface for embedding mailcrab into another Axum server.

pub mod app_state;
pub mod storage;
pub mod web_server;

pub use app_state::{Asset, VERSION};

use app_state::{AppState, load_index};
use mailcrab::mail_server;
use std::{net::IpAddr, sync::Arc};
use tokio_util::sync::CancellationToken;
use axum::Router;

/// Handle returned by [`mailcrab_router`].
///
/// Cancel `token` as part of your server's shutdown sequence to stop the
/// SMTP listener and storage task gracefully.
pub struct MailcrabHandle {
    pub token: CancellationToken,
}

/// Wire up mailcrab and return an Axum [`Router`] ready to be nested.
///
/// Spawns two background tasks:
/// - SMTP listener on `smtp_host:smtp_port`
/// - Storage task (persists received messages in memory)
///
/// # Arguments
/// - `prefix` — the URL prefix under which the router will be nested (e.g. `"/emails"`).
///   Used to rewrite asset paths in the embedded `index.html`.
/// - `smtp_host` — IP address for the SMTP listener (typically `127.0.0.1` in dev)
/// - `smtp_port` — port for the SMTP listener (typically `1025`)
///
/// # Returns
/// `(Router, MailcrabHandle)` — nest the router into your Axum app; cancel the handle
/// token on shutdown.
pub fn mailcrab_router(
    prefix: &str,
    smtp_host: IpAddr,
    smtp_port: u16,
) -> (Router, MailcrabHandle) {
    const QUEUE_CAPACITY: usize = 32;
    const RETENTION_SECS: u64 = 0; // keep forever

    let (tx, rx) = tokio::sync::broadcast::channel(QUEUE_CAPACITY);
    let storage_rx = rx.resubscribe();

    let app_state = Arc::new(AppState {
        rx,
        storage: Default::default(),
        index: load_index(prefix).ok(),
        prefix: prefix.to_owned(),
        retention_period: tokio::time::Duration::from_secs(RETENTION_SECS),
    });

    let token = CancellationToken::new();

    // Spawn storage task
    tokio::spawn(storage::storage(
        storage_rx,
        app_state.clone(),
        token.clone(),
    ));

    // Spawn SMTP task (enable_tls_auth = false for dev intercept)
    tokio::spawn(mail_server(
        smtp_host,
        smtp_port,
        tx,
        false,
        token.clone(),
    ));

    let router = web_server::build_router(app_state);

    (router, MailcrabHandle { token })
}
