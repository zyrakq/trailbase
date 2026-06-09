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

    let status = Command::new("trunk")
        .args(["build", "--release"])
        .current_dir(&frontend)
        .status()
        .expect("failed to run `trunk`; install with: cargo install trunk");

    if !status.success() {
        panic!("trunk build --release failed");
    }
}
