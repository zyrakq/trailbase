use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct FrontendSettings {
    pub build: bool,
    pub watch: bool,
    /// Empty string means "derive from CARGO_MANIFEST_DIR at runtime in main.rs".
    pub public_dir: String,
    pub password_auth_enabled: Option<bool>,
}

/// Settings visible to every request handler via `axum::Extension<PublicConfig>`.
///
/// Add fields here when a handler needs a value from `appsettings.toml`
/// without requiring access to the full `Settings` tree.
#[derive(Clone, Copy)]
pub struct PublicConfig {
    pub password_auth_enabled: bool,
}

impl FrontendSettings {
    /// Resolve the directory from which static frontend assets are served.
    ///
    /// Uses `public_dir` when set; falls back to `<manifest_dir>/ui/dist`.
    pub fn resolve_public_dir(&self, manifest_dir: &std::path::Path) -> std::path::PathBuf {
        if self.public_dir.is_empty() {
            manifest_dir.join("ui/dist")
        } else {
            std::path::PathBuf::from(&self.public_dir)
        }
    }
}
