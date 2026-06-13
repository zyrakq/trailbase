use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    println!("cargo::rerun-if-changed=../vendor/trailbase/crates/auth-ui/src");
    println!("cargo::rerun-if-changed=../vendor/trailbase/crates/auth-ui/ui/src");

    // Respect an opt-out env var for CI environments that do not need the WASM.
    if std::env::var("APP_SKIP_WASM").as_deref() == Ok("1") {
        println!("cargo::warning=APP_SKIP_WASM=1: skipping auth-ui-component build");
        return;
    }

    // Check that the wasm32-wasip2 target is installed before attempting the build.
    let installed = Command::new("rustup")
        .args(["target", "list", "--installed"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    if !installed.contains("wasm32-wasip2") {
        println!(
            "cargo::warning=wasm32-wasip2 target not installed; \
             auth-ui-component WASM will not be built. \
             Run `rustup target add wasm32-wasip2` to enable it."
        );
        return;
    }

    let cargo = std::env::var("CARGO").unwrap_or_else(|_| "cargo".to_string());
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");

    let workspace_dir = Path::new(&manifest_dir)
        .parent()
        .expect("app/ has no parent directory");

    println!("cargo::warning=Building auth-ui-component for wasm32-wasip2...");

    let status = Command::new(&cargo)
        .args([
            "build",
            "--target",
            "wasm32-wasip2",
            "--release",
            "-p",
            "auth-ui-component",
        ])
        .current_dir(workspace_dir)
        .status()
        .expect("failed to invoke cargo for auth-ui-component");

    if !status.success() {
        panic!("auth-ui-component WASM build failed");
    }
}
