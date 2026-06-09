
use anyhow::{anyhow};
use chrono::Utc;
use uuid::Uuid;
use crate::{
    query::{get_post},
    event::{event_added, PostCreated, PostUpdated, PostDeleted, post_queue_added},
    PostFactory,
    queue::LapinProducer};


pub(crate) struct CreatePost {
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub teaser: String,
    pub preview: String,
    pub created_by: Uuid,
    pub access: String,
    pub api_url: String,
}

impl From<&CreatePost> for PostCreated {
    fn from(command: &CreatePost) -> Self {
        Self {
            uuid: command.uuid,
            text: command.text.clone(),
            files: command.files.clone(),
            teaser: command.teaser.clone(),
            preview: command.preview.clone(),
            access: command.access.clone(),
            command_type: "created".to_string(), 
            created_at: Utc::now(), 
            created_by: command.created_by
        }
    }
}

pub(crate) async fn create_post(factory: &PostFactory, lapin: &LapinProducer, request: &CreatePost) -> anyhow::Result<()> {
    let event_request: PostCreated = request.into();

    event_added(factory, &event_request).await?;
    post_queue_added(lapin, request.uuid.into()).await?;
    Ok(())
}

pub(crate) struct UpdatePost { 
    pub uuid: Uuid,
    pub text: Option<String>,
    pub add_files: Vec<String>,
    pub remove_files: Vec<String>,
    pub teaser: Option<String>,
    pub preview: Option<String>,
    pub access: Option<String>,
    pub created_by: Uuid,
    pub api_url: String,
    pub token: String
}

impl From<&UpdatePost> for PostUpdated {
    fn from(command: &UpdatePost) -> Self {
        Self {
            uuid: command.uuid,
            text: command.text.clone(),
            add_files: command.add_files.clone(),
            remove_files: command.remove_files.clone(),
            teaser: command.teaser.clone(),
            preview: command.preview.clone(),
            access: command.access.clone(),
            command_type: "updated".to_string(), 
            created_at: Utc::now(), 
            created_by: command.created_by
        }
    }
}

pub(crate) async fn update_post(factory: &PostFactory, lapin: &LapinProducer, request: &UpdatePost) -> anyhow::Result<()> {
    let response = get_post(&request.api_url, &request.token, &request.uuid).await;
    match response {
        Ok(None) => return Err(anyhow!("Post with UUID: {0} does not exist!", &request.uuid)),
        Ok(_post) => {
            let event_request: PostUpdated = request.into();
            event_added(factory, &event_request).await?;
            post_queue_added(lapin, request.uuid.into()).await
        },
        Err(error) => return Err(error),
    }
}

pub(crate) struct DeletePost {
    pub uuid: Uuid,
    pub created_by: Uuid,
    pub api_url: String,
    pub token: String
}



impl From<&DeletePost> for PostDeleted {
    fn from(command: &DeletePost) -> Self {
        Self {
            uuid: command.uuid,
            command_type: "deleted".to_string(), 
            created_at: Utc::now(), 
            created_by: command.created_by
        }
    }
}


pub(crate) async fn delete_post(factory: &PostFactory, lapin: &LapinProducer, request: &DeletePost) -> anyhow::Result<()> {

    let response = get_post(&request.api_url, &request.token, &request.uuid).await;
    match response {
        Ok(None) => return Err(anyhow!("Post with UUID: {0} does not exist!", request.uuid)),
        Ok(_post) => {
            let event_request: PostDeleted = request.into();
            event_added(factory, &event_request).await?;
            post_queue_added(lapin, request.uuid.into()).await
        },
        Err(error) => return Err(error),
    }
}