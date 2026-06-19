use super::bootstrap::SmtpEncryptionSetting;
use super::components::ComponentSource;
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
    serve_from = "disk"
    watch = false
    public_dir = ""

    [mailcrab]
    dev_intercept = false
    path = "/_/mailcrab"
    smtp_host = "127.0.0.1"
    smtp_port = 1025

    [trailbase.server]
    application_name = "Velora"
    site_url = "http://localhost:4000"
    logs_retention_sec = 604800

    [trailbase.auth]
    disable_password_auth = false
    enable_otp_signin = false
"#};

const DEV_TOML: &str = indoc! {r#"
    [frontend]
    serve_from = "disk"
    watch = true
"#};

const PROD_TOML: &str = indoc! {r#"
    [frontend]
    serve_from = "embedded"
"#};

#[test]
fn development_env_enables_watch_in_disk_mode() {
    let s = settings_from_toml(BASE_TOML, DEV_TOML).expect("should deserialize");
    assert!(s.frontend.watch, "watch should be true in development");
    assert_eq!(
        s.frontend.effective_serve_from(),
        "disk",
        "development should serve from disk"
    );
}

#[test]
fn production_env_uses_embedded_serve_mode() {
    let s = settings_from_toml(BASE_TOML, PROD_TOML).expect("should deserialize");
    assert_eq!(
        s.frontend.effective_serve_from(),
        "embedded",
        "production should serve from embedded assets"
    );
    assert!(!s.frontend.watch, "watch should be false in production");
}

#[test]
fn base_defaults_are_correct() {
    let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
    assert_eq!(s.server.address, "0.0.0.0:4000");
    assert_eq!(s.frontend.effective_serve_from(), "disk");
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
        serve_from = "disk"
        watch = false
        public_dir = ""

        [mailcrab]
        dev_intercept = false
        path = "/_/mailcrab"
        smtp_host = "127.0.0.1"
        smtp_port = 1025

        [trailbase.server]
        application_name = "Velora"
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
    assert_eq!(s.trailbase.server.application_name, "Velora");
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
        client_id = "velora"
        client_secret = "s3cr3t"
        auth_url = "https://idm.example.com/ui/oauth2"
        token_url = "https://idm.example.com/oauth2/token"
        user_api_url = "https://idm.example.com/oauth2/openid/velora/userinfo"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    let oidc = s.trailbase.auth.oidc0.expect("oidc0 should be Some");
    assert_eq!(oidc.client_id, "velora");
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
        sender_name = "Velora"
        sender_address = "noreply@velora.ru"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert!(s.trailbase.smtp.is_configured());
    assert_eq!(s.trailbase.smtp.smtp_host, "mail.example.com");
    assert_eq!(s.trailbase.smtp.smtp_port, 465);
    assert!(matches!(
        s.trailbase.smtp.smtp_encryption,
        SmtpEncryptionSetting::Tls
    ));
    assert_eq!(s.trailbase.smtp.sender_name, "Velora");
    assert_eq!(s.trailbase.smtp.sender_address, "noreply@velora.ru");
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
        sender_name = "Velora"
        sender_address = "noreply@velora.ru"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert!(
        !s.trailbase.smtp.is_configured(),
        "smtp.is_configured() must be false when only sender fields are set"
    );
    assert_eq!(s.trailbase.smtp.sender_name, "Velora");
    assert_eq!(s.trailbase.smtp.sender_address, "noreply@velora.ru");
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

// ---------------------------------------------------------------------------
// Component settings tests
// ---------------------------------------------------------------------------

#[test]
fn component_source_build_round_trips_through_config() {
    let overlay = indoc! {r#"
        [[components.items]]
        name = "auth_ui"
        wasm = "auth_ui_component.wasm"
        source = { build = "auth-ui-component" }
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert_eq!(s.components.items.len(), 1);
    assert_eq!(s.components.items[0].name, "auth_ui");
    assert_eq!(
        s.components.items[0].source,
        ComponentSource::Build("auth-ui-component".to_string())
    );
}

#[test]
fn component_source_fetch_round_trips_through_config() {
    let overlay = indoc! {r#"
        [[components.items]]
        name = "auth_ui"
        wasm = "auth_ui_component.wasm"
        source = { fetch = "trailbase/auth_ui" }
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert_eq!(s.components.items.len(), 1);
    assert_eq!(
        s.components.items[0].source,
        ComponentSource::Fetch("trailbase/auth_ui".to_string())
    );
}

#[test]
fn component_settings_default_to_empty() {
    let s = settings_from_toml(BASE_TOML, "").expect("should deserialize");
    assert!(!s.components.rebuild);
    assert!(!s.components.refetch);
    assert!(s.components.items.is_empty());
}

#[test]
fn component_global_rebuild_refetch_parse() {
    let overlay = indoc! {r#"
        [components]
        rebuild = true
        refetch = true
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert!(s.components.rebuild);
    assert!(s.components.refetch);
}

#[test]
fn per_item_rebuild_override_parses() {
    let overlay = indoc! {r#"
        [[components.items]]
        name = "trail_auth"
        wasm = "trail_auth_component.wasm"
        source = { build = "trail-auth-component" }
        rebuild = true
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert_eq!(s.components.items[0].rebuild, Some(true));
    assert_eq!(s.components.items[0].refetch, None);
}

#[test]
fn multiple_items_parse_in_order() {
    let overlay = indoc! {r#"
        [[components.items]]
        name = "auth_ui"
        wasm = "auth_ui_component.wasm"
        source = { fetch = "trailbase/auth_ui" }

        [[components.items]]
        name = "trail_auth"
        wasm = "trail_auth_component.wasm"
        source = { build = "trail-auth-component" }
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert_eq!(s.components.items.len(), 2);
    assert_eq!(s.components.items[0].name, "auth_ui");
    assert_eq!(s.components.items[1].name, "trail_auth");
}

#[test]
fn overlay_replaces_items_array_wholesale() {
    // Base has two items; overlay provides one item.
    // The config crate replaces arrays wholesale — result has 1 item, not 3.
    let base = indoc! {r#"
        [server]
        address = "0.0.0.0:4000"

        [frontend]
        serve_from = "disk"
        watch = false
        public_dir = ""

        [mailcrab]
        dev_intercept = false
        path = "/_/mailcrab"
        smtp_host = "127.0.0.1"
        smtp_port = 1025

        [trailbase.server]
        application_name = "Velora"
        site_url = "http://localhost:4000"
        logs_retention_sec = 604800

        [trailbase.auth]
        disable_password_auth = false
        enable_otp_signin = false

        [[components.items]]
        name = "auth_ui"
        wasm = "auth_ui_component.wasm"
        source = { fetch = "trailbase/auth_ui" }

        [[components.items]]
        name = "trail_auth"
        wasm = "trail_auth_component.wasm"
        source = { build = "trail-auth-component" }
    "#};
    let overlay = indoc! {r#"
        [[components.items]]
        name = "trail_auth"
        wasm = "trail_auth_component.wasm"
        source = { build = "trail-auth-component" }
    "#};
    let s = settings_from_toml(base, overlay).expect("should deserialize");
    assert_eq!(
        s.components.items.len(),
        1,
        "overlay must replace the items array wholesale, not merge"
    );
    assert_eq!(s.components.items[0].name, "trail_auth");
}

#[test]
fn env_override_sets_components_rebuild() {
    // This test uses the real Environment source with prefix APP.
    // Safe because no other test in this module reads env vars.
    // SAFETY: no other test in this module reads env vars concurrently.
    unsafe { std::env::set_var("APP_COMPONENTS__REBUILD", "true"); }
    let result = Config::builder()
        .add_source(config::File::from_str(BASE_TOML, FileFormat::Toml))
        .add_source(
            config::Environment::with_prefix("APP")
                .prefix_separator("_")
                .separator("__")
                .try_parsing(true),
        )
        .build()
        .unwrap()
        .try_deserialize::<Settings>();
    // SAFETY: test teardown — removing our own env var.
    unsafe { std::env::remove_var("APP_COMPONENTS__REBUILD"); }
    let s = result.expect("should deserialize with env override");
    assert!(
        s.components.rebuild,
        "APP_COMPONENTS__REBUILD=true should set components.rebuild"
    );
}

#[test]
fn appsettings_example_toml_parses() {
    // The example file is the canonical reference for all available settings.
    // It must remain in sync with the `Settings` struct — this test guards that
    // contract by parsing it through the same config builder the app uses.
    let example = include_str!("../../appsettings.example.toml");
    let s = settings_from_toml(example, "").expect("example should deserialize as Settings");
    assert_eq!(s.server.address, "0.0.0.0:4000");
    assert_eq!(s.frontend.effective_serve_from(), "disk");
    assert!(!s.frontend.watch);
    assert_eq!(s.trailbase.server.application_name, "Velora");
    assert!(
        s.trailbase.auth.oidc0.is_some(),
        "oidc0 should be Some when client_id is set in the example"
    );
    assert!(
        !s.trailbase.smtp.is_configured(),
        "smtp should not be configured when smtp_host is empty in the example"
    );
    // Live example shows the auth_ui fetch variant. The trail_auth build
    // variant is commented out in the example file — see file for details.
    assert_eq!(s.components.items.len(), 1);
    assert_eq!(s.components.items[0].name, "auth_ui");
    assert_eq!(
        s.components.items[0].source,
        ComponentSource::Fetch("trailbase/auth_ui".to_string())
    );
}

// ---------------------------------------------------------------------------
// Frontend serve_from tests
// ---------------------------------------------------------------------------

#[test]
fn serve_from_defaults_to_disk_when_absent() {
    // A base with no serve_from in [frontend] - exercises the serde default.
    let base = indoc! {r#"
        [server]
        address = "0.0.0.0:4000"

        [frontend]
        watch = false
        public_dir = ""

        [mailcrab]
        dev_intercept = false
        path = "/_/mailcrab"
        smtp_host = "127.0.0.1"
        smtp_port = 1025

        [trailbase.server]
        application_name = "Velora"
        site_url = "http://localhost:4000"
        logs_retention_sec = 604800

        [trailbase.auth]
        disable_password_auth = false
        enable_otp_signin = false
    "#};
    let s = settings_from_toml(base, "").expect("should deserialize");
    assert_eq!(
        s.frontend.serve_from, "disk",
        "absent serve_from should default to disk via serde default"
    );
    assert_eq!(s.frontend.effective_serve_from(), "disk");
}

#[test]
fn serve_from_empty_string_is_treated_as_disk() {
    let overlay = indoc! {r#"
        [frontend]
        serve_from = ""
        watch = false
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert_eq!(
        s.frontend.effective_serve_from(),
        "disk",
        "empty serve_from should be treated as disk"
    );
}

#[test]
fn serve_from_embedded_parses() {
    let overlay = indoc! {r#"
        [frontend]
        serve_from = "embedded"
    "#};
    let s = settings_from_toml(BASE_TOML, overlay).expect("should deserialize");
    assert_eq!(s.frontend.serve_from, "embedded");
    assert_eq!(s.frontend.effective_serve_from(), "embedded");
}
