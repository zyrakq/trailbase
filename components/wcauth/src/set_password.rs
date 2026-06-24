use serde::Deserialize;
use trailbase_wasm::db;
use trailbase_wasm::http::{HttpError, IntoResponse, Json, Response, StatusCode};
use trailbase_wasm::kv::Store;

use crate::error::{bad_request, internal};
use crate::password::{
    current_unix_secs, hash_password, read_password_options, validate_password_policy,
};

#[derive(Deserialize)]
struct SetPasswordRequest {
    new_password: String,
    new_password_repeat: String,
}

const SET_PASSWORD_MAX_ATTEMPTS: u32 = 5;
const SET_PASSWORD_WINDOW_SECS: u64 = 60;

pub(crate) async fn set_password_handler(
    user: &trailbase_wasm::http::User,
    body: Vec<u8>,
) -> Result<Response, HttpError> {
    let req: SetPasswordRequest = serde_json::from_slice(&body).map_err(bad_request)?;

    let rows = db::query(
        r#"SELECT password_hash FROM "_user" WHERE email = ?"#,
        vec![db::Value::Text(user.email.clone())],
    )
    .await
    .map_err(internal)?;

    let existing = rows
        .first()
        .and_then(|row| row.first())
        .and_then(|value| match value {
            db::Value::Text(s) => Some(s.clone()),
            _ => None,
        })
        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

    if !existing.is_empty() {
        return Err(HttpError::status(StatusCode::CONFLICT));
    }

    let rl_key = format!("ratelimit:set_password:{}", user.id);
    let now = current_unix_secs();
    let mut count = 0_u32;

    if let Some(bytes) = Store::open().map_err(internal)?.get(&rl_key).map_err(internal)? {
        if let Ok(value) = std::str::from_utf8(&bytes)
            && let Some((count_str, ts_str)) = value.split_once(':')
        {
            let ts = ts_str.parse::<u64>().unwrap_or(0);
            if now.saturating_sub(ts) < SET_PASSWORD_WINDOW_SECS {
                count = count_str.parse::<u32>().unwrap_or(0);
            }
        }
    }

    if count >= SET_PASSWORD_MAX_ATTEMPTS {
        return Err(HttpError::status(StatusCode::TOO_MANY_REQUESTS));
    }

    Store::open()
        .map_err(internal)?
        .set(&rl_key, format!("{}:{}", count + 1, now).as_bytes())
        .map_err(internal)?;

    let opts = read_password_options()?;
    validate_password_policy(&req.new_password, &req.new_password_repeat, &opts)?;

    let hash = hash_password(&req.new_password)?;

    let rows_affected = db::execute(
        r#"UPDATE "_user" SET password_hash = ? WHERE email = ? AND password_hash = ''"#,
        vec![db::Value::Text(hash), db::Value::Text(user.email.clone())],
    )
    .await
    .map_err(internal)?;

    if rows_affected != 1 {
        return Err(HttpError::status(StatusCode::CONFLICT));
    }

    return Ok(Json(serde_json::json!({"ok": true})).into_response());
}
