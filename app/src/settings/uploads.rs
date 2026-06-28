use std::path::PathBuf;

use serde::Deserialize;

#[derive(Debug, Clone, Default, Deserialize)]
pub struct UploadsSettings {
    #[serde(default)]
    pub dir: String,
}

#[derive(Debug, Clone)]
pub struct UploadsOverlayConfig {
    pub dir: Option<PathBuf>,
}

impl UploadsSettings {
    pub fn overlay_config(&self) -> UploadsOverlayConfig {
        UploadsOverlayConfig {
            dir: if self.dir.is_empty() {
                None
            } else {
                Some(PathBuf::from(&self.dir))
            },
        }
    }
}

pub fn sanitize_logo_rel(rel: &str) -> Option<&str> {
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

    #[derive(Deserialize)]
    struct Wrapper {
        #[serde(default)]
        uploads: UploadsSettings,
    }

    fn parse(toml: &str) -> UploadsSettings {
        Config::builder()
            .add_source(config::File::from_str(toml, FileFormat::Toml))
            .build()
            .expect("valid toml config")
            .try_deserialize::<Wrapper>()
            .expect("deserialize Wrapper")
            .uploads
    }

    #[test]
    fn empty_config_gives_none_dir() {
        let s = parse("");
        assert_eq!(s.dir, "");
        assert!(s.overlay_config().dir.is_none());
    }

    #[test]
    fn dir_set_gives_some_path() {
        let s = parse(r#"[uploads]
dir = "var/uploads""#);
        assert_eq!(s.dir, "var/uploads");
        assert_eq!(s.overlay_config().dir, Some(PathBuf::from("var/uploads")));
    }

    #[test]
    fn env_override_sets_uploads_dir() {
        // SAFETY: the test owns this env var and removes it in teardown.
        unsafe { std::env::set_var("APP_UPLOADS__DIR", "env/uploads"); }
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
        // SAFETY: test teardown.
        unsafe { std::env::remove_var("APP_UPLOADS__DIR"); }
        let s = result.expect("deserialize Wrapper").uploads;
        assert_eq!(s.dir, "env/uploads");
    }

    #[test]
    fn sanitize_rejects_unsafe_paths() {
        assert_eq!(sanitize_logo_rel(""), None);
        assert_eq!(sanitize_logo_rel("/foo"), None);
        assert_eq!(sanitize_logo_rel("foo/../bar"), None);
        assert_eq!(sanitize_logo_rel("foo/./bar"), None);
    }

    #[test]
    fn sanitize_accepts_normal_paths() {
        assert_eq!(sanitize_logo_rel("abc.png"), Some("abc.png"));
        assert_eq!(
            sanitize_logo_rel("subscription-logos/abc.png"),
            Some("subscription-logos/abc.png")
        );
    }
}
