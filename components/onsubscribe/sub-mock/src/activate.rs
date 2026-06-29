use trailbase_wasm::db::{Transaction, Value, query};
use trailbase_wasm::rand::get_random_bytes;
use trailbase_wasm::time::{Duration, sleep};

pub async fn run() {
    if let Err(e) = activate_all().await {
        log::error!("activate-subscriptions job failed: {e}");
    }
}

async fn activate_all() -> Result<(), String> {
    let rows = query(
        "SELECT us.id, us.activation_attempts, s.activator \
         FROM user_subscriptions us \
         JOIN subscriptions s ON s.id = us.subscription_id \
         WHERE us.status = 'activating' \
           AND (us.next_activation_at IS NULL OR us.next_activation_at <= unixepoch())",
        Vec::<Value>::new(),
    )
    .await
    .map_err(|e| format!("{e:?}"))?;

    for row in rows.iter() {
        let id = match row.get(0) {
            Some(Value::Blob(b)) => b.clone(),
            _ => continue,
        };
        let attempts = match row.get(1) {
            Some(Value::Integer(n)) => *n,
            _ => 0,
        };
        let activator = match row.get(2) {
            Some(Value::Text(s)) => s.clone(),
            _ => "sub-mock".to_string(),
        };

        if activator != "sub-mock" {
            continue;
        }

        if let Err(e) = activate_one(&id).await {
            log::warn!("activation failed for row: {e}");
            let new_attempts = attempts + 1;
            if new_attempts >= 5 {
                let _ = mark_failed(&id, new_attempts).await;
            } else {
                let delay = backoff_secs(new_attempts);
                let _ = schedule_retry(&id, new_attempts, delay).await;
            }
        }
    }

    return Ok(());
}

async fn activate_one(id: &[u8]) -> Result<(), String> {
    sleep(Duration::from_secs(10)).await;

    let mut tx = Transaction::begin().map_err(|e| format!("{e:?}"))?;

    tx.execute(
        "UPDATE user_subscriptions \
         SET status = 'active', activated_at = unixepoch() \
         WHERE id = ?",
        &[Value::Blob(id.to_vec())],
    )
    .map_err(|e| format!("{e:?}"))?;

    let event_id = make_uuid_v4();

    tx.execute(
        "INSERT INTO subscription_events (id, user_subscription_id, event_type) \
         VALUES (?, ?, 'activated')",
        &[Value::Blob(event_id), Value::Blob(id.to_vec())],
    )
    .map_err(|e| format!("{e:?}"))?;

    tx.commit().map_err(|e| format!("{e:?}"))?;
    return Ok(());
}

async fn schedule_retry(id: &[u8], attempts: i64, delay_secs: i64) -> Result<(), String> {
    let mut tx = Transaction::begin().map_err(|e| format!("{e:?}"))?;
    tx.execute(
        "UPDATE user_subscriptions \
         SET activation_attempts = ?, next_activation_at = unixepoch() + ? \
         WHERE id = ?",
        &[
            Value::Integer(attempts),
            Value::Integer(delay_secs),
            Value::Blob(id.to_vec()),
        ],
    )
    .map_err(|e| format!("{e:?}"))?;
    tx.commit().map_err(|e| format!("{e:?}"))?;
    return Ok(());
}

async fn mark_failed(id: &[u8], attempts: i64) -> Result<(), String> {
    let mut tx = Transaction::begin().map_err(|e| format!("{e:?}"))?;
    tx.execute(
        "UPDATE user_subscriptions \
         SET status = 'activation_failed', activation_attempts = ? \
         WHERE id = ?",
        &[Value::Integer(attempts), Value::Blob(id.to_vec())],
    )
    .map_err(|e| format!("{e:?}"))?;
    tx.commit().map_err(|e| format!("{e:?}"))?;
    return Ok(());
}

fn backoff_secs(attempt: i64) -> i64 {
    let base: i64 = 300;
    let factor = 3_i64.saturating_pow(attempt as u32);
    return base.saturating_mul(factor).min(7200);
}

fn make_uuid_v4() -> Vec<u8> {
    let mut b = vec![0u8; 16];
    get_random_bytes(&mut b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    return b;
}
