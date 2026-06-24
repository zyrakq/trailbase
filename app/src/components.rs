use std::{env, io::Cursor, path::{Component, Path}};
use tracing::info;
use zip::ZipArchive;

use crate::settings::components::{ComponentEntry, ComponentSettings, ComponentSource};

pub async fn ensure_component(
    entry: &ComponentEntry,
    settings: &ComponentSettings,
    manifest_dir: &Path,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    validate_wasm_filename(&entry.wasm)?;

    let target_wasm = manifest_dir
        .join("traildepot")
        .join("wasm")
        .join(&entry.wasm);

    match &entry.source {
        ComponentSource::Build(package) => {
            let rebuild = entry.rebuild.unwrap_or(settings.rebuild);
            if target_wasm.exists() && !rebuild {
                info!(
                    name = %entry.name,
                    wasm = %entry.wasm,
                    "component wasm already present, skipping build copy"
                );
                return Ok(());
            }

            let target_dir = env::var("CARGO_TARGET_DIR").unwrap_or("target".to_string());

            // Derive the build artifact name from the cargo package name:
            // hyphens → underscores, append .wasm. This matches Cargo's output
            // convention (`trail-auth-component` → `trail_auth_component.wasm`).
            let artifact = format!("{}.wasm", package.replace('-', "_"));
            let source = manifest_dir
                .parent()
                .ok_or("cannot determine parent directory of manifest_dir")?
                .join(&target_dir)
                .join("wasm32-wasip2")
                .join("release")
                .join(&artifact);

            if !source.exists() {
                return Err(format!(
                    "build artifact not found at {}.\n\
                     Build it first: cargo build --target wasm32-wasip2 --release -p {package}",
                    source.display()
                )
                .into());
            }

            let target_wasm_dir = target_wasm
                .parent()
                .ok_or("cannot determine wasm output directory")?;
            std::fs::create_dir_all(target_wasm_dir)?;
            std::fs::copy(&source, &target_wasm)?;
            info!(
                name = %entry.name,
                "copied component wasm from build output: {}",
                source.display()
            );
            Ok(())
        }
        ComponentSource::Fetch { fetch: url, zip_name } => {
            let refetch = entry.refetch.unwrap_or(settings.refetch);
            if target_wasm.exists() && !refetch {
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

            let target_wasm_dir = target_wasm
                .parent()
                .ok_or("cannot determine wasm output directory")?;
            std::fs::create_dir_all(target_wasm_dir)?;

            if url.to_lowercase().ends_with(".zip") {
                // Search by zip_name if provided, otherwise by entry.wasm.
                let search_name = zip_name.as_deref().unwrap_or(&entry.wasm);
                extract_wasm_from_zip(&bytes, search_name, url, &target_wasm)?;
            } else {
                std::fs::write(&target_wasm, &bytes)?;
            }

            info!(
                name = %entry.name,
                wasm = %entry.wasm,
                "component wasm fetched and written to {}",
                target_wasm.display()
            );
            Ok(())
        }
    }
}

fn extract_wasm_from_zip(
    bytes: &[u8],
    wasm_filename: &str,
    url: &str,
    target: &Path,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut cursor = Cursor::new(bytes);
    let mut archive = ZipArchive::new(&mut cursor)
        .map_err(|e| format!("failed to open zip archive from {url}: {e}"))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        if let Some(path) = file.enclosed_name() {
            // Match on the bare filename so nested entries
            // (e.g. `components/auth_ui_component.wasm`) are still found.
            let Some(filename) = path.file_name().and_then(|e| e.to_str()) else {
                continue;
            };
            if filename == wasm_filename {
                let mut out = std::fs::File::create(target)?;
                std::io::copy(&mut file, &mut out)?;
                return Ok(());
            }
        }
    }

    Err(format!("file '{wasm_filename}' not found in zip archive from {url}").into())
}

