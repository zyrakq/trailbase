
use sqlx::{postgres::PgPool};
use uuid::Uuid;

use crate::model::User;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GetUserList {
    pub ids: Vec<Uuid>,
    pub realm: String
}


pub async fn get_user_list(pool: &PgPool, request: &GetUserList) -> Result<Vec<User>, sqlx::Error> {
    let query = format!(
        "SELECT CAST(u.id AS UUID) AS uuid, u.username, (SELECT a.value FROM public.user_attribute a WHERE u.id = a.user_id AND a.name = 'picture') as picture
        FROM public.user_entity u
        WHERE realm_id = (SELECT r.id FROM public.realm r WHERE r.name = $1) 
        AND id IN ({})",
        request.ids.iter()
            .map(|id| format!("'{}'", id))
            .collect::<Vec<String>>()
            .join(", ")
    );
    let result = sqlx::query_as::<_, User>(query.as_str())
        .bind(request.realm.clone())
        .fetch_all(pool)
        .await?;
    Ok(result)
}