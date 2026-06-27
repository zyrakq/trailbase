use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use trailbase::{AppState, User};
use trailbase::util::b64_to_uuid;
use trailbase_sqlite::traits::{SyncConnection, SyncTransaction};

#[derive(Debug, Deserialize)]
pub struct SubscribeRequest {
    pub subscription_id: String,
    pub period: String,
}

#[derive(Debug, Serialize)]
pub struct UserSubscriptionRecord {
    pub id: String,
    pub user_id: String,
    pub subscription_id: String,
    pub period: String,
    pub status: String,
}

pub enum ApiError {
    BadRequest(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (code, msg) = match self {
            ApiError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            ApiError::NotFound(m) => (StatusCode::NOT_FOUND, m),
            ApiError::Conflict(m) => (StatusCode::CONFLICT, m),
            ApiError::Internal(m) => (StatusCode::INTERNAL_SERVER_ERROR, m),
        };
        (code, msg).into_response()
    }
}

pub async fn subscribe_handler(
    State(state): State<AppState>,
    user: User,
    Json(body): Json<SubscribeRequest>,
) -> Result<Json<UserSubscriptionRecord>, ApiError> {
    let sub_uuid = b64_to_uuid(&body.subscription_id)
        .map_err(|_| ApiError::BadRequest("invalid subscription_id".into()))?;

    let user_id_b64 = user.id.clone();
    let subscription_id_b64 = body.subscription_id.clone();
    let period = body.period.clone();

    let user_bytes = user.uuid.as_bytes().to_vec();
    let sub_bytes = sub_uuid.as_bytes().to_vec();
    let new_id = uuid::Uuid::new_v4();
    let event_id = uuid::Uuid::new_v4();
    let new_id_bytes = new_id.as_bytes().to_vec();
    let event_id_bytes = event_id.as_bytes().to_vec();
    let new_id_b64 = trailbase::util::uuid_to_b64(&new_id);

    let period_tx = period.clone();

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            let active = tx
                .query_row(
                    "SELECT 1 FROM subscriptions WHERE id = ? AND status = 'active'",
                    trailbase_sqlite::params![sub_bytes.clone()],
                )?
                .is_some();
            if !active {
                return Err(trailbase_sqlite::Error::Other("subscription not found or archived".into()));
            }

            let tier_ok = tx
                .query_row(
                    "SELECT 1 FROM subscription_pricing WHERE subscription_id = ? AND period = ? AND is_archived = 0",
                    trailbase_sqlite::params![sub_bytes.clone(), period_tx.clone()],
                )?
                .is_some();
            if !tier_ok {
                return Err(trailbase_sqlite::Error::Other(
                    format!("pricing tier '{}' not available", period_tx).into(),
                ));
            }

            let already = tx
                .query_row(
                    "SELECT 1 FROM user_subscriptions WHERE user_id = ? AND subscription_id = ? AND status = 'active'",
                    trailbase_sqlite::params![user_bytes.clone(), sub_bytes.clone()],
                )?
                .is_some();
            if already {
                return Err(trailbase_sqlite::Error::Other("already subscribed".into()));
            }

            tx.execute(
                "INSERT INTO user_subscriptions (id, user_id, subscription_id, period, status) VALUES (?, ?, ?, ?, 'active')",
                trailbase_sqlite::params![new_id_bytes.clone(), user_bytes.clone(), sub_bytes.clone(), period_tx.clone()],
            )?;

            tx.execute(
                "INSERT INTO subscription_events (id, user_subscription_id, event_type) VALUES (?, ?, 'subscribed')",
                trailbase_sqlite::params![event_id_bytes.clone(), new_id_bytes.clone()],
            )?;

            tx.commit()?;
            Ok(())
        })
        .await
        .map_err(|err| {
            let msg = err.to_string();
            if msg.contains("already subscribed") {
                ApiError::Conflict(msg)
            } else if msg.contains("not found") || msg.contains("not available") {
                ApiError::NotFound(msg)
            } else {
                ApiError::Internal(msg)
            }
        })?;

    log::info!(
        "user {} subscribed to {} period={} ({})",
        user_id_b64, subscription_id_b64, period, new_id_b64
    );

    Ok(Json(UserSubscriptionRecord {
        id: new_id_b64,
        user_id: user_id_b64,
        subscription_id: subscription_id_b64,
        period,
        status: "active".to_string(),
    }))
}

pub async fn cancel_handler(
    State(state): State<AppState>,
    user: User,
    Path(id): Path<String>,
) -> Result<Json<UserSubscriptionRecord>, ApiError> {
    let user_sub_uuid = b64_to_uuid(&id)
        .map_err(|_| ApiError::BadRequest("invalid id".into()))?;

    let user_id_b64 = user.id.clone();
    let user_bytes = user.uuid.as_bytes().to_vec();
    let user_sub_bytes = user_sub_uuid.as_bytes().to_vec();
    let event_id = uuid::Uuid::new_v4();
    let event_id_bytes = event_id.as_bytes().to_vec();

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            let owned_active = tx
                .query_row(
                    "SELECT 1 FROM user_subscriptions WHERE id = ? AND user_id = ? AND status = 'active'",
                    trailbase_sqlite::params![user_sub_bytes.clone(), user_bytes.clone()],
                )?
                .is_some();
            if !owned_active {
                return Err(trailbase_sqlite::Error::Other(
                    "subscription not found or not active".into(),
                ));
            }

            tx.execute(
                "UPDATE user_subscriptions SET status = 'cancelled', cancelled_at = unixepoch() WHERE id = ?",
                trailbase_sqlite::params![user_sub_bytes.clone()],
            )?;

            tx.execute(
                "INSERT INTO subscription_events (id, user_subscription_id, event_type) VALUES (?, ?, 'cancelled')",
                trailbase_sqlite::params![event_id_bytes.clone(), user_sub_bytes.clone()],
            )?;

            tx.commit()?;
            Ok(())
        })
        .await
        .map_err(|err| {
            let msg = err.to_string();
            if msg.contains("not found") {
                ApiError::NotFound(msg)
            } else {
                ApiError::Internal(msg)
            }
        })?;

    log::info!("user {} cancelled user_subscription {}", user_id_b64, id);

    Ok(Json(UserSubscriptionRecord {
        id,
        user_id: user_id_b64,
        subscription_id: String::new(),
        period: String::new(),
        status: "cancelled".to_string(),
    }))
}
