//! Persistent key-value store backed by a SQLite table.
//!
//! The wasi-keyvalue Store is in-memory and resets on every server restart.
//! This module provides equivalent semantics using the TrailBase Transaction
//! (SQLite) API, which writes to the persistent on-disk SQLite database.
//!
//! The backing table `_wcauth_kv` is created by the SQL migration
//! `traildepot/migrations/main/V100__wcauth_kv.sql`.

use trailbase_wasm::db::{Transaction, Value};
use trailbase_wasm::http::HttpError;

use crate::error::internal;

const TABLE: &str = "_wcauth_kv";

pub(crate) fn kv_get(key: &str) -> Result<Option<Vec<u8>>, HttpError> {
    let mut tx = Transaction::begin().map_err(|e| internal(format!("{e:?}")))?;
    let rows = tx
        .query(
            &format!("SELECT value FROM {TABLE} WHERE key = ?1"),
            &[Value::Text(key.to_string())],
        )
        .map_err(|e| internal(format!("{e:?}")))?;
    tx.commit().map_err(|e| internal(format!("{e:?}")))?;

    Ok(rows.into_iter().next().and_then(|mut row| match row.pop() {
        Some(Value::Text(s)) => Some(s.into_bytes()),
        Some(Value::Blob(b)) => Some(b),
        _ => None,
    }))
}

pub(crate) fn kv_set(key: &str, value: &[u8]) -> Result<(), HttpError> {
    // All values we store (URLs, JSON) are valid UTF-8; lossy conversion is a
    // safe fallback that avoids a hard error on malformed input.
    let text = String::from_utf8_lossy(value).into_owned();
    let mut tx = Transaction::begin().map_err(|e| internal(format!("{e:?}")))?;
    tx.execute(
        &format!(
            "INSERT INTO {TABLE} (key, value) VALUES (?1, ?2) \
             ON CONFLICT(key) DO UPDATE SET value = excluded.value"
        ),
        &[Value::Text(key.to_string()), Value::Text(text)],
    )
    .map_err(|e| internal(format!("{e:?}")))?;
    tx.commit().map_err(|e| internal(format!("{e:?}")))?;
    Ok(())
}

pub(crate) fn kv_delete(key: &str) -> Result<(), HttpError> {
    let mut tx = Transaction::begin().map_err(|e| internal(format!("{e:?}")))?;
    tx.execute(
        &format!("DELETE FROM {TABLE} WHERE key = ?1"),
        &[Value::Text(key.to_string())],
    )
    .map_err(|e| internal(format!("{e:?}")))?;
    tx.commit().map_err(|e| internal(format!("{e:?}")))?;
    Ok(())
}
