use std::path::PathBuf;
use std::process::Command;

fn main() {
    let manifest = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let frontend = manifest.join("../frontend");

    // Re-run when frontend source changes.
    println!("cargo:rerun-if-changed={}", frontend.join("src").display());

    // Re-run (and thus rebuild) when dist/index.html is absent.
    // Cargo always re-runs a build script when a rerun-if-changed path does not exist,
    // so deleting dist/ is enough to trigger an automatic rebuild on the next cargo build.
    println!(
        "cargo:rerun-if-changed={}",
        frontend.join("dist/index.html").display()
    );

    // Clear rustflags inherited from the parent Cargo invocation — they target
    // x86_64 (e.g. mold linker args) and are invalid for wasm32-unknown-unknown.
    let status = Command::new("trunk")
        .args(["build", "--release"])
        .current_dir(&frontend)
        .env_remove("CARGO_ENCODED_RUSTFLAGS")
        .env_remove("RUSTFLAGS")
        .status()
        .expect("failed to run `trunk`; install with: cargo install trunk");

    if !status.success() {
        panic!("trunk build --release failed");
    }
}
