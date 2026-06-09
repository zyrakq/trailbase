
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum OptionUuid {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    Some(Uuid),
    None,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Post {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub teaser: String,
    pub preview: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
    pub updated_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub updated_by: Uuid,
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_by: OptionUuid,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostView {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub teaser: String,
    pub preview: String,
    pub access: bool,
    pub published_at: DateTime<Utc>
}

impl From<Post> for PostView {
    fn from(post: Post) -> Self {
        Self {
            uuid: post.uuid,
            text: post.text,
            files: post.files,
            teaser: post.teaser,
            preview: post.preview,
            access: true,
            published_at: post.created_at
        }
    }
}


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostResult {
    pub total: u64,
    pub offset: u64,
    pub count: i64,
    pub items: Vec<PostView>,
}