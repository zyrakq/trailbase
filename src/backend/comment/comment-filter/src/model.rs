
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
pub struct User {
    uuid: Uuid,
    username: String,
    picture: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Reply {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub creted_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub reply_uuid: Uuid,
    pub sub: Uuid,
    pub username: String,
    pub picture: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct ReplyWithUser {
    pub comment: Comment,
    pub user: User
}

impl From<ReplyWithUser> for Reply {
    fn from(reply: ReplyWithUser)-> Self {
        let ReplyWithUser{ comment, user } = reply;
        let reply_uuid = match comment.reply_uuid {
            OptionUuid::Some(reply_uuid) => reply_uuid,
            _ => panic!("Error when trying to convert OptionUuid to Uuid")
        };
        Reply {
            uuid: comment.uuid,
            text: comment.text,
            files: comment.files,
            creted_at: comment.created_at,
            updated_at: comment.updated_at,
            reply_uuid,
            sub: comment.created_by,
            username: user.username,
            picture: user.picture
    
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentView {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub creted_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub replies: Vec<Reply>,
    pub sub: Uuid,
    pub username: String,
    pub picture: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentWithReplies {
    pub parent: Comment,
    pub replies: Vec<Comment>,
    pub users: Vec<User>
}

impl From<CommentWithReplies> for CommentView {
    fn from(comment: CommentWithReplies)-> Self {
        let CommentWithReplies { parent, replies, users } = comment;
        let replies = replies.into_iter()
        .map(|it| {
            let user = users.iter().find(|&user| user.uuid == it.created_by).unwrap().to_owned();
            (ReplyWithUser { comment: it, user }).into()
        })
        .collect();

        let user = users.iter().find(|&user| user.uuid == parent.created_by).unwrap().to_owned();
    
        CommentView {
            uuid: parent.uuid,
            text: parent.text,
            files: parent.files,
            creted_at: parent.created_at,
            updated_at: parent.updated_at,
            sub: parent.created_by,
            username: user.username,
            picture: user.picture,
            replies
        }
    }
}


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentResult {
    pub total: u64,
    pub offset: u64,
    pub count: i64,
    pub items: Vec<CommentView>,
}

#[derive(Error, Debug)]
pub enum CommentError {
    #[error("Access to post comments: {0} denied!")]
    Forbidden(Uuid),
    #[error("No post found with UUID {0}")]
    PostNotFound(Uuid)
}