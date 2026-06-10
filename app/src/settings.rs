// app/src/settings.rs

use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub server: ServerSettings,
    pub frontend: FrontendSettings,
    pub email: EmailSettings,
    /// Bootstrap settings applied to TrailBase on first start only.
    /// Ignored when `app/traildepot/config.textproto` already exists.
    pub trailbase: TrailbaseBootstrap,
    /// WASM component loading settings.
    #[serde(default)]
    pub components: ComponentSettings,
}

#[derive(Debug, Deserialize)]
pub struct ServerSettings {
    pub address: String,
}

/// Settings for TrailBase WASM component management.
#[derive(Debug, Default, Deserialize)]
pub struct ComponentSettings {
    /// When true, copy auth_ui from the local vendor build instead of downloading
    /// via `trail components add`. Requires the WASM to be built first:
    ///   cargo build --target wasm32-wasip2 --release -p auth-ui
    /// in the `vendor/trailbase` workspace.
    #[serde(default)]
    pub vendor_auth_ui: bool,
}

#[derive(Debug, Deserialize)]
pub struct FrontendSettings {
    pub build: bool,
    pub watch: bool,
    /// Empty string means "derive from CARGO_MANIFEST_DIR at runtime in main.rs".
    pub public_dir: String,
    pub password_auth_enabled: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct EmailSettings {
    /// When true, start the mailcrab SMTP interceptor and serve its UI under `path`.
    /// Should only be true in development environments.
    pub dev_intercept: bool,
    /// URL prefix under which the mailcrab UI and API are served.
    pub path: String,
    /// IP address the SMTP listener binds to.
    pub smtp_host: String,
    /// Port the SMTP listener binds to.
    pub smtp_port: u16,
}

/// Newtype wrapper so `axum::Extension<PasswordAuthEnabled>` is unambiguous.
#[derive(Clone, Copy)]
pub struct PasswordAuthEnabled(pub bool);

// ---------------------------------------------------------------------------
// TrailBase bootstrap (first-start only)
// ---------------------------------------------------------------------------

/// Settings applied to `app/traildepot/config.textproto` on first start.
///
/// When the file already exists these values are ignored entirely — TrailBase
/// owns the file after initial creation and must not be overwritten on every
/// startup.  To re-apply bootstrap settings delete `config.textproto` and
/// restart.
#[derive(Debug, Deserialize)]
pub struct TrailbaseBootstrap {
    pub server: TrailbaseBootstrapServer,
    pub auth: TrailbaseBootstrapAuth,
    /// Explicit SMTP settings for TrailBase outgoing mail.
    ///
    /// When `smtp_host` is set, these values take priority over the
    /// `email.dev_intercept` auto-fill.  When `smtp_host` is empty the
    /// section is ignored and the dev auto-fill applies (if enabled).
    #[serde(default)]
    pub smtp: TrailbaseBootstrapSmtp,
}

#[derive(Debug, Deserialize)]
pub struct TrailbaseBootstrapServer {
    pub application_name: String,
    pub site_url: String,
    pub logs_retention_sec: u64,
}

#[derive(Debug, Deserialize)]
pub struct TrailbaseBootstrapAuth {
    pub disable_password_auth: bool,
    pub enable_otp_signin: bool,
    /// OIDC0 provider.  `None` when `client_id` is absent or empty — no provider
    /// block is written and OIDC login is disabled until the value is supplied.
    #[serde(default, deserialize_with = "deserialize_oidc0")]
    pub oidc0: Option<TrailbaseBootstrapOidc>,
}

#[derive(Debug, Deserialize)]
pub struct TrailbaseBootstrapOidc {
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub user_api_url: String,
}

fn deserialize_oidc0<'de, D>(deserializer: D) -> Result<Option<TrailbaseBootstrapOidc>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let opt = Option::<TrailbaseBootstrapOidc>::deserialize(deserializer)?;
    Ok(opt.filter(|s| !s.client_id.is_empty()))
}

/// SMTP encryption mode, accepted as a lowercase string in TOML.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SmtpEncryptionSetting {
    None,
    Starttls,
    Tls,
}

impl Default for SmtpEncryptionSetting {
    fn default() -> Self {
        Self::Starttls
    }
}

