
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use thiserror::Error;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum OptionUuid {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    Some(Uuid),
    None,
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

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentView {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub post_uuid: Uuid,
    pub reply_uuid: Option<Uuid>,
    pub parent_uuid: Option<Uuid>,
    pub updated_at: DateTime<Utc>
}

impl From<Comment> for CommentView {
    fn from(comment: Comment) -> Self {
        Self {
            uuid: comment.uuid,
            text: comment.text,
            files: comment.files,
            post_uuid: comment.post_uuid,
            reply_uuid: if let OptionUuid::Some(uuid) = comment.reply_uuid { Some(uuid) } else { None },
            parent_uuid: if let OptionUuid::Some(uuid) = comment.parent_uuid { Some(uuid) } else { None },
            updated_at: comment.updated_at
        }
    }
}

#[derive(Error, Debug)]
pub enum CommentError {
    #[error("Access to post comments: {0} denied!")]
    Forbidden(Uuid),
    #[error("No comment found with UUID {0}")]
    NotFound(Uuid),
    #[error("No post found with UUID {0}")]
    PostNotFound(Uuid)
}