fn validate_wasm_filename(wasm: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let path = Path::new(wasm);
    if path.is_absolute() || wasm.contains('/') || wasm.contains('\\') {
        return Err(format!("wasm filename must be a plain filename, got: {wasm}").into());
    }
    if path.components().any(|c| matches!(c, Component::ParentDir)) {
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
        let target_dir = env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".to_string());
        let src = workspace
            .join(&target_dir)
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
            source: ComponentSource::Fetch {
                fetch: "https://example.com/test.wasm".into(),
                zip_name: None,
            },
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
        assert_eq!(
            fs::read(&target).unwrap(),
            b"existing",
            "must not overwrite"
        );
    }

    #[tokio::test]
    async fn build_copies_when_rebuild_true() {
        let (workspace, manifest) = make_layout();
        // Package "test-pkg" → artifact "test_pkg.wasm"; entry.wasm is the target name.
        make_source(workspace.path(), "test_pkg.wasm");
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
            msg.contains(
                "Build it first: cargo build --target wasm32-wasip2 --release -p test-pkg"
            ),
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
        assert_eq!(
            err.to_string(),
            "wasm filename must be a plain filename, got: .."
        );
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

        // Package "test-pkg" → artifact "test_pkg.wasm"; entry.wasm is the target name.
        make_source(workspace.path(), "test_pkg.wasm");
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

    /// Build an in-memory zip (deflate, stored) from `(name, bytes)` entries.
    fn build_zip(entries: &[(&str, &[u8])]) -> Vec<u8> {
        use std::io::Write;
        let mut buf = std::io::Cursor::new(Vec::<u8>::new());
        {
            let mut zw = zip::ZipWriter::new(&mut buf);
            for (name, data) in entries {
                zw.start_file(name, zip::write::SimpleFileOptions::default())
                    .expect("start_file");
                zw.write_all(data).expect("write_all");
            }
            zw.finish().expect("finish");
        }
        buf.into_inner()
    }

    #[test]
    fn extract_wasm_from_zip_extracts_matching_entry() {
        let payload = b"wasm-payload-bytes";
        let zip_bytes = build_zip(&[("auth_ui_component.wasm", payload)]);

        let dir = tempfile::tempdir().expect("tempdir");
        let target = dir.path().join("auth_ui_component.wasm");

        extract_wasm_from_zip(
            &zip_bytes,
            "auth_ui_component.wasm",
            "https://example.com/x.zip",
            &target,
        )
        .expect("should extract");

        assert_eq!(std::fs::read(&target).unwrap(), payload);
    }

    #[test]
    fn extract_wasm_from_zip_finds_nested_entry_by_bare_filename() {
        // Entry stored under a subdirectory, as common in GitHub release zips.
        // Lookup must succeed via file_name(), not a full-path comparison.
        let payload = b"nested-wasm-bytes";
        let zip_bytes = build_zip(&[("components/auth_ui_component.wasm", payload)]);

        let dir = tempfile::tempdir().expect("tempdir");
        let target = dir.path().join("auth_ui_component.wasm");

        extract_wasm_from_zip(
            &zip_bytes,
            "auth_ui_component.wasm",
            "https://example.com/x.zip",
            &target,
        )
        .expect("should find nested entry by bare filename");

        assert_eq!(std::fs::read(&target).unwrap(), payload);
    }

    #[test]
    fn extract_wasm_from_zip_errors_when_entry_missing() {
        let zip_bytes = build_zip(&[("other.wasm", b"x")]);

        let dir = tempfile::tempdir().expect("tempdir");
        let target = dir.path().join("wanted.wasm");

        let err = extract_wasm_from_zip(
            &zip_bytes,
            "wanted.wasm",
            "https://example.com/x.zip",
            &target,
        )
        .expect_err("missing entry must error");

        let msg = err.to_string();
        assert!(msg.contains("not found in zip archive"), "got: {msg}");
        assert!(msg.contains("wanted.wasm"), "got: {msg}");
        assert!(msg.contains("https://example.com/x.zip"), "got: {msg}");
    }

    #[test]
    fn extract_wasm_from_zip_errors_on_garbage_input() {
        let dir = tempfile::tempdir().expect("tempdir");
        let target = dir.path().join("x.wasm");

        let err = extract_wasm_from_zip(
            b"this is not a zip archive",
            "x.wasm",
            "https://example.com/x.zip",
            &target,
        )
        .expect_err("garbage input must error");

        let msg = err.to_string();
        assert!(msg.contains("failed to open zip archive"), "got: {msg}");
        assert!(msg.contains("https://example.com/x.zip"), "got: {msg}");
    }
}
