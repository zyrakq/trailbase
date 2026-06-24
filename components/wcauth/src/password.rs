use argon2::{Argon2, PasswordHasher};
use password_hash::SaltString;
use rand::rngs::OsRng;
use trailbase_wasm::http::HttpError;
use trailbase_wasm::kv::Store;

use crate::config::AuthConfig;
use crate::error::{bad_request, internal};

#[derive(Clone, Debug)]
pub(crate) struct PasswordOptions {
    min_length: usize,
    max_length: usize,
    must_contain_upper_and_lower_case: bool,
    must_contain_digits: bool,
    must_contain_special_characters: bool,
}

impl Default for PasswordOptions {
    fn default() -> Self {
        return Self {
            min_length: 8,
            max_length: 128,
            must_contain_upper_and_lower_case: false,
            must_contain_digits: false,
            must_contain_special_characters: false,
        };
    }
}

impl From<&AuthConfig> for PasswordOptions {
    fn from(value: &AuthConfig) -> Self {
        return Self {
            min_length: value.password_minimal_length as usize,
            max_length: 128,
            must_contain_upper_and_lower_case: value.password_must_contain_upper_and_lower_case,
            must_contain_digits: value.password_must_contain_digits,
            must_contain_special_characters: value.password_must_contain_special_characters,
        };
    }
}

pub(crate) fn hash_password(password: &str) -> Result<String, HttpError> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(internal)?;
    return Ok(hash.to_string());
}

pub(crate) fn validate_password_policy(
    password: &str,
    password_repeat: &str,
    opts: &PasswordOptions,
) -> Result<(), HttpError> {
    if password != password_repeat {
        return Err(bad_request("Passwords don't match"));
    }

    if password.len() < opts.min_length {
        return Err(bad_request("Password too short"));
    }

    if password.len() > opts.max_length {
        return Err(bad_request("Password too long"));
    }

    if opts.must_contain_digits {
        if !password.chars().any(|x| x.is_numeric()) {
            return Err(bad_request("Must contain digits"));
        }
        if password.chars().all(|x| x.is_numeric()) {
            return Err(bad_request("Must contain non-digits"));
        }
    }

    if opts.must_contain_upper_and_lower_case
        && !(password.chars().any(|x| x.is_lowercase())
            && password.chars().any(|x| x.is_uppercase()))
    {
        return Err(bad_request("Must contain lower and upper case"));
    }

    if opts.must_contain_special_characters && password.chars().all(|x| x.is_alphanumeric()) {
        return Err(bad_request("Must contain special characters"));
    }

    return Ok(());
}

pub(crate) fn read_password_options() -> Result<PasswordOptions, HttpError> {
    let store = Store::open().map_err(internal)?;
    match store.get("config:auth").map_err(internal)? {
        Some(bytes) if !bytes.is_empty() => {
            let config: AuthConfig = serde_json::from_slice(&bytes).map_err(internal)?;
            return Ok(PasswordOptions::from(&config));
        }
        _ => return Ok(PasswordOptions::default()),
    }
}

pub(crate) fn current_unix_secs() -> u64 {
    return std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn password_policy_rejects_mismatch() {
        let opts = PasswordOptions::default();
        let err = validate_password_policy("abc12345", "abc123456", &opts).unwrap_err();
        assert_eq!(err.message.as_deref(), Some("Passwords don't match"));
    }

    #[test]
    fn password_policy_rejects_short() {
        let opts = PasswordOptions::default();
        let err = validate_password_policy("short", "short", &opts).unwrap_err();
        assert_eq!(err.message.as_deref(), Some("Password too short"));
    }

    #[test]
    fn password_policy_enforces_digits_when_required() {
        let opts = PasswordOptions {
            must_contain_digits: true,
            ..Default::default()
        };

        let err = validate_password_policy("abcdefgh", "abcdefgh", &opts).unwrap_err();
        assert_eq!(err.message.as_deref(), Some("Must contain digits"));

        let err = validate_password_policy("12345678", "12345678", &opts).unwrap_err();
        assert_eq!(err.message.as_deref(), Some("Must contain non-digits"));
    }

    #[test]
    fn password_policy_enforces_special_when_required() {
        let opts = PasswordOptions {
            must_contain_special_characters: true,
            ..Default::default()
        };

        let err = validate_password_policy("abcdef12", "abcdef12", &opts).unwrap_err();
        assert_eq!(err.message.as_deref(), Some("Must contain special characters"));
    }

    #[test]
    fn password_policy_accepts_strong_password() {
        let opts = PasswordOptions {
            must_contain_upper_and_lower_case: true,
            must_contain_digits: true,
            must_contain_special_characters: true,
            ..Default::default()
        };

        assert!(validate_password_policy("Abcdef1!", "Abcdef1!", &opts).is_ok());
    }

    #[test]
    fn hash_password_produces_argon2_phc_string() {
        let hash = hash_password("hunter2").expect("hash should succeed");
        assert!(
            hash.starts_with("$argon2"),
            "expected argon2 PHC string, got: {hash}"
        );
    }
}
