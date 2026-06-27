use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use trailbase::{AppState, User};
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
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (code, msg) = match self {
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
    let user_id = user.id.clone();
    let subscription_id = body.subscription_id.clone();
    let period = body.period.clone();
    let new_id = uuid::Uuid::new_v4().to_string();
    let event_id = uuid::Uuid::new_v4().to_string();

    let (new_id_tx, subscription_id_tx, period_tx, user_id_tx) = (
        new_id.clone(),
        subscription_id.clone(),
        period.clone(),
        user_id.clone(),
    );

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            let active = tx
                .query_row(
                    "SELECT 1 FROM subscriptions WHERE id = ? AND status = 'active'",
                    trailbase_sqlite::params![subscription_id_tx.clone()],
                )?
                .is_some();
            if !active {
                return Err(trailbase_sqlite::Error::Other(
                    format!("subscription '{}' not found or archived", subscription_id_tx).into(),
                ));
            }

            let tier_ok = tx
                .query_row(
                    "SELECT 1 FROM subscription_pricing WHERE subscription_id = ? AND period = ? AND is_archived = 0",
                    trailbase_sqlite::params![subscription_id_tx.clone(), period_tx.clone()],
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
                    trailbase_sqlite::params![user_id_tx.clone(), subscription_id_tx.clone()],
                )?
                .is_some();
            if already {
                return Err(trailbase_sqlite::Error::Other("already subscribed".into()));
            }

            tx.execute(
                "INSERT INTO user_subscriptions (id, user_id, subscription_id, period, status) VALUES (?, ?, ?, ?, 'active')",
                trailbase_sqlite::params![new_id_tx.clone(), user_id_tx.clone(), subscription_id_tx.clone(), period_tx.clone()],
            )?;

            tx.execute(
                "INSERT INTO subscription_events (id, user_subscription_id, event_type) VALUES (?, ?, 'subscribed')",
                trailbase_sqlite::params![event_id.clone(), new_id_tx.clone()],
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
        "user {:?} subscribed to {:?} period={:?} ({})",
        user_id,
        subscription_id,
        period,
        new_id
    );

    Ok(Json(UserSubscriptionRecord {
        id: new_id,
        user_id,
        subscription_id,
        period,
        status: "active".to_string(),
    }))
}

pub async fn cancel_handler(
    State(state): State<AppState>,
    user: User,
    Path(id): Path<String>,
) -> Result<Json<UserSubscriptionRecord>, ApiError> {
    let user_id = user.id.clone();
    let event_id = uuid::Uuid::new_v4().to_string();

    let (id_tx, user_id_tx) = (id.clone(), user_id.clone());

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            let owned_active = tx
                .query_row(
                    "SELECT 1 FROM user_subscriptions WHERE id = ? AND user_id = ? AND status = 'active'",
                    trailbase_sqlite::params![id_tx.clone(), user_id_tx.clone()],
                )?
                .is_some();
            if !owned_active {
                return Err(trailbase_sqlite::Error::Other(
                    "subscription not found or not active".into(),
                ));
            }

            tx.execute(
                "UPDATE user_subscriptions SET status = 'cancelled', cancelled_at = unixepoch() WHERE id = ?",
                trailbase_sqlite::params![id_tx.clone()],
            )?;

            tx.execute(
                "INSERT INTO subscription_events (id, user_subscription_id, event_type) VALUES (?, ?, 'cancelled')",
                trailbase_sqlite::params![event_id.clone(), id_tx.clone()],
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

    log::info!("user {:?} cancelled user_subscription {:?}", user_id, id);

    Ok(Json(UserSubscriptionRecord {
        id,
        user_id,
        subscription_id: String::new(),
        period: String::new(),
        status: "cancelled".to_string(),
    }))
}
