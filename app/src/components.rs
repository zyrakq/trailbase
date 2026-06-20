use std::path::{Component, Path};
use tracing::info;

use crate::settings::components::{ComponentEntry, ComponentSettings, ComponentSource};

pub async fn ensure_component(
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
        ComponentSource::Fetch(url) => {
            let refetch = entry.refetch.unwrap_or(settings.refetch);
            if target.exists() && !refetch {
                info!(
                    name = %entry.name,
                    wasm = %entry.wasm,
                    "component wasm already present, skipping fetch"
                );
                return Ok(());
            }

            info!(
                name = %entry.name,
                "fetching component wasm from {url}"
            );

            let resp = reqwest::get(url).await?;
            if !resp.status().is_success() {
                return Err(format!(
                    "Failed to fetch component wasm for {name}: HTTP {status} from {url}",
                    name = entry.name,
                    status = resp.status(),
                )
                .into());
            }

            let bytes = resp.bytes().await?;

            let target_dir = target
                .parent()
                .ok_or("cannot determine wasm output directory")?;
            std::fs::create_dir_all(target_dir)?;
            std::fs::write(&target, &bytes)?;

            info!(
                name = %entry.name,
                wasm = %entry.wasm,
                "component wasm fetched and written to {}",
                target.display()
            );
            Ok(())
        }
    }
}

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    const WASM: &str = "comp.wasm";
    const SOURCE_BYTES: &[u8] = b"fake-wasm-source";

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
            source: ComponentSource::Fetch("https://example.com/test.wasm".into()),
            rebuild: None,
            refetch,
        }
    }

    #[tokio::test]
    async fn build_skips_when_wasm_exists_and_no_rebuild() {
        let (_workspace, manifest) = make_layout();
        let target = write_target(&manifest, WASM, b"existing");

        let entry = build_entry(WASM, None);
        let settings = ComponentSettings::default();

        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("should skip");
        assert_eq!(fs::read(&target).unwrap(), b"existing", "must not overwrite");
    }

    #[tokio::test]
    async fn build_copies_when_rebuild_true() {
        let (workspace, manifest) = make_layout();
        make_source(workspace.path(), WASM);
        let target = write_target(&manifest, WASM, b"stale");

        let entry = build_entry(WASM, Some(true));
        let settings = ComponentSettings::default();

        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("should copy");
        assert_eq!(
            fs::read(&target).unwrap(),
            SOURCE_BYTES,
            "target must be replaced with source content"
        );
    }

    #[tokio::test]
    async fn build_errors_when_source_missing() {
        let (_workspace, manifest) = make_layout();
        let entry = build_entry(WASM, Some(true));
        let settings = ComponentSettings::default();

        let err = ensure_component(&entry, &settings, &manifest)
            .await
            .expect_err("should fail");
        let msg = err.to_string();
        assert!(msg.contains("build artifact not found at"), "got: {msg}");
        assert!(
            msg.contains("Build it first: cargo build --target wasm32-wasip2 --release -p test-pkg"),
            "got: {msg}"
        );
    }

    #[tokio::test]
    async fn fetch_skips_when_wasm_exists_and_no_refetch() {
        let (_workspace, manifest) = make_layout();
        let _target = write_target(&manifest, WASM, b"existing");

        // Must short-circuit before any HTTP request: CI has no network.
        let entry = fetch_entry(WASM, None);
        let settings = ComponentSettings::default();

        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("must skip fetch without network access");
    }

    #[tokio::test]
    async fn wasm_filename_rejects_dotdot() {
        let entry = build_entry("..", None);
        let err = ensure_component(&entry, &ComponentSettings::default(), Path::new("/tmp"))
            .await
            .expect_err(".. must be rejected");
        assert_eq!(err.to_string(), "wasm filename must be a plain filename, got: ..");
    }

    #[tokio::test]
    async fn wasm_filename_rejects_absolute() {
        let entry = build_entry("/etc/passwd", None);
        let err = ensure_component(&entry, &ComponentSettings::default(), Path::new("/tmp"))
            .await
            .expect_err("absolute path must be rejected");
        assert_eq!(
            err.to_string(),
            "wasm filename must be a plain filename, got: /etc/passwd"
        );
    }

    #[tokio::test]
    async fn effective_rebuild_priority() {
        let (workspace, manifest) = make_layout();
        make_source(workspace.path(), WASM);

        let target = write_target(&manifest, WASM, b"stale");
        let entry = build_entry(WASM, Some(true));
        let settings = ComponentSettings {
            rebuild: false,
            refetch: false,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("per-item true should copy");
        assert_eq!(fs::read(&target).unwrap(), SOURCE_BYTES);

        fs::write(&target, b"stale").unwrap();
        let entry = build_entry(WASM, Some(false));
        let settings = ComponentSettings {
            rebuild: true,
            refetch: false,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("per-item false should skip");
        assert_eq!(fs::read(&target).unwrap(), b"stale", "must not overwrite");

        fs::write(&target, b"stale").unwrap();
        let entry = build_entry(WASM, None);
        let settings = ComponentSettings {
            rebuild: true,
            refetch: false,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("None should fall back to true");
        assert_eq!(fs::read(&target).unwrap(), SOURCE_BYTES);
    }

    #[tokio::test]
    async fn effective_refetch_priority() {
        let (_workspace, manifest) = make_layout();
        let _target = write_target(&manifest, WASM, b"existing");

        let entry = fetch_entry(WASM, Some(false));
        let settings = ComponentSettings {
            rebuild: false,
            refetch: true,
            items: vec![],
        };
        ensure_component(&entry, &settings, &manifest)
            .await
            .expect("per-item refetch=false should override global refetch=true -> skip");
    }
}
