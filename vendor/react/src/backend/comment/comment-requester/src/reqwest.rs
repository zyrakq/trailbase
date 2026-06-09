use actix_web::http::StatusCode;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::anyhow;
use uuid::Uuid;

use crate::model::CommentError;


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub(crate) struct Post {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub teaser: String,
    pub preview: String,
    pub access: bool,
    pub published_at: DateTime<Utc>
}


pub(crate) async fn get_post(api_url: &str, token: &Option<String>, uuid: &Uuid) -> anyhow::Result<Post> {
    let client = reqwest::Client::default();

    let endpoint_type = match token {
        Some(_) => "private",
        None => "public"
    };

    let url = format!("{0}/{1}/posts/{2}", api_url, endpoint_type, uuid.to_string());

    let mut request = client
    .get(url)
    .header("User-Agent", "reqwest/3.11.16");

    if let Some(t) = token {
        request = request.bearer_auth(t);
    }


    let response = request.send().await?;
        
    match response.status() {
        StatusCode::BAD_REQUEST => Err(anyhow!("The post receiving endpoint is not responding!")),
        StatusCode::NOT_FOUND => Err(CommentError::PostNotFound(uuid.to_owned()).into()),
        StatusCode::OK => {
            let post = response.json::<Post>().await?;
            Ok(post)
        },
        _ => return Err(anyhow!("Get post by id endpoint throws an unhandled error!"))
    }
}