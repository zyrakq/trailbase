use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use thiserror::Error;

#[derive(Clone, Error, Debug)]
pub enum CommentError {
    #[error("Comment wasn't created with uuid {0}")]
    MissingComment(Uuid),
    #[error("Event type unknown, event number {0}")]
    EventTypeUnknown(String),
    #[error("Comment with the same {0} was created twice")]
    CommentCreatedTwice(Uuid)
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum OptionUuid {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    Some(Uuid),
    None,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentEvent {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: Option<String>,
    pub files: Option<Vec<String>>,
    pub add_files: Option<Vec<String>>,
    pub remove_files: Option<Vec<String>>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub post_uuid: Uuid,
    pub reply_uuid: OptionUuid,
    pub parent_uuid: OptionUuid,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Comment {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub post_uuid: Uuid,
    pub reply_uuid: OptionUuid,
    pub parent_uuid: OptionUuid,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
    pub updated_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub updated_by: Uuid,
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_by: OptionUuid,
}

impl Comment {
    pub fn new(uuid: Uuid, text: String, files: Vec<String>, post_uuid: Uuid, reply_uuid: OptionUuid, parent_uuid: OptionUuid, created_at: DateTime<Utc>, created_by: Uuid) -> Self {
        Self { 
            uuid,
            text, 
            files,
            post_uuid,
            reply_uuid,
            parent_uuid,
            created_at,
            created_by,
            updated_at: created_at,
            updated_by: created_by,
            deleted_at: None,
            deleted_by: OptionUuid::None
        }
    }
}
