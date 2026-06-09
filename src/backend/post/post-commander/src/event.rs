use lapin::{options::BasicPublishOptions, BasicProperties};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::{PostFactory, queue::LapinProducer};


#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostCreated {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: String,
    pub files: Vec<String>,
    pub teaser: String,
    pub preview: String,
    pub access: String,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostUpdated {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub text: Option<String>,
    pub add_files: Vec<String>,
    pub remove_files: Vec<String>,
    pub teaser: Option<String>,
    pub preview: Option<String>,
    pub access: Option<String>,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostDeleted {
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub uuid: Uuid,
    pub command_type: String,
    pub created_at: DateTime<Utc>,
    #[serde(with = "mongodb::bson::serde_helpers::uuid_1_as_binary")]
    pub created_by: Uuid,
}

pub async fn event_added<TEvent: Serialize>(factory: &PostFactory, event: &TEvent) -> anyhow::Result<()> {
    let collection = factory.create::<TEvent>().await?;
    collection.insert_one(event, None).await?;
    Ok(())
}

#[derive(Clone, Copy, Debug)]
pub struct PostQueueAdded(Uuid);

impl From<Uuid> for PostQueueAdded {
    fn from(uuid: Uuid) -> Self {
        Self (uuid)
    }
}

impl Into<Uuid> for PostQueueAdded {
    fn into(self) -> Uuid {
        self.0
    }
}
    


pub async fn post_queue_added(lapin: &LapinProducer, event: PostQueueAdded) -> anyhow::Result<()> {
    let payload: Uuid = event.into();
    lapin.channel
                .basic_publish(
                    "",
                    "post_worker",
                    BasicPublishOptions::default(),
                    payload.as_bytes(),
                    BasicProperties::default(),
                )
                .await?
                .await?;
    Ok(())
}