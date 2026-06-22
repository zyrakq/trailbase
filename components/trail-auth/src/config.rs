use serde::{Deserialize, Serialize};
use trailbase_wasm::http::HttpError;

use crate::db_kv::kv_get;
use crate::error::internal;

pub(crate) const KV_RESET_PASSWORD_URL: &str = "reset_password_redirect_url";
const DEFAULT_RESET_PASSWORD_URL: &str = "/reset-password?token={token}";

pub(crate) const KV_VERIFY_EMAIL_URL: &str = "verify_email_redirect_url";
const DEFAULT_VERIFY_EMAIL_URL: &str = "/verify-email?token={token}";

pub(crate) fn default_min_length() -> u32 {
    return 8;
}

#[derive(Deserialize, Default)]
pub(crate) struct AuthConfig {
    pub(crate) disable_password_auth: bool,
    #[serde(default = "default_min_length")]
    pub(crate) password_minimal_length: u32,
    #[serde(default)]
    pub(crate) password_must_contain_upper_and_lower_case: bool,
    #[serde(default)]
    pub(crate) password_must_contain_digits: bool,
    #[serde(default)]
    pub(crate) password_must_contain_special_characters: bool,
}

#[derive(Serialize, Deserialize)]
pub(crate) struct TrailAuthConfig {
    pub(crate) reset_password_redirect_url: String,
    #[serde(default)]
    pub(crate) verify_email_redirect_url: String,
}

pub(crate) fn read_reset_password_url() -> Result<String, HttpError> {
    match kv_get(KV_RESET_PASSWORD_URL)? {
        Some(bytes) if !bytes.is_empty() => {
            String::from_utf8(bytes).map_err(|e| internal(format!("invalid UTF-8 in KV: {e}")))
        }
        _ => Ok(DEFAULT_RESET_PASSWORD_URL.to_string()),
    }
}

pub(crate) fn read_verify_email_url() -> Result<String, HttpError> {
    match kv_get(KV_VERIFY_EMAIL_URL)? {
        Some(bytes) if !bytes.is_empty() => {
            String::from_utf8(bytes).map_err(|e| internal(format!("invalid UTF-8 in KV: {e}")))
        }
        _ => Ok(DEFAULT_VERIFY_EMAIL_URL.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_verify_email_url_starts_with_verify_email_path() {
        assert!(DEFAULT_VERIFY_EMAIL_URL.starts_with("/verify-email"));
    }

    #[test]
    fn default_verify_email_url_contains_token_placeholder() {
        assert!(DEFAULT_VERIFY_EMAIL_URL.contains("{token}"));
    }

    #[test]
    fn kv_verify_email_url_key_is_distinct_from_reset_password() {
        assert_ne!(KV_VERIFY_EMAIL_URL, KV_RESET_PASSWORD_URL);
    }

    #[test]
    fn default_reset_password_url_still_unchanged() {
        assert_eq!(DEFAULT_RESET_PASSWORD_URL, "/reset-password?token={token}");
    }
}
