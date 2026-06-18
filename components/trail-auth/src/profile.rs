use serde::Serialize;
use trailbase_wasm::db;
use trailbase_wasm::http::{HttpError, IntoResponse, Json, Response};
use trailbase_wasm::kv::Store;

use crate::config::{default_min_length, AuthConfig};
use crate::error::internal;

#[derive(Serialize)]
struct ProfileResponse {
    show_otp_section: bool,
    show_change_password: bool,
    can_set_password: bool,
    password_policy: PasswordPolicy,
}

#[derive(Serialize)]
struct PasswordPolicy {
    min_length: u32,
    must_contain_upper_and_lower_case: bool,
    must_contain_digits: bool,
    must_contain_special_characters: bool,
}

impl Default for PasswordPolicy {
    fn default() -> Self {
        return Self {
            min_length: default_min_length(),
            must_contain_upper_and_lower_case: false,
            must_contain_digits: false,
            must_contain_special_characters: false,
        };
    }
}

pub(crate) async fn profile_capabilities_handler(
    user: &trailbase_wasm::http::User,
) -> Result<Response, HttpError> {
    let rows = db::query(
        r#"SELECT provider_id, password_hash FROM "_user" WHERE email = ?"#,
        vec![db::Value::Text(user.email.clone())],
    )
    .await
    .map_err(internal)?;

    let is_oauth_only = rows
        .first()
        .and_then(|row| {
            let is_oauth = match row.first()? {
                db::Value::Integer(n) => *n != 0,
                _ => false,
            };
            let no_password = match row.get(1)? {
                db::Value::Text(s) => s.is_empty(),
                _ => true,
            };
            Some(is_oauth && no_password)
        })
        .unwrap_or(false);

    let (password_auth_enabled, password_policy) = {
        let store = Store::open().map_err(internal)?;
        match store.get("config:auth").map_err(internal)? {
            Some(bytes) if !bytes.is_empty() => serde_json::from_slice::<AuthConfig>(&bytes)
                .map(|c| {
                    (
                        !c.disable_password_auth,
                        PasswordPolicy {
                            min_length: c.password_minimal_length,
                            must_contain_upper_and_lower_case: c
                                .password_must_contain_upper_and_lower_case,
                            must_contain_digits: c.password_must_contain_digits,
                            must_contain_special_characters: c
                                .password_must_contain_special_characters,
                        },
                    )
                })
                .unwrap_or((true, PasswordPolicy::default())),
            _ => (true, PasswordPolicy::default()),
        }
    };

    let can_set_password = is_oauth_only && password_auth_enabled;

    return Ok(Json(ProfileResponse {
        show_otp_section: !is_oauth_only && password_auth_enabled,
        show_change_password: !is_oauth_only && password_auth_enabled,
        can_set_password,
        password_policy,
    })
    .into_response());
}
