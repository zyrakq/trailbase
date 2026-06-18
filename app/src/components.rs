// app/src/components.rs
//
// TrailBase component lifecycle: ensure component wasm files are present,
// either by copying from a local build output or installing via the trail CLI.

use std::path::{Component, Path};
use tracing::info;

use crate::settings::components::{ComponentEntry, ComponentSettings, ComponentSource};

/// Ensure a TrailBase component wasm file is present in
/// `{manifest_dir}/traildepot/wasm/<entry.wasm>`.
///
/// The action taken depends on `entry.source`:
///   - `Build(package)` — copy the artifact from
///     `{manifest_dir}/../target/wasm32-wasip2/release/<entry.wasm>`. The
///     artifact must already exist; this function only copies it.
///   - `Fetch(name)` — invoke `trail components add <name>`.
///
/// Both branches honour the per-item `rebuild` / `refetch` override, falling
/// back to the global `settings.rebuild` / `settings.refetch` default.
/// When the target file already exists and the corresponding flag is `false`,
/// the function returns immediately — no filesystem writes, no subprocess.
pub fn ensure_component(
    entry: &ComponentEntry,
    settings: &ComponentSettings,
    manifest_dir: &Path,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    validate_wasm_filename(&entry.wasm)?;

    let target = manifest_dir
        .join("traildepot")
        .join("wasm")
        .join(&entry.wasm);

    match &entry.source {
        ComponentSource::Build(package) => {
            let rebuild = entry.rebuild.unwrap_or(settings.rebuild);
            if target.exists() && !rebuild {
                info!(
                    name = %entry.name,
                    wasm = %entry.wasm,
                    "component wasm already present, skipping build copy"
                );
                return Ok(());
            }

            let source = manifest_dir
                .parent()
                .ok_or("cannot determine parent directory of manifest_dir")?
                .join("target")
                .join("wasm32-wasip2")
                .join("release")
                .join(&entry.wasm);

            if !source.exists() {
                return Err(format!(
                    "build artifact not found at {}.\n\
                     Build it first: cargo build --target wasm32-wasip2 --release -p {package}",
                    source.display()
                )
                .into());
            }

            let target_dir = target
                .parent()
                .ok_or("cannot determine wasm output directory")?;
            std::fs::create_dir_all(target_dir)?;
            std::fs::copy(&source, &target)?;
            info!(
                name = %entry.name,
                "copied component wasm from build output: {}",
                source.display()
            );
            Ok(())
        }
        ComponentSource::Fetch(name) => {
            let refetch = entry.refetch.unwrap_or(settings.refetch);
            if target.exists() && !refetch {
                info!(
                    name = %entry.name,
                    wasm = %entry.wasm,
                    "component wasm already present, skipping fetch"
                );
                return Ok(());
            }

            crate::preflight::check_dependency(
                "trail",
                "https://trailbase.io/getting-started/install/",
            )?;

            info!(
                name = %entry.name,
                "fetching component via `trail components add {name}`"
            );

            let status = std::process::Command::new("trail")
                .args(["components", "add", name])
                .current_dir(manifest_dir)
                .status()?;

            if !status.success() {
                return Err(format!(
                    "Failed to fetch component {name}: exit status {status}"
                )
                .into());
            }

            info!(name = %entry.name, "component installed via trail");
            Ok(())
        }
    }
}

