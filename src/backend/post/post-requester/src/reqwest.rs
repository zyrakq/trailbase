use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct SubInfo {
    pub created_at: DateTime<Utc>,
    pub started_at: DateTime<Utc>,
    pub stopped_at: DateTime<Utc>,
    pub amount: Decimal,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PaidPostInfo {
    pub uuid: Uuid,
    pub created_at: DateTime<Utc>,
    pub amount: Decimal,
}


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PermissionInfo {
    pub subs: Vec<SubInfo>,
    pub paid_posts: Vec<PaidPostInfo>
}

impl Default for PermissionInfo {
    fn default() -> Self {
        Self {
            subs: vec![],
            paid_posts: vec![]
        }
    }
}



pub fn get_permission_info(sub: Uuid) -> PermissionInfo {
    PermissionInfo::default()
}