fn default_smtp_port() -> u16 {
    587
}

/// Explicit SMTP settings for the TrailBase outgoing mail client.
///
/// When `smtp_host` is non-empty these values are applied and override the
/// `email.dev_intercept` auto-fill.  When `smtp_host` is empty (the default)
/// this section is inactive — the dev auto-fill path is used if enabled.
#[derive(Debug, Deserialize)]
pub struct TrailbaseBootstrapSmtp {
    /// SMTP server hostname or IP.  Empty → section inactive.
    #[serde(default)]
    pub smtp_host: String,
    /// SMTP port (default 587).
    #[serde(default = "default_smtp_port")]
    pub smtp_port: u16,
    /// SMTP authentication username (optional).
    #[serde(default)]
    pub smtp_username: String,
    /// SMTP authentication password (optional).
    /// Supply via `APP_TRAILBASE__SMTP__SMTP_PASSWORD` to avoid storing
    /// credentials in TOML files.
    #[serde(default)]
    pub smtp_password: String,
    /// Encryption mode: `"none"` | `"starttls"` (default) | `"tls"`.
    #[serde(default)]
    pub smtp_encryption: SmtpEncryptionSetting,
    /// Display name used in the `From:` header (optional).
    #[serde(default)]
    pub sender_name: String,
    /// E-mail address used in the `From:` header (optional).
    #[serde(default)]
    pub sender_address: String,
}

impl Default for TrailbaseBootstrapSmtp {
    fn default() -> Self {
        Self {
            smtp_host: String::new(),
            smtp_port: default_smtp_port(),
            smtp_username: String::new(),
            smtp_password: String::new(),
            smtp_encryption: SmtpEncryptionSetting::default(),
            sender_name: String::new(),
            sender_address: String::new(),
        }
    }
}

impl TrailbaseBootstrapSmtp {
    /// Returns `true` when an explicit SMTP host has been configured.
    /// When `false`, the section is treated as inactive.
    pub fn is_configured(&self) -> bool {
        !self.smtp_host.is_empty()
    }
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

impl FrontendSettings {
    /// Resolve the directory from which static frontend assets are served.
    ///
    /// Uses `public_dir` when set; falls back to `<manifest_dir>/ui/dist`.
    pub fn resolve_public_dir(&self, manifest_dir: &std::path::Path) -> std::path::PathBuf {
        if self.public_dir.is_empty() {
            manifest_dir.join("ui/dist")
        } else {
            std::path::PathBuf::from(&self.public_dir)
        }
    }
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

impl Settings {
    /// Load layered configuration.
    ///
    /// Layer order (each overrides the previous):
    ///   1. `appsettings.toml`            - required base defaults
    ///   2. `appsettings.{APP_ENV}.toml`  - optional env-specific overrides
    ///   3. `appsettings.local.toml`      - optional personal overrides (gitignored)
    ///   4. `APP_*` environment variables - runtime overrides (`APP_SERVER__ADDRESS`)
    ///
    /// `APP_ENV` defaults to `"development"` when not set.
    pub fn load() -> Result<Self, ConfigError> {
        let env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());
        let manifest_dir = env!("CARGO_MANIFEST_DIR");

