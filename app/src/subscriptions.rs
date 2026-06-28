use axum::{
    extract::{Path, Query, State},
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<i64>,
}

pub enum ApiError {
    BadRequest(String),
    NotFound(String),
    Conflict(String),
    Forbidden(String),
    Internal(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (code, msg) = match self {
            ApiError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            ApiError::NotFound(m) => (StatusCode::NOT_FOUND, m),
            ApiError::Conflict(m) => (StatusCode::CONFLICT, m),
            ApiError::Forbidden(m) => (StatusCode::FORBIDDEN, m),
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
    let now_secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let expires_at: Option<i64> = match period.as_str() {
        "monthly" => Some(now_secs + 2_592_000),
        "quarterly" => Some(now_secs + 7_776_000),
        "yearly" => Some(now_secs + 31_536_000),
        _ => None,
    };

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
                "INSERT INTO user_subscriptions (id, user_id, subscription_id, period, status, expires_at) VALUES (?, ?, ?, ?, 'active', ?)",
                trailbase_sqlite::params![new_id_bytes.clone(), user_bytes.clone(), sub_bytes.clone(), period_tx.clone(), expires_at],
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
        expires_at,
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
        expires_at: None,
    }))
}

#[derive(Debug, Serialize)]
pub struct PricingDto {
    pub id: String,
    pub subscription_id: String,
    pub period: String,
    pub price: i64,
    pub currency: String,
    pub is_archived: bool,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionDto {
    pub id: String,
    pub name: String,
    pub description: String,
    pub logo_url: String,
    pub resource_url: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub what_included: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub terms: Option<String>,
    pub pricing: Vec<PricingDto>,
}

#[derive(Debug, Serialize)]
pub struct CatalogResponse {
    pub subscriptions: Vec<SubscriptionDto>,
    #[serde(rename = "available_periods")]
    pub available_periods: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionIdResponse {
    pub id: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct PricingInput {
    pub period: String,
    pub price: i64,
    pub currency: String,
}

#[derive(Debug, Deserialize)]
pub struct SubscriptionInput {
    pub name: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub resource_url: Option<String>,
    pub what_included: Option<String>,
    pub terms: Option<String>,
    pub pricing: Vec<PricingInput>,
}

const USER_TABLE: &str = "_user";

fn period_rank(p: &str) -> u8 {
    match p {
        "monthly" => 0,
        "quarterly" => 1,
        "yearly" => 2,
        "onetime" => 3,
        _ => 4,
    }
}

fn sort_periods(mut periods: Vec<String>) -> Vec<String> {
    periods.sort_by(|a, b| {
        period_rank(a)
            .cmp(&period_rank(b))
            .then_with(|| a.cmp(b))
    });
    periods.dedup();
    periods
}

fn blob_to_b64(bytes: &[u8]) -> Result<String, ApiError> {
    let uuid = uuid::Uuid::from_slice(bytes)
        .map_err(|_| ApiError::Internal("invalid id blob".into()))?;
    Ok(trailbase::util::uuid_to_b64(&uuid))
}

// Mirrors trailbase's own is_admin (vendor/.../auth/util.rs:381) — User has no
// is_admin() method and auth::util::is_admin is pub(crate).
async fn require_admin(state: &AppState, user: &User) -> Result<(), ApiError> {
    let sql = format!(r#"SELECT admin FROM "{}" WHERE id = $1"#, USER_TABLE);
    let admin: Option<i64> = state
        .user_conn()
        .read_query_row_get(
            sql,
            trailbase_sqlite::params![user.uuid.as_bytes().to_vec()],
            0,
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;
    if admin.map(|v| v > 0).unwrap_or(false) {
        Ok(())
    } else {
        Err(ApiError::Forbidden("admin privileges required".into()))
    }
}

#[allow(dead_code)]
const PERIOD_ORDER: [&str; 4] = ["monthly", "quarterly", "yearly", "onetime"];

pub async fn catalog_handler(
    State(state): State<AppState>,
    user: User,
) -> Result<Json<CatalogResponse>, ApiError> {
    let conn = state.user_conn();

    let sub_rows = conn
        .read_query_rows(
            r#"SELECT id, name, description, logo_url, resource_url,
                      what_included, terms, status, created_at, updated_at
               FROM subscriptions
               WHERE status = 'active'
               ORDER BY created_at"#,
            (),
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let active_ids: Vec<Vec<u8>> = sub_rows
        .iter()
        .filter_map(|r| r.get::<Vec<u8>>(0).ok())
        .collect();

    if active_ids.is_empty() {
        return Ok(Json(CatalogResponse {
            subscriptions: vec![],
            available_periods: vec![],
        }));
    }

    let pricing_rows = conn
        .read_query_rows(
            r#"SELECT id, subscription_id, period, price, currency, is_archived
               FROM subscription_pricing
               WHERE is_archived = 0"#,
            (),
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let active_id_set: std::collections::HashSet<Vec<u8>> = active_ids.into_iter().collect();

    let mut periods: Vec<String> = Vec::new();
    let mut pricing_by_sub: std::collections::HashMap<Vec<u8>, Vec<PricingDto>> =
        std::collections::HashMap::new();

    for r in pricing_rows.iter() {
        let sub_id: Vec<u8> = match r.get::<Vec<u8>>(1) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if !active_id_set.contains(&sub_id) {
            continue;
        }
        let period: String = r.get::<String>(2).unwrap_or_default();
        if !periods.contains(&period) {
            periods.push(period.clone());
        }
        let dto = PricingDto {
            id: blob_to_b64(&r.get::<Vec<u8>>(0).unwrap_or_default())?,
            subscription_id: blob_to_b64(&sub_id)?,
            period,
            price: r.get::<i64>(3).unwrap_or(0),
            currency: r.get::<String>(4).unwrap_or_else(|_| "USD".into()),
            is_archived: r.get::<i64>(5).unwrap_or(0) != 0,
        };
        pricing_by_sub.entry(sub_id).or_default().push(dto);
    }

    let mut subs: Vec<SubscriptionDto> = Vec::with_capacity(sub_rows.len());
    for r in sub_rows.iter() {
        let id_bytes: Vec<u8> = r.get::<Vec<u8>>(0).unwrap_or_default();
        let period_list = pricing_by_sub.remove(&id_bytes).unwrap_or_default();
        subs.push(SubscriptionDto {
            id: blob_to_b64(&id_bytes)?,
            name: r.get::<String>(1).unwrap_or_default(),
            description: r.get::<String>(2).unwrap_or_default(),
            logo_url: r.get::<String>(3).unwrap_or_default(),
            resource_url: r.get::<String>(4).unwrap_or_default(),
            what_included: r.get::<Option<String>>(5).ok().flatten(),
            terms: r.get::<Option<String>>(6).ok().flatten(),
            status: r.get::<String>(7).unwrap_or_else(|_| "active".into()),
            created_at: r.get::<i64>(8).unwrap_or(0),
            updated_at: r.get::<i64>(9).unwrap_or(0),
            pricing: period_list,
        });
    }

    log::info!(
        "catalog served to user {} ({} subs, {} periods)",
        user.id,
        subs.len(),
        periods.len()
    );

    Ok(Json(CatalogResponse {
        subscriptions: subs,
        available_periods: sort_periods(periods),
    }))
}

pub async fn mine_handler(
    State(state): State<AppState>,
    user: User,
) -> Result<Json<CatalogResponse>, ApiError> {
    let conn = state.user_conn();
    let user_bytes = user.uuid.as_bytes().to_vec();

    let user_sub_rows = conn
        .read_query_rows(
            r#"SELECT DISTINCT subscription_id, period
               FROM user_subscriptions
               WHERE user_id = $1
                 AND status = 'active'
                 AND (expires_at IS NULL OR expires_at > unixepoch())"#,
            trailbase_sqlite::params![user_bytes.clone()],
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut periods: Vec<String> = Vec::new();
    let mut sub_id_set: std::collections::HashSet<Vec<u8>> = std::collections::HashSet::new();
    for r in user_sub_rows.iter() {
        if let Ok(sub_id) = r.get::<Vec<u8>>(0) {
            sub_id_set.insert(sub_id);
        }
        let period: String = r.get::<String>(1).unwrap_or_default();
        if !period.is_empty() && !periods.contains(&period) {
            periods.push(period);
        }
    }

    if sub_id_set.is_empty() {
        return Ok(Json(CatalogResponse {
            subscriptions: vec![],
            available_periods: vec![],
        }));
    }

    let sub_rows = conn
        .read_query_rows(
            r#"SELECT id, name, description, logo_url, resource_url,
                      what_included, terms, status, created_at, updated_at
               FROM subscriptions
               WHERE status = 'active'"#,
            (),
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let pricing_rows = conn
        .read_query_rows(
            r#"SELECT id, subscription_id, period, price, currency, is_archived
               FROM subscription_pricing
               WHERE is_archived = 0"#,
            (),
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut pricing_by_sub: std::collections::HashMap<Vec<u8>, Vec<PricingDto>> =
        std::collections::HashMap::new();
    for r in pricing_rows.iter() {
        let sub_id: Vec<u8> = match r.get::<Vec<u8>>(1) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if !sub_id_set.contains(&sub_id) {
            continue;
        }
        let dto = PricingDto {
            id: blob_to_b64(&r.get::<Vec<u8>>(0).unwrap_or_default())?,
            subscription_id: blob_to_b64(&sub_id)?,
            period: r.get::<String>(2).unwrap_or_default(),
            price: r.get::<i64>(3).unwrap_or(0),
            currency: r.get::<String>(4).unwrap_or_else(|_| "USD".into()),
            is_archived: r.get::<i64>(5).unwrap_or(0) != 0,
        };
        pricing_by_sub.entry(sub_id).or_default().push(dto);
    }

    let mut subs: Vec<SubscriptionDto> = Vec::new();
    for r in sub_rows.iter() {
        let id_bytes: Vec<u8> = r.get::<Vec<u8>>(0).unwrap_or_default();
        if !sub_id_set.contains(&id_bytes) {
            continue;
        }
        let pricing = pricing_by_sub.remove(&id_bytes).unwrap_or_default();
        subs.push(SubscriptionDto {
            id: blob_to_b64(&id_bytes)?,
            name: r.get::<String>(1).unwrap_or_default(),
            description: r.get::<String>(2).unwrap_or_default(),
            logo_url: r.get::<String>(3).unwrap_or_default(),
            resource_url: r.get::<String>(4).unwrap_or_default(),
            what_included: r.get::<Option<String>>(5).ok().flatten(),
            terms: r.get::<Option<String>>(6).ok().flatten(),
            status: r.get::<String>(7).unwrap_or_else(|_| "active".into()),
            created_at: r.get::<i64>(8).unwrap_or(0),
            updated_at: r.get::<i64>(9).unwrap_or(0),
            pricing,
        });
    }

    log::info!(
        "mine served to user {} ({} subs, {} periods)",
        user.id,
        subs.len(),
        periods.len()
    );

    Ok(Json(CatalogResponse {
        subscriptions: subs,
        available_periods: sort_periods(periods),
    }))
}

pub async fn create_subscription_handler(
    State(state): State<AppState>,
    user: User,
    Json(body): Json<SubscriptionInput>,
) -> Result<(StatusCode, Json<SubscriptionIdResponse>), ApiError> {
    require_admin(&state, &user).await?;

    let sub_id = uuid::Uuid::new_v4();
    let sub_bytes = sub_id.as_bytes().to_vec();
    let pricing_inputs = body.pricing.clone();

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            tx.execute(
                r#"INSERT INTO subscriptions
                   (id, name, description, logo_url, resource_url,
                    what_included, terms, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'active')"#,
                trailbase_sqlite::params![
                    sub_bytes.clone(),
                    body.name.clone(),
                    body.description.clone().unwrap_or_default(),
                    body.logo_url.clone().unwrap_or_default(),
                    body.resource_url.clone().unwrap_or_default(),
                    body.what_included.clone().unwrap_or_default(),
                    body.terms.clone().unwrap_or_default(),
                ],
            )?;

            for tier in &pricing_inputs {
                let tier_id = uuid::Uuid::new_v4();
                tx.execute(
                    r#"INSERT INTO subscription_pricing
                       (id, subscription_id, period, price, currency, is_archived)
                       VALUES (?, ?, ?, ?, ?, 0)"#,
                    trailbase_sqlite::params![
                        tier_id.as_bytes().to_vec(),
                        sub_bytes.clone(),
                        tier.period.clone(),
                        tier.price,
                        tier.currency.clone(),
                    ],
                )?;
            }

            tx.commit()?;
            Ok(())
        })
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    log::info!("admin {} created subscription {}", user.id, sub_id);
    Ok((
        StatusCode::CREATED,
        Json(SubscriptionIdResponse {
            id: trailbase::util::uuid_to_b64(&sub_id),
        }),
    ))
}

pub async fn update_subscription_handler(
    State(state): State<AppState>,
    user: User,
    Path(id): Path<String>,
    Json(body): Json<SubscriptionInput>,
) -> Result<StatusCode, ApiError> {
    require_admin(&state, &user).await?;

    let sub_uuid = trailbase::util::b64_to_uuid(&id)
        .map_err(|_| ApiError::BadRequest("invalid id".into()))?;
    let sub_bytes = sub_uuid.as_bytes().to_vec();
    let pricing_inputs = body.pricing.clone();

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            let exists = tx
                .query_row(
                    "SELECT 1 FROM subscriptions WHERE id = ?",
                    trailbase_sqlite::params![sub_bytes.clone()],
                )?
                .is_some();
            if !exists {
                return Err(trailbase_sqlite::Error::Other("subscription not found".into()));
            }

            tx.execute(
                r#"UPDATE subscriptions SET
                     name = ?, description = ?, logo_url = ?, resource_url = ?,
                     what_included = ?, terms = ?, updated_at = unixepoch()
                   WHERE id = ?"#,
                trailbase_sqlite::params![
                    body.name.clone(),
                    body.description.clone().unwrap_or_default(),
                    body.logo_url.clone().unwrap_or_default(),
                    body.resource_url.clone().unwrap_or_default(),
                    body.what_included.clone().unwrap_or_default(),
                    body.terms.clone().unwrap_or_default(),
                    sub_bytes.clone(),
                ],
            )?;

            tx.execute(
                "UPDATE subscription_pricing SET is_archived = 1 WHERE subscription_id = ? AND is_archived = 0",
                trailbase_sqlite::params![sub_bytes.clone()],
            )?;

            for tier in &pricing_inputs {
                let tier_id = uuid::Uuid::new_v4();
                tx.execute(
                    r#"INSERT INTO subscription_pricing
                       (id, subscription_id, period, price, currency, is_archived)
                       VALUES (?, ?, ?, ?, ?, 0)"#,
                    trailbase_sqlite::params![
                        tier_id.as_bytes().to_vec(),
                        sub_bytes.clone(),
                        tier.period.clone(),
                        tier.price,
                        tier.currency.clone(),
                    ],
                )?;
            }

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

    log::info!("admin {} updated subscription {}", user.id, id);
    Ok(StatusCode::NO_CONTENT)
}

pub async fn archive_subscription_handler(
    State(state): State<AppState>,
    user: User,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    require_admin(&state, &user).await?;
    set_subscription_status(&state, &id, "archived").await?;
    log::info!("admin {} archived subscription {}", user.id, id);
    Ok(StatusCode::NO_CONTENT)
}

pub async fn restore_subscription_handler(
    State(state): State<AppState>,
    user: User,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    require_admin(&state, &user).await?;
    set_subscription_status(&state, &id, "active").await?;
    log::info!("admin {} restored subscription {}", user.id, id);
    Ok(StatusCode::NO_CONTENT)
}

async fn set_subscription_status(
    state: &AppState,
    id_b64: &str,
    status: &str,
) -> Result<(), ApiError> {
    let sub_uuid = trailbase::util::b64_to_uuid(id_b64)
        .map_err(|_| ApiError::BadRequest("invalid id".into()))?;
    let sub_bytes = sub_uuid.as_bytes().to_vec();
    let status = status.to_string();

    let affected = state
        .user_conn()
        .execute(
            "UPDATE subscriptions SET status = ?, updated_at = unixepoch() WHERE id = ?",
            trailbase_sqlite::params![status, sub_bytes],
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    if affected == 0 {
        return Err(ApiError::NotFound("subscription not found".into()));
    }
    Ok(())
}

pub async fn delete_subscription_handler(
    State(state): State<AppState>,
    user: User,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    require_admin(&state, &user).await?;

    let sub_uuid = trailbase::util::b64_to_uuid(&id)
        .map_err(|_| ApiError::BadRequest("invalid id".into()))?;
    let sub_bytes = sub_uuid.as_bytes().to_vec();

    state
        .user_conn()
        .transaction(move |mut tx| -> Result<(), trailbase_sqlite::Error> {
            let has_active = tx
                .query_row(
                    "SELECT 1 FROM user_subscriptions WHERE subscription_id = ? AND status = 'active'",
                    trailbase_sqlite::params![sub_bytes.clone()],
                )?
                .is_some();
            if has_active {
                return Err(trailbase_sqlite::Error::Other(
                    "subscription has active subscribers".into(),
                ));
            }

            let affected = tx.execute(
                "DELETE FROM subscriptions WHERE id = ?",
                trailbase_sqlite::params![sub_bytes.clone()],
            )?;
            if affected == 0 {
                return Err(trailbase_sqlite::Error::Other("subscription not found".into()));
            }

            tx.commit()?;
            Ok(())
        })
        .await
        .map_err(|err| {
            let msg = err.to_string();
            if msg.contains("active subscribers") {
                ApiError::Conflict(msg)
            } else if msg.contains("not found") {
                ApiError::NotFound(msg)
            } else {
                ApiError::Internal(msg)
            }
        })?;

    log::info!("admin {} deleted subscription {}", user.id, id);
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Serialize)]
pub struct UserSubscriptionDto {
    pub id: String,
    pub user_id: String,
    pub subscription_id: String,
    pub period: String,
    pub status: String,
    pub subscribed_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct EventWithSubDto {
    pub id: String,
    pub user_subscription_id: String,
    pub event_type: String,
    pub created_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<String>,
    pub subscription_name: String,
}

#[derive(Debug, Serialize)]
pub struct CountResponse {
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct CountQuery {
    pub period: Option<String>,
}

pub async fn admin_list_handler(
    State(state): State<AppState>,
    user: User,
) -> Result<Json<Vec<SubscriptionDto>>, ApiError> {
    require_admin(&state, &user).await?;
    let conn = state.user_conn();

    let sub_rows = conn
        .read_query_rows(
            r#"SELECT id, name, description, logo_url, resource_url,
                      what_included, terms, status, created_at, updated_at
               FROM subscriptions ORDER BY created_at"#,
            (),
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let pricing_rows = conn
        .read_query_rows(
            r#"SELECT id, subscription_id, period, price, currency, is_archived
               FROM subscription_pricing"#,
            (),
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut pricing_by_sub: std::collections::HashMap<Vec<u8>, Vec<PricingDto>> =
        std::collections::HashMap::new();
    for r in pricing_rows.iter() {
        let sub_id: Vec<u8> = match r.get::<Vec<u8>>(1) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let dto = PricingDto {
            id: blob_to_b64(&r.get::<Vec<u8>>(0).unwrap_or_default())?,
            subscription_id: blob_to_b64(&sub_id)?,
            period: r.get::<String>(2).unwrap_or_default(),
            price: r.get::<i64>(3).unwrap_or(0),
            currency: r.get::<String>(4).unwrap_or_else(|_| "USD".into()),
            is_archived: r.get::<i64>(5).unwrap_or(0) != 0,
        };
        pricing_by_sub.entry(sub_id).or_default().push(dto);
    }

    let mut subs: Vec<SubscriptionDto> = Vec::with_capacity(sub_rows.len());
    for r in sub_rows.iter() {
        let id_bytes: Vec<u8> = r.get::<Vec<u8>>(0).unwrap_or_default();
        let pricing = pricing_by_sub.remove(&id_bytes).unwrap_or_default();
        subs.push(SubscriptionDto {
            id: blob_to_b64(&id_bytes)?,
            name: r.get::<String>(1).unwrap_or_default(),
            description: r.get::<String>(2).unwrap_or_default(),
            logo_url: r.get::<String>(3).unwrap_or_default(),
            resource_url: r.get::<String>(4).unwrap_or_default(),
            what_included: r.get::<Option<String>>(5).ok().flatten(),
            terms: r.get::<Option<String>>(6).ok().flatten(),
            status: r.get::<String>(7).unwrap_or_else(|_| "active".into()),
            created_at: r.get::<i64>(8).unwrap_or(0),
            updated_at: r.get::<i64>(9).unwrap_or(0),
            pricing,
        });
    }

    log::info!("admin {} listed {} subscriptions", user.id, subs.len());
    Ok(Json(subs))
}

pub async fn get_by_id_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<SubscriptionDto>, ApiError> {
    let sub_uuid = trailbase::util::b64_to_uuid(&id)
        .map_err(|_| ApiError::BadRequest("invalid id".into()))?;
    let sub_bytes = sub_uuid.as_bytes().to_vec();
    let conn = state.user_conn();

    let sub_rows = conn
        .read_query_rows(
            r#"SELECT id, name, description, logo_url, resource_url,
                      what_included, terms, status, created_at, updated_at
               FROM subscriptions WHERE id = $1"#,
            trailbase_sqlite::params![sub_bytes.clone()],
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    if sub_rows.is_empty() {
        return Err(ApiError::NotFound("subscription not found".into()));
    }

    let r = &sub_rows[0];
    let pricing_rows = conn
        .read_query_rows(
            r#"SELECT id, subscription_id, period, price, currency, is_archived
               FROM subscription_pricing WHERE subscription_id = $1"#,
            trailbase_sqlite::params![sub_bytes.clone()],
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut pricing: Vec<PricingDto> = Vec::with_capacity(pricing_rows.len());
    for p in pricing_rows.iter() {
        pricing.push(PricingDto {
            id: blob_to_b64(&p.get::<Vec<u8>>(0).unwrap_or_default())?,
            subscription_id: blob_to_b64(&p.get::<Vec<u8>>(1).unwrap_or_default())?,
            period: p.get::<String>(2).unwrap_or_default(),
            price: p.get::<i64>(3).unwrap_or(0),
            currency: p.get::<String>(4).unwrap_or_else(|_| "USD".into()),
            is_archived: p.get::<i64>(5).unwrap_or(0) != 0,
        });
    }

    Ok(Json(SubscriptionDto {
        id: blob_to_b64(&sub_bytes)?,
        name: r.get::<String>(1).unwrap_or_default(),
        description: r.get::<String>(2).unwrap_or_default(),
        logo_url: r.get::<String>(3).unwrap_or_default(),
        resource_url: r.get::<String>(4).unwrap_or_default(),
        what_included: r.get::<Option<String>>(5).ok().flatten(),
        terms: r.get::<Option<String>>(6).ok().flatten(),
        status: r.get::<String>(7).unwrap_or_else(|_| "active".into()),
        created_at: r.get::<i64>(8).unwrap_or(0),
        updated_at: r.get::<i64>(9).unwrap_or(0),
        pricing,
    }))
}

pub async fn user_subs_handler(
    State(state): State<AppState>,
    user: User,
) -> Result<Json<Vec<UserSubscriptionDto>>, ApiError> {
    let conn = state.user_conn();
    let user_bytes = user.uuid.as_bytes().to_vec();

    let rows = conn
        .read_query_rows(
            r#"SELECT id, user_id, subscription_id, period, status,
                      subscribed_at, expires_at, cancelled_at
               FROM user_subscriptions
               WHERE user_id = $1 AND status = 'active'
                 AND (expires_at IS NULL OR expires_at > unixepoch())"#,
            trailbase_sqlite::params![user_bytes],
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut result: Vec<UserSubscriptionDto> = Vec::with_capacity(rows.len());
    for r in rows.iter() {
        result.push(UserSubscriptionDto {
            id: blob_to_b64(&r.get::<Vec<u8>>(0).unwrap_or_default())?,
            user_id: blob_to_b64(&r.get::<Vec<u8>>(1).unwrap_or_default())?,
            subscription_id: blob_to_b64(&r.get::<Vec<u8>>(2).unwrap_or_default())?,
            period: r.get::<String>(3).unwrap_or_default(),
            status: r.get::<String>(4).unwrap_or_default(),
            subscribed_at: r.get::<i64>(5).unwrap_or(0),
            expires_at: r.get::<Option<i64>>(6).ok().flatten(),
            cancelled_at: r.get::<Option<i64>>(7).ok().flatten(),
        });
    }

    Ok(Json(result))
}

pub async fn event_history_handler(
    State(state): State<AppState>,
    user: User,
) -> Result<Json<Vec<EventWithSubDto>>, ApiError> {
    let conn = state.user_conn();
    let user_bytes = user.uuid.as_bytes().to_vec();

    let rows = conn
        .read_query_rows(
            r#"SELECT se.id, se.user_subscription_id, se.event_type,
                      se.created_at, se.metadata, s.name
               FROM subscription_events se
               JOIN user_subscriptions us ON us.id = se.user_subscription_id
               JOIN subscriptions s ON s.id = us.subscription_id
               WHERE us.user_id = $1
               ORDER BY se.created_at DESC"#,
            trailbase_sqlite::params![user_bytes],
        )
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut events: Vec<EventWithSubDto> = Vec::with_capacity(rows.len());
    for r in rows.iter() {
        events.push(EventWithSubDto {
            id: blob_to_b64(&r.get::<Vec<u8>>(0).unwrap_or_default())?,
            user_subscription_id: blob_to_b64(&r.get::<Vec<u8>>(1).unwrap_or_default())?,
            event_type: r.get::<String>(2).unwrap_or_default(),
            created_at: r.get::<i64>(3).unwrap_or(0),
            metadata: r.get::<Option<String>>(4).ok().flatten(),
            subscription_name: r.get::<String>(5).unwrap_or_else(|_| "Unknown".into()),
        });
    }

    Ok(Json(events))
}

pub async fn subscriber_count_handler(
    State(state): State<AppState>,
    _user: User,
    Path(id): Path<String>,
    Query(q): Query<CountQuery>,
) -> Result<Json<CountResponse>, ApiError> {
    let sub_uuid = trailbase::util::b64_to_uuid(&id)
        .map_err(|_| ApiError::BadRequest("invalid id".into()))?;
    let sub_bytes = sub_uuid.as_bytes().to_vec();
    let conn = state.user_conn();

    let count: i64 = match &q.period {
        Some(period) => {
            conn.read_query_row_get(
                r#"SELECT COUNT(*) FROM user_subscriptions
                   WHERE subscription_id = $1 AND status = 'active' AND period = $2"#,
                trailbase_sqlite::params![sub_bytes, period.clone()],
                0,
            )
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?
            .unwrap_or(0)
        }
        None => {
            conn.read_query_row_get(
                r#"SELECT COUNT(*) FROM user_subscriptions
                   WHERE subscription_id = $1 AND status = 'active'"#,
                trailbase_sqlite::params![sub_bytes],
                0,
            )
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?
            .unwrap_or(0)
        }
    };

    Ok(Json(CountResponse { count }))
}
