
use mongodb::bson::doc;
use uuid::Uuid;

use crate::{CommentFactory, model::{Comment, CommentError}};

pub struct GetComment {
    pub uuid: Uuid
}

pub async fn get_comment(factory: &CommentFactory, request: &GetComment) -> anyhow::Result<Comment> {
    let collection = factory.create::<Comment>().await?;

    let result = collection
        .find_one(doc! { "uuid": request.uuid }, None)
        .await?;

    match result {
        Some(result) => Ok(result),
        _ => Err(CommentError::NotFound(request.uuid.to_owned()).into()),
    }
}