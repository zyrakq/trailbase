use serde::Deserialize;

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
    /// Email templates for TrailBase transactional messages.
    ///
    /// Each sub-section is optional — an absent or empty template leaves the
    /// TrailBase built-in default in place.
    #[serde(default)]
    pub email: TrailbaseBootstrapEmailCfg,
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

/// A single email template (subject + HTML body).
///
/// Both fields default to an empty string, which means "use the TrailBase
/// built-in default for this template".
#[derive(Debug, Default, Deserialize)]
pub struct TrailbaseBootstrapEmailTemplate {
    /// Email subject line.  Empty → keep TrailBase default.
    #[serde(default)]
    pub subject: String,
    /// HTML email body.  Empty → keep TrailBase default.
    #[serde(default)]
    pub body: String,
}

impl TrailbaseBootstrapEmailTemplate {
    /// Returns `true` when at least one of the fields carries a value.
    pub fn has_content(&self) -> bool {
        !self.subject.is_empty() || !self.body.is_empty()
    }
}

/// Email templates for all four TrailBase transactional message types.
///
/// Every sub-struct is optional (defaults to all-empty).  When a template has
/// no content (`has_content()` is false) it is left untouched in the config so
/// the TrailBase built-in default remains active.
#[derive(Debug, Default, Deserialize)]
pub struct TrailbaseBootstrapEmailCfg {
    #[serde(default)]
    pub user_verification: TrailbaseBootstrapEmailTemplate,
    #[serde(default)]
    pub password_reset: TrailbaseBootstrapEmailTemplate,
    #[serde(default)]
    pub change_email: TrailbaseBootstrapEmailTemplate,
    #[serde(default)]
    pub otp: TrailbaseBootstrapEmailTemplate,
}
