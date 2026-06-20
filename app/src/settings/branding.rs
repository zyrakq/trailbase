use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::frontend_assets::Assets;
use crate::settings::frontend::FrontendSettings;

#[derive(Debug, Clone, Default, Deserialize)]
pub struct BrandingSettings {
    pub brand_name: Option<String>,
    pub theme_color: Option<String>,
    #[serde(default)]
    pub branding_dir: String,
}

#[derive(Debug, Clone)]
pub struct BrandingOverlayConfig {
    pub volume_dir: Option<PathBuf>,
    pub disk_base: Option<PathBuf>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum BrandingSource {
    Disk(PathBuf),
    Embedded,
    NotFound,
}

impl BrandingSettings {
    pub fn overlay_config(
        &self,
        frontend: &FrontendSettings,
        manifest_dir: &Path,
    ) -> BrandingOverlayConfig {
        BrandingOverlayConfig {
            volume_dir: if self.branding_dir.is_empty() {
                None
            } else {
                Some(PathBuf::from(&self.branding_dir))
            },
            disk_base: if frontend.effective_serve_from() == "disk" {
                Some(frontend.resolve_public_dir(manifest_dir).join("branding"))
            } else {
                None
            },
        }
    }
}

pub fn resolve_branding_path(
    rel: &str,
    volume_dir: Option<&Path>,
    disk_base: Option<&Path>,
) -> BrandingSource {
    if let Some(vol) = volume_dir {
        let candidate = vol.join(rel);
        if candidate.is_file() {
            return BrandingSource::Disk(candidate);
        }
    }
    if let Some(base) = disk_base {
        let candidate = base.join(rel);
        if candidate.is_file() {
            return BrandingSource::Disk(candidate);
        }
    }
    if Assets::get(&format!("branding/{rel}")).is_some() {
        return BrandingSource::Embedded;
    }
    BrandingSource::NotFound
}

pub fn sanitize_branding_rel(rel: &str) -> Option<&str> {
    if rel.is_empty() || rel.starts_with('/') {
        return None;
    }
    for segment in rel.split('/') {
        if segment == ".." || segment == "." {
            return None;
        }
    }
    Some(rel)
}

#[cfg(test)]
mod tests {
    use super::*;
    use config::{Config, FileFormat};
    use std::fs;
    use tempfile::TempDir;

    #[derive(Deserialize)]
    struct Wrapper {
        #[serde(default)]
        branding: BrandingSettings,
    }

    fn parse(toml: &str) -> BrandingSettings {
        Config::builder()
            .add_source(config::File::from_str(toml, FileFormat::Toml))
            .build()
            .expect("valid toml config")
            .try_deserialize::<Wrapper>()
            .expect("deserialize Wrapper")
            .branding
    }

    #[test]
    fn empty_config_uses_none_defaults() {
        let s = parse("");
        assert_eq!(s.brand_name, None);
        assert_eq!(s.theme_color, None);
        assert_eq!(s.branding_dir, "");
    }

    #[test]
    fn branding_fragment_round_trips_explicit_values() {
        let toml = r##"
            [branding]
            brand_name = "Acme Co"
            theme_color = "#123456"
            branding_dir = "assets/branding"
        "##;
        let s = parse(toml);
        assert_eq!(s.brand_name, Some("Acme Co".to_string()));
        assert_eq!(s.theme_color, Some("#123456".to_string()));
        assert_eq!(s.branding_dir, "assets/branding");
    }

    #[test]
    fn partial_overrides_leave_missing_identity_empty() {
        let toml = r##"
            [branding]
            brand_name = "Acme"
        "##;
        let s = parse(toml);
        assert_eq!(s.brand_name, Some("Acme".to_string()));
        assert_eq!(s.theme_color, None);
        assert_eq!(s.branding_dir, "");
    }

