// Shared helper module — inlined into the build script so both contexts use
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

    if std::env::var("APP_SKIP_WASM").as_deref() == Ok("1") {
        println!("cargo::warning=APP_SKIP_WASM=1: skipping WASM build");
        return;
    }

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

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
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
