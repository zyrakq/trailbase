// app/src/trailbase_bootstrap.rs
//
// Applies bootstrap settings to TrailBase on first start.
//
// Called AFTER `trailbase::Server::init()` — TrailBase creates a default
// `config.textproto` when the file is absent, then this module overwrites
// it with the values from `[trailbase]` settings.
//
// The caller checks whether `config.textproto` existed before `Server::init()`
// and only calls `apply_bootstrap` when it did not (first start).

use crate::settings::{EmailSettings, SmtpEncryptionSetting, TrailbaseBootstrap};
use trailbase::config::proto::{
    EmailConfig, OAuthProviderConfig, OAuthProviderId, SmtpEncryption,
};
use trailbase::AppState;
use tracing::{info, warn};

/// Map a settings-layer encryption value to the proto i32.
fn smtp_encryption_proto(enc: &SmtpEncryptionSetting) -> i32 {
    match enc {
        SmtpEncryptionSetting::None => SmtpEncryption::None as i32,
        SmtpEncryptionSetting::Starttls => SmtpEncryption::Starttls as i32,
        SmtpEncryptionSetting::Tls => SmtpEncryption::Tls as i32,
    }
}

/// Return `Some(s.to_string())` when `s` is non-empty, otherwise `None`.
fn non_empty(s: &str) -> Option<String> {
    if s.is_empty() { None } else { Some(s.to_string()) }
}

/// Apply `[trailbase]` bootstrap settings to the live TrailBase config.
///
/// Modifies the in-memory config returned by `state.get_config()`, then
/// persists it via `state.validate_and_update_config()` which atomically
/// updates the in-memory reactive config and rewrites `config.textproto`
/// and `vault.textproto` on disk.
///
/// **Email priority** (highest first):
/// 1. `[trailbase.smtp]` with `smtp_host` set — explicit settings, always used
/// 2. `email.dev_intercept = true` — auto-fills mailcrab host/port/no-TLS
/// 3. Neither — email block left at TrailBase defaults
pub async fn apply_bootstrap(
    state: &AppState,
    bootstrap: &TrailbaseBootstrap,
    email: &EmailSettings,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut config = (*state.get_config()).clone();

    // Server block.
    config.server.application_name = Some(bootstrap.server.application_name.clone());
    config.server.site_url = Some(bootstrap.server.site_url.clone());
    config.server.logs_retention_sec = Some(bootstrap.server.logs_retention_sec as i64);

    // Auth block.
    config.auth.disable_password_auth = Some(bootstrap.auth.disable_password_auth);
    if bootstrap.auth.enable_otp_signin {
        config.auth.enable_otp_signin = Some(true);
    }

    // OIDC0 provider (optional).
    if let Some(oidc) = &bootstrap.auth.oidc0 {
        if oidc.client_secret.is_empty() {
            warn!(
                "TrailBase bootstrap: OIDC client_secret is empty for \
                 client_id='{}' — OIDC login will fail. \
                 Set APP_TRAILBASE__AUTH__OIDC0__CLIENT_SECRET before first start",
                oidc.client_id
            );
        }
        let provider = OAuthProviderConfig {
            client_id: Some(oidc.client_id.clone()),
            client_secret: Some(oidc.client_secret.clone()),
            provider_id: Some(OAuthProviderId::Oidc0 as i32),
            auth_url: Some(oidc.auth_url.clone()),
            token_url: Some(oidc.token_url.clone()),
            user_api_url: Some(oidc.user_api_url.clone()),
            ..Default::default()
        };
        config.auth.oauth_providers.insert("oidc0".to_string(), provider);
    }

    // Email block.
    //
    // Priority: explicit [trailbase.smtp] (smtp_host set) > dev_intercept auto-fill.
    // When neither is active the email block is left at TrailBase defaults.
    if bootstrap.smtp.is_configured() {
        config.email = EmailConfig {
            smtp_host: Some(bootstrap.smtp.smtp_host.clone()),
            smtp_port: Some(u32::from(bootstrap.smtp.smtp_port)),
            smtp_username: non_empty(&bootstrap.smtp.smtp_username),
            smtp_password: non_empty(&bootstrap.smtp.smtp_password),
            smtp_encryption: Some(smtp_encryption_proto(&bootstrap.smtp.smtp_encryption)),
            sender_name: non_empty(&bootstrap.smtp.sender_name),
            sender_address: non_empty(&bootstrap.smtp.sender_address),
            ..Default::default()
        };
        info!("TrailBase bootstrap: explicit SMTP settings applied");
    } else if email.dev_intercept {
        // Auto-fill with mailcrab settings: no encryption, no auth.
        config.email = EmailConfig {
            smtp_host: Some(email.smtp_host.clone()),
            smtp_port: Some(u32::from(email.smtp_port)),
            smtp_encryption: Some(SmtpEncryption::None as i32),
            ..Default::default()
        };
        info!("TrailBase bootstrap: mailcrab SMTP auto-fill applied");
    }

    state
        .validate_and_update_config(config, None)
        .await
        .map_err(|e| -> Box<dyn std::error::Error + Send + Sync> {
            format!("TrailBase bootstrap failed: {e:?}").into()
        })?;

    info!("TrailBase bootstrap settings applied (first start)");
    Ok(())
}