/// Reject wasm names that are not plain filenames: no absolute paths, no path
/// separators (`/` or `\`), no `..` path component.
fn validate_wasm_filename(
    wasm: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let path = Path::new(wasm);
    if path.is_absolute() || wasm.contains('/') || wasm.contains('\\') {
        return Err(format!("wasm filename must be a plain filename, got: {wasm}").into());
    }
    if path
        .components()
        .any(|c| matches!(c, Component::ParentDir))
    {
        return Err(format!("wasm filename must be a plain filename, got: {wasm}").into());
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    const WASM: &str = "comp.wasm";
    const SOURCE_BYTES: &[u8] = b"fake-wasm-source";

    /// Build a tempdir layout where `manifest_dir.parent()` is the workspace
    /// root, mirroring the real `app/..` relationship.
    fn make_layout() -> (tempfile::TempDir, PathBuf) {
        let workspace = tempfile::tempdir().expect("tempdir");
        let manifest = workspace.path().join("app");
        fs::create_dir_all(&manifest).expect("create manifest_dir");
        (workspace, manifest)
    }

    fn make_source(workspace: &Path, wasm: &str) -> PathBuf {
        let src = workspace
            .join("target")
            .join("wasm32-wasip2")
            .join("release")
            .join(wasm);
        fs::create_dir_all(src.parent().unwrap()).expect("create target dir");
        fs::write(&src, SOURCE_BYTES).expect("write source");
        src
    }

    fn write_target(manifest: &Path, wasm: &str, content: &[u8]) -> PathBuf {
        let target = manifest.join("traildepot").join("wasm").join(wasm);
        fs::create_dir_all(target.parent().unwrap()).expect("create traildepot/wasm dir");
        fs::write(&target, content).expect("write target");
        target
    }

    fn build_entry(wasm: &str, rebuild: Option<bool>) -> ComponentEntry {
        ComponentEntry {
            name: "test".into(),
            wasm: wasm.into(),
            source: ComponentSource::Build("test-pkg".into()),
            rebuild,
            refetch: None,
        }
    }

    fn fetch_entry(wasm: &str, refetch: Option<bool>) -> ComponentEntry {
        ComponentEntry {
            name: "test".into(),
            wasm: wasm.into(),
            source: ComponentSource::Fetch("trailbase/test".into()),
            rebuild: None,
            refetch,
        }
    }

    // ----- build variants ---------------------------------------------------

    #[test]
    fn build_skips_when_wasm_exists_and_no_rebuild() {
        let (_workspace, manifest) = make_layout();
        let target = write_target(&manifest, WASM, b"existing");

        // settings.rebuild = false (default); entry.rebuild = None.
        // Target exists, so function should early-return without copying.
        let entry = build_entry(WASM, None);
        let settings = ComponentSettings::default();

        ensure_component(&entry, &settings, &manifest).expect("should skip");
        assert_eq!(fs::read(&target).unwrap(), b"existing", "must not overwrite");
    }

    #[test]
    fn build_copies_when_rebuild_true() {
        let (workspace, manifest) = make_layout();
        make_source(workspace.path(), WASM);
        let target = write_target(&manifest, WASM, b"stale");

        let entry = build_entry(WASM, Some(true));
        let settings = ComponentSettings::default();

        ensure_component(&entry, &settings, &manifest).expect("should copy");
        assert_eq!(
            fs::read(&target).unwrap(),
            SOURCE_BYTES,
            "target must be replaced with source content"
        );
    }

    #[test]
    fn build_errors_when_source_missing() {
        let (_workspace, manifest) = make_layout();
        // No source file. Force rebuild so function actually attempts to copy.
        let entry = build_entry(WASM, Some(true));
        let settings = ComponentSettings::default();

        let err = ensure_component(&entry, &settings, &manifest).expect_err("should fail");
        let msg = err.to_string();
        assert!(msg.contains("build artifact not found at"), "got: {msg}");
        assert!(
            msg.contains("Build it first: cargo build --target wasm32-wasip2 --release -p test-pkg"),
            "got: {msg}"
        );
    }

    // ----- fetch variants ---------------------------------------------------

    #[test]
    fn fetch_skips_when_wasm_exists_and_no_refetch() {
        let (_workspace, manifest) = make_layout();
        let _target = write_target(&manifest, WASM, b"existing");

        // Critical regression: with target present and no refetch, the
        // function must return Ok without invoking `trail` (which would
        // require network access and may not be installed in CI).
        let entry = fetch_entry(WASM, None);
        let settings = ComponentSettings::default();

        ensure_component(&entry, &settings, &manifest)
            .expect("must skip fetch without calling trail");
    }

    #[test]
    #[ignore = "requires `trail` CLI to be missing from PATH; run with `cargo test -- --ignored` to verify"]
    fn fetch_errors_when_trail_missing() {
        // Documents the expected error path: with no pre-existing target and
        // a refetch forced, preflight must reject the missing `trail` binary
        // with a message that mentions the install URL.
        let (_workspace, manifest) = make_layout();
        let entry = fetch_entry(WASM, Some(true));
        let settings = ComponentSettings::default();

        let err = ensure_component(&entry, &settings, &manifest)
            .expect_err("preflight should fail when trail is missing");
        let msg = err.to_string();
        assert!(msg.contains("trail"), "error should mention trail: {msg}");
        assert!(
            msg.contains("https://trailbase.io/getting-started/install/"),
            "error should include install URL: {msg}"
        );
    }

    // ----- wasm filename validation ----------------------------------------

    #[test]
    fn wasm_filename_rejects_dotdot() {
        let entry = build_entry("..", None);
        let err = ensure_component(&entry, &ComponentSettings::default(), Path::new("/tmp"))
            .expect_err(".. must be rejected");
        assert_eq!(err.to_string(), "wasm filename must be a plain filename, got: ..");
    }

    #[test]
    fn wasm_filename_rejects_absolute() {
        let entry = build_entry("/etc/passwd", None);
        let err = ensure_component(&entry, &ComponentSettings::default(), Path::new("/tmp"))
            .expect_err("absolute path must be rejected");
        assert_eq!(
            err.to_string(),
            "wasm filename must be a plain filename, got: /etc/passwd"
        );
    }

    // ----- effective-rebuild / effective-refetch priority ------------------

    #[test]
    fn effective_rebuild_priority() {
        let (workspace, manifest) = make_layout();
        make_source(workspace.path(), WASM);

        // Case 1: entry.rebuild = Some(true) overrides settings.rebuild = false → copy.
        let target = write_target(&manifest, WASM, b"stale");
        let entry = build_entry(WASM, Some(true));
        let settings = ComponentSettings {
            rebuild: false,
            refetch: false,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest).expect("per-item true should copy");
        assert_eq!(fs::read(&target).unwrap(), SOURCE_BYTES);

        // Case 2: entry.rebuild = Some(false) overrides settings.rebuild = true → skip.
        fs::write(&target, b"stale").unwrap();
        let entry = build_entry(WASM, Some(false));
        let settings = ComponentSettings {
            rebuild: true,
            refetch: false,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest).expect("per-item false should skip");
        assert_eq!(fs::read(&target).unwrap(), b"stale", "must not overwrite");

        // Case 3: entry.rebuild = None falls back to settings.rebuild = true → copy.
        fs::write(&target, b"stale").unwrap();
        let entry = build_entry(WASM, None);
        let settings = ComponentSettings {
            rebuild: true,
            refetch: false,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest).expect("None should fall back to true");
        assert_eq!(fs::read(&target).unwrap(), SOURCE_BYTES);
    }

    #[test]
    fn effective_refetch_priority() {
        let (_workspace, manifest) = make_layout();
        // Pre-existing target. With per-item refetch=false, the function must
        // skip — even though global settings.refetch=true would normally
        // force a refetch. This proves the per-item override is respected.
        let _target = write_target(&manifest, WASM, b"existing");

        let entry = fetch_entry(WASM, Some(false));
        let settings = ComponentSettings {
            rebuild: false,
            refetch: true,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest)
            .expect("per-item refetch=false should override global refetch=true → skip");
    }
}
