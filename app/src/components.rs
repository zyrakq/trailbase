// app/src/components.rs
//
// TrailBase component lifecycle: ensure the auth_ui component wasm is present,
// either by copying from a local vendor build or installing via the trail CLI.

use std::path::Path;
use tracing::info;

/// Ensure the TrailBase `auth_ui` component is installed.
///
/// Checks for the compiled wasm file at
/// `{manifest_dir}/traildepot/wasm/auth_ui_component.wasm`.
/// If the file already exists the function returns immediately — no network
/// access, no subprocess.
///
/// When `vendor` is `true`, copies the wasm from the local vendor build output at
/// `{manifest_dir}/../target/wasm32-wasip2/release/auth_ui_component.wasm`.
/// The wasm must be built first using the argiago workspace (vendor/trailbase/crates/auth-ui
/// is a workspace member so [patch] sections in vendor/trailbase/Cargo.toml are ignored):
///   cargo build --target wasm32-wasip2 --release -p auth-ui-component
///
/// When `vendor` is `false`, verifies that `trail` is in PATH and runs
/// `trail components add trailbase/auth_ui` to download the component.
pub fn ensure_auth_ui(
    manifest_dir: &Path,
    vendor: bool,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let wasm_path = manifest_dir
        .join("traildepot")
        .join("wasm")
        .join("auth_ui_component.wasm");

    if wasm_path.exists() {
        return Ok(());
    }

    if vendor {
        let src = manifest_dir
            .parent()
            .ok_or("cannot determine parent directory of manifest_dir")?
            .join("target")
            .join("wasm32-wasip2")
            .join("release")
            .join("auth_ui_component.wasm");

        if !src.exists() {
            return Err(format!(
                "vendor auth_ui wasm not found at {}.\n\
                 Build it first: cargo build --target wasm32-wasip2 --release -p auth-ui",
                src.display()
            )
            .into());
        }

        let wasm_dir = wasm_path
            .parent()
            .ok_or("cannot determine wasm output directory")?;
        std::fs::create_dir_all(wasm_dir)?;
        std::fs::copy(&src, &wasm_path)?;
        info!("Copied auth_ui WASM from vendor: {}", src.display());

        return Ok(());
    }

    crate::preflight::check_dependency(
        "trail",
        "https://trailbase.io/getting-started/install/",
    )?;

    info!("Installing TrailBase auth_ui component...");

    let status = std::process::Command::new("trail")
        .args(["components", "add", "trailbase/auth_ui"])
        .current_dir(manifest_dir)
        .status()?;

    if !status.success() {
        return Err(
            format!("Failed to install auth_ui component: exit status {status}").into(),
        );
    }

    info!("TrailBase auth_ui component installed");
    Ok(())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn returns_ok_immediately_when_wasm_exists() {
        let dir = tempfile::tempdir().expect("tempdir");
        let wasm_dir = dir.path().join("traildepot").join("wasm");
        fs::create_dir_all(&wasm_dir).expect("create wasm dir");
        fs::write(wasm_dir.join("auth_ui_component.wasm"), b"fake")
            .expect("write fake wasm");

        // Must return Ok without invoking trail (which may not be installed in CI)
        assert!(ensure_auth_ui(dir.path(), false).is_ok());
    }

    #[test]
    fn vendor_returns_err_when_src_missing() {
        let dir = tempfile::tempdir().expect("tempdir");
        // Do not create the wasm file — must fail with a useful error message
        let result = ensure_auth_ui(dir.path(), true);
        assert!(result.is_err());
        let msg = result.unwrap_err().to_string();
        assert!(msg.contains("vendor auth_ui wasm not found"), "unexpected error: {msg}");
    }
}
