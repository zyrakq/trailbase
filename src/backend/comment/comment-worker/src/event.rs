use bson::doc;
use serde::{Deserialize, Serialize};
use crate::{model::Comment, CommentViewFactory};




#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CommentViewUpdated {
    pub comment: Comment,
    pub existed: bool
}


pub async fn commentview_updated(view_factory: &CommentViewFactory, event: CommentViewUpdated) -> anyhow::Result<()> {
    let collection = view_factory.create::<Comment>().await?;
    if event.existed {
        collection.replace_one(doc! { "uuid": event.comment.uuid.clone() },event.comment, None).await?;
    }
    else {
        collection.insert_one(event.comment, None).await?;
    }
    Ok(())
}