
use anyhow::{anyhow};
use chrono::Utc;
use uuid::Uuid;
use crate::{
    query::{get_comment},
    event::{event_added, CommentCreated, CommentUpdated, CommentDeleted, comment_queue_added, OptionUuid},
    CommentFactory,
    queue::LapinProducer};


pub(crate) struct CreateComment {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub post_uuid: Uuid,
    pub reply_uuid: Option<Uuid>,
    pub parent_uuid: Option<Uuid>,
    pub created_by: Uuid,
}

impl From<&CreateComment> for CommentCreated {
    fn from(command: &CreateComment) -> Self {
        Self {
            uuid: command.uuid,
            text: command.text.clone(),
            files: command.files.clone(),
            post_uuid: command.post_uuid,
            reply_uuid: if let Some(uuid) = command.reply_uuid { OptionUuid::Some(uuid) } else { OptionUuid::None },
            parent_uuid: if let Some(uuid) = command.parent_uuid { OptionUuid::Some(uuid) } else { OptionUuid::None },
            command_type: "created".to_string(), 
            created_at: Utc::now(), 
            created_by: command.created_by
        }
    }
}

pub(crate) async fn create_comment(factory: &CommentFactory, lapin: &LapinProducer, request: &CreateComment) -> anyhow::Result<()> {
    let event_request: CommentCreated = request.into();

    event_added(factory, &event_request).await?;
    comment_queue_added(lapin, request.uuid.into()).await?;
    Ok(())
}

pub(crate) struct UpdateComment { 
    pub uuid: Uuid,
    pub text: Option<String>,
    pub add_files: Vec<String>,
    pub remove_files: Vec<String>,
    pub created_by: Uuid,
    pub api_url: String,
    pub token: String
}

impl From<&UpdateComment> for CommentUpdated {
    fn from(command: &UpdateComment) -> Self {
        Self {
            uuid: command.uuid,
            text: command.text.clone(),
            add_files: command.add_files.clone(),
            remove_files: command.remove_files.clone(),
            command_type: "updated".to_string(), 
            created_at: Utc::now(), 
            created_by: command.created_by
        }
    }
}

pub(crate) async fn update_comment(factory: &CommentFactory, lapin: &LapinProducer, request: &UpdateComment) -> anyhow::Result<()> {
    let response = get_comment(&request.api_url, &request.token, &request.uuid).await;
    match response {
        Ok(None) => return Err(anyhow!("Comment with UUID: {0} does not exist!", &request.uuid)),
        Ok(_comment) => {
            let event_request: CommentUpdated = request.into();
            event_added(factory, &event_request).await?;
            comment_queue_added(lapin, request.uuid.into()).await
        },
        Err(error) => return Err(error),
    }
}

pub(crate) struct DeleteComment {
    pub uuid: Uuid,
    pub created_by: Uuid,
    pub api_url: String,
    pub token: String
}



impl From<&DeleteComment> for CommentDeleted {
    fn from(command: &DeleteComment) -> Self {
        Self {
            uuid: command.uuid,
            command_type: "deleted".to_string(), 
            created_at: Utc::now(), 
            created_by: command.created_by
        }
    }
}


pub(crate) async fn delete_comment(factory: &CommentFactory, lapin: &LapinProducer, request: &DeleteComment) -> anyhow::Result<()> {

    let response = get_comment(&request.api_url, &request.token, &request.uuid).await;
    match response {
        Ok(None) => return Err(anyhow!("Comment with UUID: {0} does not exist!", request.uuid)),
        Ok(_comment) => {
            let event_request: CommentDeleted = request.into();
            event_added(factory, &event_request).await?;
            comment_queue_added(lapin, request.uuid.into()).await
        },
        Err(error) => return Err(error),
    }
}