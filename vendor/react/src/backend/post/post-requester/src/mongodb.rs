
use mongodb::bson::doc;
use uuid::Uuid;

use crate::{PostFactory, model::{Post, PostError}};

pub struct GetPost {
    pub uuid: Uuid
}

pub async fn get_post(factory: &PostFactory, request: &GetPost) -> anyhow::Result<Post> {
    let collection = factory.create::<Post>().await?;

    let result = collection
        .find_one(doc! { "uuid": request.uuid }, None)
        .await?;

    match result {
        Some(result) => Ok(result),
        _ => Err(PostError::NotFound(request.uuid.to_owned()).into()),
    }
}