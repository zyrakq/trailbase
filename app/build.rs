use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo::rerun-if-changed=../vendor/trailbase/crates/auth-ui/src");
    println!("cargo::rerun-if-changed=../vendor/trailbase/crates/auth-ui/ui/src");
    println!("cargo::rerun-if-changed=../components/trail-auth/src");
    println!("cargo::rerun-if-changed=../components/trail-auth/ui/src");

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

    // APP_WASM_PACKAGE selects which component to build.
    // Set in .cargo/config.toml [env] to switch between auth-ui-component and
    // trail-auth-component without touching build scripts.
    let package = std::env::var("APP_WASM_PACKAGE")
        .unwrap_or_else(|_| "trail-auth-component".to_string());

    let cargo = std::env::var("CARGO").unwrap_or_else(|_| "cargo".to_string());
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let workspace_dir = Path::new(&manifest_dir)
        .parent()
        .expect("app/ has no parent directory");

    println!("cargo::warning=Building {package} for wasm32-wasip2...");
    let status = Command::new(&cargo)
        .args(["build", "--target", "wasm32-wasip2", "--release", "-p", &package])
        .current_dir(workspace_dir)
        .status()
        .unwrap_or_else(|_| panic!("failed to invoke cargo for {package}"));

    if !status.success() {
        panic!("{package} WASM build failed");
    }
}
