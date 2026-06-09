use actix_web::http::StatusCode;
use aliri_extra_reqwest::AuthClient;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use anyhow::anyhow;
use serde_json::json;
use uuid::Uuid;

use crate::model::{CommentError, User};


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
        StatusCode::BAD_REQUEST => return Err(anyhow!("The post receiving endpoint is not responding!")),
        StatusCode::NOT_FOUND => Err(CommentError::PostNotFound(uuid.to_owned()).into()),
        StatusCode::OK => {
            let post = response.json::<Post>().await?;
            Ok(post)
        },
        _ => return Err(anyhow!("Get post by id endpoint throws an unhandled error!"))
    }
}




pub struct GetUserList {
    pub ids: Vec<Uuid>
}


pub async fn get_user_list(client: &AuthClient, request: &GetUserList) -> anyhow::Result<Vec<User>> {

    // Преобразование вектора строк в формат JSON
    let json_strings = json!(request.ids);

    // Кодирование JSON-строки в URL-строку
    let encoded = form_urlencoded::Serializer::new(String::new())
        .append_pair("ids", &json_strings.to_string())
        .finish();
    //let encoded: String = json_strings.to_string().chars().filter(|c| !c.is_whitespace()).collect();

    let url = format!("{}/comments/users?{}", client.host_url, encoded);

    let request = client.client
    .get(url)
    .header("User-Agent", "reqwest/3.11.16");

    let response = request.send().await?;
        
    match response.status() {
        StatusCode::BAD_REQUEST => Err(anyhow!("The users receiving endpoint is not responding!")),
        StatusCode::OK => {
            let post = response.json::<Vec<User>>().await?;
            Ok(post)
        },
        _ => return Err(anyhow!("Get users by ids endpoint throws an unhandled error!"))
    }
}