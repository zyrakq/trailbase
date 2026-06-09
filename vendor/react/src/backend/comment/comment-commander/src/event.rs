use lapin::{options::BasicPublishOptions, BasicProperties};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::{CommentFactory, queue::LapinProducer};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum OptionUuid {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    Some(Uuid),
    None,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentCreated {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
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
pub struct CommentUpdated {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: Option<String>,
    pub add_files: Vec<String>,
    pub remove_files: Vec<String>,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentDeleted {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}

pub async fn event_added<TEvent: Serialize>(factory: &CommentFactory, event: &TEvent) -> anyhow::Result<()> {
    let collection = factory.create::<TEvent>().await?;
    collection.insert_one(event, None).await?;
    Ok(())
}

#[derive(Clone, Copy, Debug)]
pub struct CommentQueueAdded(Uuid);

impl From<Uuid> for CommentQueueAdded {
    fn from(uuid: Uuid) -> Self {
        Self (uuid)
    }
}

impl Into<Uuid> for CommentQueueAdded {
    fn into(self) -> Uuid {
        self.0
    }
}
    


pub async fn comment_queue_added(lapin: &LapinProducer, event: CommentQueueAdded) -> anyhow::Result<()> {
    let payload: Uuid = event.into();
    lapin.channel
                .basic_publish(
                    "",
                    "comment_worker",
                    BasicPublishOptions::default(),
                    payload.as_bytes(),
                    BasicProperties::default(),
                )
                .await?
                .await?;
    Ok(())
}