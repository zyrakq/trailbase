// Shared helper module - inlined into the build script so both contexts use
// the same parsing logic. The file lives at `app/src/build_settings.rs` so it
// can be unit tested from the server crate via `cargo test -p server`.
include!("src/build_settings.rs");

use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo::rerun-if-changed=../vendor/trailbase/crates/auth-ui/src");
    println!("cargo::rerun-if-changed=../vendor/trailbase/crates/auth-ui/ui/src");
    println!("cargo::rerun-if-changed=../components/trail-auth/src");
    println!("cargo::rerun-if-changed=../components/trail-auth/ui/src");
    println!("cargo::rerun-if-changed=appsettings.toml");
    println!("cargo::rerun-if-changed=appsettings.development.toml");
    println!("cargo::rerun-if-changed=appsettings.production.toml");
    println!("cargo::rerun-if-changed=appsettings.local.toml");

    // Frontend: re-run when dependency manifests change. Do NOT watch ui/src -
    // rust-embed watches ui/dist, and `bun watch` handles src to dist in dev.
    println!("cargo::rerun-if-changed=ui/package.json");
    println!("cargo::rerun-if-changed=ui/bun.lock");

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let ui_dir = Path::new(&manifest_dir).join("ui");

    // Always ensure ui/dist exists so the rust-embed derive in
    // frontend_assets.rs compiles - even when the build is skipped
    // (APP_SKIP_WASM=1) or bun is unavailable. An empty dist yields an empty
    // asset set; the embedded-mode sanity check in frontend::start() catches
    // a missing index.html at runtime with a clear message.
    std::fs::create_dir_all(ui_dir.join("dist"))
        .unwrap_or_else(|e| panic!("failed to create ui/dist: {e}"));

    let skip = std::env::var("APP_SKIP_WASM").as_deref() == Ok("1");

    if skip {
        println!("cargo::warning=APP_SKIP_WASM=1: skipping frontend and WASM build");
        return;
    }

    // Frontend: install deps if stale, then build. Runs before the WASM block
    // because rust-embed (compiled after build.rs) embeds ui/dist.
    build_frontend(&ui_dir);

    // -- WASM components ----------------------------------------------------
    let installed = Command::new("rustup")
        .args(["target", "list", "--installed"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    if !installed.contains("wasm32-wasip2") {
        println!(
            "cargo::warning=wasm32-wasip2 target not installed; \
             WASM component will not be built. \
             Run `rustup target add wasm32-wasip2` to enable it."
        );
        return;
    }

    let env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());

    let packages = match parse_build_packages(&manifest_dir, &env) {
        Ok(packages) => packages,
        Err(err) => {
            println!("cargo::warning=failed to load appsettings for WASM build: {err}");
            return;
        }
    };

    if packages.is_empty() {
        println!("cargo::warning=no build-components configured, skipping WASM build");
        return;
    }

    let cargo = std::env::var("CARGO").unwrap_or_else(|_| "cargo".to_string());
    let workspace_dir = Path::new(&manifest_dir)
        .parent()
        .expect("app/ has no parent directory");

    let mut args: Vec<String> = vec![
        "build".into(),
        "--target".into(),
        "wasm32-wasip2".into(),
        "--release".into(),
    ];
    for pkg in &packages {
        args.push("-p".into());
        args.push(pkg.clone());
    }

    println!("cargo::warning=Building {} for wasm32-wasip2...", packages.join(", "));
    let status = Command::new(&cargo)
        .args(&args)
        .current_dir(workspace_dir)
        // Strip host rustflags so they don't bleed into the WASM linker.
        .env_remove("CARGO_ENCODED_RUSTFLAGS")
        .env_remove("RUSTFLAGS")
        .status()
        .unwrap_or_else(|_| panic!("failed to invoke cargo for {}", packages.join(", ")));

    if !status.success() {
        panic!("WASM build failed for packages: {}", packages.join(", "));
    }
}

/// `true` if `bun install` should run: node_modules missing, or older than
/// package.json / bun.lock (deps changed since last install).
fn needs_install(ui_dir: &Path) -> bool {
    let node_modules = ui_dir.join("node_modules");
    if !node_modules.exists() {
        return true;
    }
    let nm_mtime = node_modules.metadata().and_then(|m| m.modified()).ok();
    let pkg_mtime = ui_dir
        .join("package.json")
        .metadata()
        .and_then(|m| m.modified())
        .ok();
    let lock_mtime = ui_dir
        .join("bun.lock")
        .metadata()
        .and_then(|m| m.modified())
        .ok();
    match nm_mtime {
        Some(nm) => {
            pkg_mtime.is_some_and(|p| p > nm) || lock_mtime.is_some_and(|l| l > nm)
        }
        None => true,
    }
}

/// Install frontend dependencies if stale, then run `bun run build`.
/// Panics with an actionable message on any non-zero exit (fails the cargo
/// build) - no silent failures.
fn build_frontend(ui_dir: &Path) {
    if needs_install(ui_dir) {
        println!("cargo::warning=Installing frontend dependencies...");
        let status = Command::new("bun")
            .arg("install")
            .current_dir(ui_dir)
            .status()
            .unwrap_or_else(|_| panic!(
                "failed to run `bun install` in {}; install bun from https://bun.sh/docs/installation",
                ui_dir.display()
            ));
        if !status.success() {
            panic!("bun install failed in {}", ui_dir.display());
        }
    }

    println!("cargo::warning=Building frontend...");
    let status = Command::new("bun")
        .args(["run", "build"])
        .current_dir(ui_dir)
        .status()
        .unwrap_or_else(|_| panic!(
            "failed to run `bun run build` in {}",
            ui_dir.display()
        ));
    if !status.success() {
        panic!("bun run build failed in {}", ui_dir.display());
    }
}
