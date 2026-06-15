use super::bootstrap::SmtpEncryptionSetting;
use super::loader::Settings;
use config::{Config, ConfigError, FileFormat};
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

    [mailcrab]
    dev_intercept = false
    path = "/_/mailcrab"
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
fn missing_optional_overlay_does_not_panic() {
    let result = settings_from_toml(BASE_TOML, "");
    assert!(
        result.is_ok(),
        "missing optional overlay must not panic or error"
    );
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
    assert!(!s.mailcrab.dev_intercept);
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

        [mailcrab]
        dev_intercept = false
        path = "/_/mailcrab"
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
        [mailcrab]
        dev_intercept = true
    "#};
    let s = settings_from_toml(base, overlay).expect("should deserialize");
    assert!(s.mailcrab.dev_intercept);
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
    assert_eq!(
        s.trailbase.smtp.smtp_port, 587,
        "smtp_port default should be 587"
    );
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

#[test]
fn email_templates_absent_gives_empty_defaults() {
    let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
    assert!(!s.trailbase.email.user_verification.has_content());
    assert!(!s.trailbase.email.password_reset.has_content());
    assert!(!s.trailbase.email.change_email.has_content());
    assert!(!s.trailbase.email.otp.has_content());
}

#[test]
fn email_template_body_only_has_content() {
    let overlay = indoc! {r#"
        [trailbase.email.password_reset]
        body = "<p>Reset link: {{ TOKEN }}</p>"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert!(s.trailbase.email.password_reset.has_content());
    assert_eq!(
        s.trailbase.email.password_reset.body,
        "<p>Reset link: {{ TOKEN }}</p>"
    );
    assert_eq!(s.trailbase.email.password_reset.subject, "");
    // Other templates stay empty.
    assert!(!s.trailbase.email.user_verification.has_content());
}

#[test]
fn email_template_subject_only_has_content() {
    let overlay = indoc! {r#"
        [trailbase.email.otp]
        subject = "Your OTP code"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert!(s.trailbase.email.otp.has_content());
    assert_eq!(s.trailbase.email.otp.subject, "Your OTP code");
    assert_eq!(s.trailbase.email.otp.body, "");
}

#[test]
fn email_template_all_four_parse() {
    let overlay = indoc! {r#"
        [trailbase.email.user_verification]
        subject = "Verify your email"
        body = "<p>{{ VERIFICATION_URL }}</p>"

        [trailbase.email.password_reset]
        subject = "Reset your password"
        body = "<p>{{ TOKEN }}</p>"

        [trailbase.email.change_email]
        subject = "Confirm email change"
        body = "<p>{{ VERIFICATION_URL }}</p>"

        [trailbase.email.otp]
        subject = "Your OTP"
        body = "<p>{{ CODE }}</p>"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert!(s.trailbase.email.user_verification.has_content());
    assert!(s.trailbase.email.password_reset.has_content());
    assert!(s.trailbase.email.change_email.has_content());
    assert!(s.trailbase.email.otp.has_content());
    assert_eq!(
        s.trailbase.email.password_reset.subject,
        "Reset your password"
    );
}
