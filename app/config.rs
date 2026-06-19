use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

// Minimal local model for the `[components]` section used at build time.
// Deliberately a small subset of `settings::components::ComponentSettings`:
// build.rs only needs the package names from `source.build` items so it can
// run `cargo build -p <pkg> --target wasm32-wasip2` for each.
#[derive(Debug, Default, Deserialize)]
pub struct BuildSettings {
    #[serde(default)]
    pub components: BuildComponents,
}

#[derive(Debug, Default, Deserialize)]
pub struct BuildComponents {
    #[serde(default)]
    pub items: Vec<BuildItem>,
}

#[derive(Debug, Deserialize)]
pub struct BuildItem {
    #[serde(default)]
    pub source: BuildItemSource,
}

#[derive(Debug, Default, Deserialize)]
pub struct BuildItemSource {
    #[serde(default)]
    pub build: Option<String>,
}

/// Layered loader matching `settings::loader::Settings::load`:
///
///   1. `appsettings.toml`            - required base
///   2. `appsettings.{env}.toml`      - optional env-specific
///   3. `appsettings.local.toml`      - optional local overrides
///   4. `APP_*` env vars with `prefix_separator("_")` / `separator("__")` / `try_parsing(true)`
///
/// `env` is the resolved APP_ENV value (caller passes it in, defaulting to
/// `"development"` before calling).
pub fn parse_build_packages(manifest_dir: &str, env: &str) -> Result<Vec<String>, ConfigError> {
    let config = Config::builder()
        .add_source(File::with_name(&format!("{manifest_dir}/appsettings")).required(true))
        .add_source(
            File::with_name(&format!("{manifest_dir}/appsettings.{env}")).required(false),
        )
        .add_source(
            File::with_name(&format!("{manifest_dir}/appsettings.local")).required(false),
        )
        .add_source(
            Environment::with_prefix("APP")
                .prefix_separator("_")
                .separator("__")
                .try_parsing(true),
        )
        .build()?;

    let settings: BuildSettings = config.try_deserialize()?;
    Ok(extract_build_packages(&settings))
}

/// Pure: collect package names from items whose `source.build` is set.
pub fn extract_build_packages(settings: &BuildSettings) -> Vec<String> {
    settings
        .components
        .items
        .iter()
        .filter_map(|item| item.source.build.clone())
        .collect()
}
