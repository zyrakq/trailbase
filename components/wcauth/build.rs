use std::process::Command;

fn main() {
    // Re-run this build script when UI source changes.
    println!("cargo::rerun-if-changed=ui/src");
    println!("cargo::rerun-if-changed=ui/xliff");
    println!("cargo::rerun-if-changed=ui/lit-localize.json");
    println!("cargo::rerun-if-changed=ui/vite.config.ts");
    println!("cargo::rerun-if-changed=ui/package.json");

    if std::env::var("APP_SKIP_WASM").as_deref() == Ok("1") {
        println!("cargo::warning=APP_SKIP_WASM=1: skipping wcauth UI build");
        return;
    }

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let ui_dir = std::path::Path::new(&manifest_dir).join("ui");

    // Install npm dependencies if node_modules is missing.
    if !ui_dir.join("node_modules").exists() {
        println!("cargo::warning=Installing wcauth UI dependencies...");
        let status = Command::new("bun")
            .arg("install")
            .current_dir(&ui_dir)
            .status()
            .expect("failed to run bun install for wcauth UI");
        if !status.success() {
            panic!("bun install failed for wcauth UI");
        }
    }

    println!("cargo::warning=Building wcauth UI bundle...");
    let status = Command::new("bun")
        .args(["run", "build"])
        .current_dir(&ui_dir)
        .status()
        .expect("failed to run bun run build for wcauth UI");
    if !status.success() {
        panic!("wcauth UI build failed");
    }
}