    #[test]
    fn env_override_relays_explicit_branding_values() {
        // SAFETY: the test owns this env var and removes it in teardown.
        unsafe { std::env::set_var("APP_BRANDING__THEME_COLOR", "#123456"); }
        let result = Config::builder()
            .add_source(config::File::from_str("", FileFormat::Toml))
            .add_source(
                config::Environment::with_prefix("APP")
                    .prefix_separator("_")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()
            .expect("valid config")
            .try_deserialize::<Wrapper>();
        // SAFETY: test teardown — removing our own env var.
        unsafe { std::env::remove_var("APP_BRANDING__THEME_COLOR"); }
        let s = result.expect("deserialize Wrapper").branding;
        assert_eq!(s.theme_color, Some("#123456".to_string()));
    }

    #[test]
    fn overlay_config_uses_disk_mode_paths() {
        let settings = BrandingSettings {
            brand_name: Some("Acme".to_string()),
            theme_color: Some("#123456".to_string()),
            branding_dir: "branding-overrides".to_string(),
        };
        let frontend = FrontendSettings {
            serve_from: "disk".to_string(),
            watch: false,
            public_dir: "ui/dist".to_string(),
            password_auth_enabled: None,
        };
        let manifest_dir = Path::new("/tmp/project");
        let overlay = settings.overlay_config(&frontend, manifest_dir);

        assert_eq!(overlay.volume_dir, Some(PathBuf::from("branding-overrides")));
        assert_eq!(
            overlay.disk_base,
            Some(PathBuf::from("/tmp/project/ui/dist/branding"))
        );
    }

    #[test]
    fn overlay_config_omits_disk_base_when_embedded() {
        let settings = BrandingSettings::default();
        let frontend = FrontendSettings {
            serve_from: "embedded".to_string(),
            watch: false,
            public_dir: "ui/dist".to_string(),
            password_auth_enabled: None,
        };
        let overlay = settings.overlay_config(&frontend, Path::new("/tmp/project"));

        assert_eq!(overlay.volume_dir, None);
        assert_eq!(overlay.disk_base, None);
    }

    fn write_file(dir: &Path, rel: &str, content: &[u8]) {
        let path = dir.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("mkdir");
        }
        fs::write(&path, content).expect("write");
    }

    #[test]
    fn resolve_prefers_volume_over_disk_base() {
        let vol = TempDir::new().expect("vol");
        let disk = TempDir::new().expect("disk");
        write_file(vol.path(), "logo.svg", b"volume-bytes");
        write_file(disk.path(), "logo.svg", b"disk-bytes");

        match resolve_branding_path("logo.svg", Some(vol.path()), Some(disk.path())) {
            BrandingSource::Disk(p) => {
                assert_eq!(fs::read(&p).unwrap(), b"volume-bytes");
                assert!(p.starts_with(vol.path()));
            }
            other => panic!("expected Disk(volume), got {other:?}"),
        }
    }

    #[test]
    fn resolve_uses_disk_base_when_volume_missing() {
        let vol = TempDir::new().expect("vol");
        let disk = TempDir::new().expect("disk");
        write_file(disk.path(), "logo.svg", b"disk-bytes");

        match resolve_branding_path("logo.svg", Some(vol.path()), Some(disk.path())) {
            BrandingSource::Disk(p) => {
                assert_eq!(fs::read(&p).unwrap(), b"disk-bytes");
                assert!(p.starts_with(disk.path()));
            }
            other => panic!("expected Disk(disk_base), got {other:?}"),
        }
    }

    #[test]
    fn resolve_returns_embedded_for_known_brand_asset() {
        let res = resolve_branding_path("favicon-light.ico", None, None);
        assert!(matches!(res, BrandingSource::Embedded));
    }

    #[test]
    fn resolve_returns_not_found_for_unique_path() {
        let res = resolve_branding_path("definitely-not-a-brand-asset-zzz-9999.xyz", None, None);
        assert!(matches!(res, BrandingSource::NotFound));
    }

    #[test]
    fn sanitize_rejects_unsafe_paths() {
        assert_eq!(sanitize_branding_rel(""), None);
        assert_eq!(sanitize_branding_rel("/foo"), None);
        assert_eq!(sanitize_branding_rel("foo/../bar"), None);
        assert_eq!(sanitize_branding_rel("foo/./bar"), None);
    }

    #[test]
    fn sanitize_accepts_normal_brand_paths() {
        assert_eq!(sanitize_branding_rel("favicon-light.svg"), Some("favicon-light.svg"));
        assert_eq!(sanitize_branding_rel("favicons/32-light.png"), Some("favicons/32-light.png"));
    }
}
