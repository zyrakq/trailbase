use mailcrab::{Error, MailMessage, MessageId, Result};
use rust_embed::{EmbeddedFile, RustEmbed};
use std::{collections::HashMap, sync::RwLock};
use tokio::{sync::broadcast::Receiver, time::Duration};

/// Application state: holds all messages, a message queue, and configuration.
pub struct AppState {
    pub rx: Receiver<MailMessage>,
    pub storage: RwLock<HashMap<MessageId, MailMessage>>,
    pub prefix: String,
    pub index: Option<String>,
    pub retention_period: Duration,
}

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
pub struct Asset;

/// Retrieve the version from Cargo.toml.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Preload the HTML for the index, replacing dynamic asset paths with the given prefix.
pub fn load_index(path_prefix: &str) -> Result<String> {
    let index: EmbeddedFile = Asset::get("index.html")
        .ok_or_else(|| Error::WebServer("Could not load index.html".to_owned()))?;
    let index = String::from_utf8_lossy(&index.data);
    let path_prefix = if path_prefix == "/" { "" } else { path_prefix };

    Ok(index
        .replace("href=\"/", &format!("href=\"{path_prefix}/static/"))
        .replace(
            "'/mailcrab-frontend",
            &format!("'{path_prefix}/static/mailcrab-frontend"),
        ))
}
