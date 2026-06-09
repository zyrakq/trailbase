use actix_web::http::StatusCode;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::anyhow;
use uuid::Uuid;


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub(crate) struct Comment {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub post_uuid: Uuid,
    pub reply_uuid: Option<Uuid>,
    pub parent_uuid: Option<Uuid>,
    pub created_at: DateTime<Utc>
}


pub(crate) async fn get_comment(api_url: &str, token: &str, uuid: &Uuid) -> anyhow::Result<Option<Comment>> {
    let client = reqwest::Client::default();

    let url = format!("{0}/private/comments/{1}", api_url, uuid.to_string());

    let response = client
        .get(url)
        .header("User-Agent", "reqwest/3.11.16")
        .bearer_auth(token)
        .send()
        .await;

    let response = response?;
        
    match response.status() {
        StatusCode::BAD_REQUEST => return Err(anyhow!("The comment receiving endpoint is not responding!")),
        StatusCode::NOT_FOUND => return Ok(None),
        StatusCode::OK => return Ok(response.json::<Comment>().await?.into()),
        _ => return Err(anyhow!("Get comment by id endpoint throws an unhandled error!"))
    }
}