        let config = Config::builder()
            // Layer 1: base defaults (required)
            .add_source(
                File::with_name(&format!("{manifest_dir}/appsettings")).required(true),
            )
            // Layer 2: environment-specific overrides (optional)
            .add_source(
                File::with_name(&format!("{manifest_dir}/appsettings.{env}")).required(false),
            )
            // Layer 3: personal local overrides (optional, gitignored)
            .add_source(
                File::with_name(&format!("{manifest_dir}/appsettings.local")).required(false),
            )
            // Layer 4: environment variables  APP_SERVER__ADDRESS -> server.address
            .add_source(
                Environment::with_prefix("APP")
                    .prefix_separator("_")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()?;

        config.try_deserialize()
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use config::{Config, FileFormat};
    use indoc::indoc;

    /// Build a Settings from raw TOML strings without touching the filesystem.
    fn settings_from_toml(base: &str, overlay: &str) -> Result<Settings, ConfigError> {
        Config::builder()
            .add_source(config::File::from_str(base, FileFormat::Toml))
            .add_source(config::File::from_str(overlay, FileFormat::Toml))
            .build()?
            .try_deserialize()
    }

    const BASE_TOML: &str = indoc! {r#"
        [server]
        address = "0.0.0.0:4000"

        [frontend]
        build = false
        watch = false
        public_dir = ""

        [email]
        dev_intercept = false
        path = "/emails"
        smtp_host = "127.0.0.1"
        smtp_port = 1025

        [trailbase.server]
        application_name = "Argiago"
        site_url = "http://localhost:4000"
        logs_retention_sec = 604800

        [trailbase.auth]
        disable_password_auth = false
        enable_otp_signin = false
    "#};

    const DEV_TOML: &str = indoc! {r#"
        [frontend]
        watch = true
    "#};

    const PROD_TOML: &str = indoc! {r#"
        [frontend]
        build = true
    "#};

    #[test]
    fn development_env_enables_watch_disables_build() {
        let s = settings_from_toml(BASE_TOML, DEV_TOML).expect("should deserialize");
        assert!(s.frontend.watch, "watch should be true in development");
        assert!(!s.frontend.build, "build should be false in development");
    }

    #[test]
    fn production_env_enables_build_disables_watch() {
        let s = settings_from_toml(BASE_TOML, PROD_TOML).expect("should deserialize");
        assert!(s.frontend.build, "build should be true in production");
        assert!(!s.frontend.watch, "watch should be false in production");
    }

    #[test]
    fn base_defaults_are_correct() {
        let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
        assert_eq!(s.server.address, "0.0.0.0:4000");
        assert!(!s.frontend.build);
        assert!(!s.frontend.watch);
        assert_eq!(s.frontend.public_dir, "");
    }

    #[test]
    fn env_var_overrides_production_build_flag() {
        // Set a real env var and verify it overrides the TOML value via the
        // Environment source (prefix="APP", prefix_separator="_", separator="__").
        std::env::set_var("APP_FRONTEND__BUILD", "false");
        let s = Config::builder()
            .add_source(config::File::from_str(BASE_TOML, FileFormat::Toml))
            .add_source(config::File::from_str(PROD_TOML, FileFormat::Toml))
            .add_source(
                config::Environment::with_prefix("APP")
                    .prefix_separator("_")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()
            .unwrap()
            .try_deserialize::<Settings>()
            .expect("should deserialize");
        std::env::remove_var("APP_FRONTEND__BUILD");
        assert!(!s.frontend.build, "env var should override production build=true");
    }

    #[test]
    fn missing_optional_overlay_does_not_panic() {
        // Empty overlay simulates a missing optional file - must not error
        let result = settings_from_toml(BASE_TOML, "");
        assert!(result.is_ok(), "missing optional overlay must not panic or error");
    }

    #[test]
    fn password_auth_enabled_defaults_to_none_when_absent() {
        let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
        assert!(
            s.frontend.password_auth_enabled.is_none(),
            "password_auth_enabled should be None when absent from config"
        );
    }

    #[test]
    fn password_auth_enabled_parses_true_from_toml() {
        let overlay = indoc! {r#"
            [frontend]
            password_auth_enabled = true
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        assert_eq!(
            s.frontend.password_auth_enabled,
            Some(true),
            "password_auth_enabled should be Some(true) when set in config"
        );
    }

    #[test]
    fn password_auth_enabled_parses_false_from_toml() {
        let overlay = indoc! {r#"
            [frontend]
            password_auth_enabled = false
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        assert_eq!(
            s.frontend.password_auth_enabled,
            Some(false),
            "password_auth_enabled should be Some(false) when explicitly set to false"
        );
    }

    #[test]
    fn email_dev_intercept_defaults_to_false() {
        let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
        assert!(!s.email.dev_intercept);
    }

    #[test]
    fn email_dev_intercept_can_be_enabled() {
        let base = indoc! {r#"
            [server]
            address = "0.0.0.0:4000"

            [frontend]
            build = false
            watch = false
            public_dir = ""

            [email]
            dev_intercept = false
            path = "/emails"
            smtp_host = "127.0.0.1"
            smtp_port = 1025

            [trailbase.server]
            application_name = "Argiago"
            site_url = "http://localhost:4000"
            logs_retention_sec = 604800

            [trailbase.auth]
            disable_password_auth = false
            enable_otp_signin = false
        "#};
        let overlay = indoc! {r#"
            [email]
            dev_intercept = true
        "#};
        let s = settings_from_toml(base, overlay).expect("should deserialize");
        assert!(s.email.dev_intercept);
    }

    #[test]
    fn trailbase_bootstrap_defaults_parse_without_oidc() {
        let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
        assert_eq!(s.trailbase.server.application_name, "Argiago");
        assert_eq!(s.trailbase.server.site_url, "http://localhost:4000");
        assert_eq!(s.trailbase.server.logs_retention_sec, 604800);
        assert!(!s.trailbase.auth.disable_password_auth);
        assert!(!s.trailbase.auth.enable_otp_signin);
        assert!(
            s.trailbase.auth.oidc0.is_none(),
            "oidc0 should be None when absent from config"
        );
    }

    #[test]
    fn trailbase_oidc0_is_none_when_client_id_empty() {
        let overlay = indoc! {r#"
            [trailbase.auth.oidc0]
            client_id = ""
            client_secret = ""
            auth_url = "https://idm.example.com/ui/oauth2"
            token_url = "https://idm.example.com/oauth2/token"
            user_api_url = "https://idm.example.com/oauth2/openid/app/userinfo"
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        assert!(
            s.trailbase.auth.oidc0.is_none(),
            "oidc0 should be None when client_id is empty"
        );
    }

    #[test]
    fn trailbase_oidc0_is_some_when_client_id_set() {
        let overlay = indoc! {r#"
            [trailbase.auth.oidc0]
            client_id = "argiago"
            client_secret = "s3cr3t"
            auth_url = "https://idm.example.com/ui/oauth2"
            token_url = "https://idm.example.com/oauth2/token"
            user_api_url = "https://idm.example.com/oauth2/openid/argiago/userinfo"
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        let oidc = s.trailbase.auth.oidc0.expect("oidc0 should be Some");
        assert_eq!(oidc.client_id, "argiago");
        assert_eq!(oidc.client_secret, "s3cr3t");
    }

    #[test]
    fn trailbase_smtp_absent_gives_defaults() {
        let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
        assert!(
            !s.trailbase.smtp.is_configured(),
            "smtp.is_configured() should be false when [trailbase.smtp] is absent"
        );
        assert_eq!(s.trailbase.smtp.smtp_port, 587, "smtp_port default should be 587");
    }

    #[test]
    fn trailbase_smtp_with_host_is_configured() {
        let overlay = indoc! {r#"
            [trailbase.smtp]
            smtp_host = "mail.example.com"
            smtp_port = 465
            smtp_encryption = "tls"
            sender_name = "Argiago"
            sender_address = "noreply@argiago.ru"
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        assert!(s.trailbase.smtp.is_configured());
        assert_eq!(s.trailbase.smtp.smtp_host, "mail.example.com");
        assert_eq!(s.trailbase.smtp.smtp_port, 465);
        assert!(matches!(
            s.trailbase.smtp.smtp_encryption,
            SmtpEncryptionSetting::Tls
        ));
        assert_eq!(s.trailbase.smtp.sender_name, "Argiago");
        assert_eq!(s.trailbase.smtp.sender_address, "noreply@argiago.ru");
    }

    #[test]
    fn trailbase_smtp_encryption_none_parses() {
        let overlay = indoc! {r#"
            [trailbase.smtp]
            smtp_host = "127.0.0.1"
            smtp_encryption = "none"
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        assert!(matches!(
            s.trailbase.smtp.smtp_encryption,
            SmtpEncryptionSetting::None
        ));
    }

    #[test]
    fn trailbase_smtp_sender_only_without_host_is_not_configured() {
        // sender fields alone do not activate the explicit SMTP path
        let overlay = indoc! {r#"
            [trailbase.smtp]
            sender_name = "Argiago"
            sender_address = "noreply@argiago.ru"
        "#};
        let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
        assert!(
            !s.trailbase.smtp.is_configured(),
            "smtp.is_configured() must be false when only sender fields are set"
        );
        assert_eq!(s.trailbase.smtp.sender_name, "Argiago");
        assert_eq!(s.trailbase.smtp.sender_address, "noreply@argiago.ru");
    }
}
