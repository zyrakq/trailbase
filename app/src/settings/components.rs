use serde::Deserialize;

// How to obtain a WASM component.
//
// `Build`  — compile locally via `cargo build -p <package> --target wasm32-wasip2`.
// `Fetch`  — download via `trail components add <name-or-url>`.
//
// TOML shape (exactly one key per source):
//   source = { build = "auth-ui-component" }
//   source = { fetch = "trailbase/auth_ui" }
//   source = { fetch = "https://example.com/bundle.zip", zip_name = "auth_ui.wasm" }
#[derive(Debug, Clone, PartialEq)]
pub enum ComponentSource {
    // Package name to compile via `cargo build -p <package> --target wasm32-wasip2`.
    Build(String),
    // Name or URL to fetch. `zip_name` overrides the filename searched for
    // inside a zip archive (defaults to `entry.wasm` when absent).
    Fetch {
        fetch: String,
        zip_name: Option<String>,
    },
}

impl<'de> Deserialize<'de> for ComponentSource {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // Internal helper: try each key shape in order. The untagged attribute
        // means serde picks the first variant whose fields all match the input.
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum Helper {
            Build { build: String },
            Fetch {
                fetch: String,
                #[serde(default)]
                zip_name: Option<String>,
            },
        }

        match Helper::deserialize(deserializer)? {
            Helper::Build { build } => Ok(Self::Build(build)),
            Helper::Fetch { fetch, zip_name } => Ok(Self::Fetch { fetch, zip_name }),
        }
    }
}

// One entry in the `[[components.items]]` array.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct ComponentEntry {
    // Logical name for logs and identification.
    pub name: String,
    // File name that must sit in traildepot/wasm/ after installation.
    // Must be a plain filename — no path separators, no `..`, no absolute paths.
    pub wasm: String,
    // How to obtain the component.
    pub source: ComponentSource,
    // Per-item override of the global `rebuild` default (build-components only).
    #[serde(default)]
    pub rebuild: Option<bool>,
    // Per-item override of the global `refetch` default (fetch-components only).
    #[serde(default)]
    pub refetch: Option<bool>,
}

// WASM component loading settings — the `[components]` section.
//
// Read by both runtime (`loader.rs` -> `main.rs`) and `build.rs` as the single
// source of truth for which WASM components to install and how.
#[derive(Debug, Default, Deserialize)]
pub struct ComponentSettings {
    // Global default for build-components: always copy the fresh artifact from
    // target/ over the existing one in traildepot/wasm/.
    #[serde(default)]
    pub rebuild: bool,
    // Global default for fetch-components: always re-run `trail components add`
    // even when the file is already present.
    #[serde(default)]
    pub refetch: bool,
    // The list of components to install. May be empty (no wasm needed).
    #[serde(default)]
    pub items: Vec<ComponentEntry>,
}
