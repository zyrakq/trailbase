use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use thiserror::Error;


#[derive(Clone, Error, Debug)]
pub enum PostError {
    #[error("Post wasn't created with uuid {0}")]
    MissingPost(Uuid),
    #[error("Event type unknown, event number {0}")]
    EventTypeUnknown(String),
    #[error("Post with the same {0} was created twice")]
    PostCreatedTwice(Uuid)
}


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostEvent {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: Option<String>,
    pub files: Option<Vec<String>>,
    pub add_files: Option<Vec<String>>,
    pub remove_files: Option<Vec<String>>,
    pub teaser: Option<String>,
    pub preview: Option<String>,
    pub access: Option<String>,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}


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
    pub access: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
    pub updated_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub updated_by: Uuid,
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_by: OptionUuid,
}

impl Post {
    pub fn new(uuid: Uuid, text: String, files: Vec<String>, teaser: String, preview: String, access: String, created_at: DateTime<Utc>, created_by: Uuid) -> Self {
        Self { 
            uuid,
            text, 
            files,
            teaser,
            preview,
            access,
            created_at,
            created_by,
            updated_at: created_at,
            updated_by: created_by,
            deleted_at: None,
            deleted_by: OptionUuid::None
        }
    }
}
