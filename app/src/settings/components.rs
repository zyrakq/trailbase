use serde::Deserialize;

/// Which auth UI WASM component is active.
///
/// Controls which component `ensure_auth_component` installs on startup.
/// Switch via `[components] active = "trail_auth"` in appsettings.
#[derive(Debug, Default, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActiveComponent {
    #[default]
    AuthUi,
    TrailAuth,
}

/// Settings for TrailBase WASM component management.
#[derive(Debug, Default, Deserialize)]
pub struct ComponentSettings {
    /// Which auth UI component to install. Defaults to `auth_ui`.
    #[serde(default)]
    pub active: ActiveComponent,
    /// When true, copy the active component from the local build output instead
    /// of downloading via `trail components add`.
    #[serde(default)]
    pub vendor_auth_ui: bool,
    /// When true, always overwrite the deployed wasm even if it already exists.
    /// Useful during active development to avoid manual wasm deletion.
    /// Set via `APP_COMPONENTS__FORCE_REPLACE=true` to avoid touching toml files.
    #[serde(default)]
    pub force_replace: bool,
}
