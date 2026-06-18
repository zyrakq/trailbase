// Companion module for `app/build.rs`.
//
// Holds the pure parsing logic for the `[components]` section of
// `appsettings*.toml`. Extracted from the build script so it can be unit
// tested from the same package via `cargo test -p server`.
//
// `build.rs` inlines this file with `include!("src/build_settings.rs")` so
// the build script and the server crate share one source of truth.
//
// `use` statements at the top of this file become part of build.rs's
// scope at the point of inclusion. `#[cfg(test)]` blocks are not compiled
// when build.rs is built (cfg(test) is not set for build scripts), so the
// `indoc` dev-dependency does not leak into build-dependencies.

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

#[cfg(test)]
mod tests {
    use super::*;
    use config::FileFormat;
    use indoc::indoc;

    fn settings_from_toml(toml: &str) -> Result<BuildSettings, ConfigError> {
        Config::builder()
            .add_source(File::from_str(toml, FileFormat::Toml))
            .build()?
            .try_deserialize()
    }

    #[test]
    fn build_only_extracts_build_package() {
        let toml = indoc! {r#"
            [components]
            rebuild = false

            [[components.items]]
            name = "trail_auth"
            wasm = "trail_auth_component.wasm"
            source = { build = "trail-auth-component" }
        "#};
        let s = settings_from_toml(toml).expect("should deserialize");
        assert_eq!(extract_build_packages(&s), vec!["trail-auth-component"]);
    }

    #[test]
    fn fetch_only_yields_no_packages() {
        let toml = indoc! {r#"
            [[components.items]]
            name = "auth_ui"
            wasm = "auth_ui_component.wasm"
            source = { fetch = "trailbase/auth_ui" }
        "#};
        let s = settings_from_toml(toml).expect("should deserialize");
        assert!(
            extract_build_packages(&s).is_empty(),
            "fetch-only items must not produce any build packages"
        );
    }

    #[test]
    fn mixed_picks_out_only_build_entries() {
        let toml = indoc! {r#"
            [[components.items]]
            name = "auth_ui"
            wasm = "auth_ui_component.wasm"
            source = { fetch = "trailbase/auth_ui" }

            [[components.items]]
            name = "trail_auth"
            wasm = "trail_auth_component.wasm"
            source = { build = "trail-auth-component" }
        "#};
        let s = settings_from_toml(toml).expect("should deserialize");
        assert_eq!(extract_build_packages(&s), vec!["trail-auth-component"]);
    }

    #[test]
    fn empty_items_array_yields_no_packages() {
        let toml = indoc! {r#"
            [components]
            items = []
        "#};
        let s = settings_from_toml(toml).expect("should deserialize");
        assert!(
            extract_build_packages(&s).is_empty(),
            "empty items array must produce no build packages"
        );
    }

    #[test]
    fn no_components_section_yields_no_packages() {
        let s = settings_from_toml("").expect("should deserialize without components section");
        assert!(
            extract_build_packages(&s).is_empty(),
            "missing [components] section must produce no build packages"
        );
    }
}
