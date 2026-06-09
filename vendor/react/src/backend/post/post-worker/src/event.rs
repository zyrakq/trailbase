use bson::doc;
use serde::{Deserialize, Serialize};
use crate::{model::Post, PostViewFactory};




#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct PostViewUpdated {
    pub post: Post,
    pub existed: bool
}


pub async fn postview_updated(view_factory: &PostViewFactory, event: PostViewUpdated) -> anyhow::Result<()> {
    let collection = view_factory.create::<Post>().await?;
    if event.existed {
        collection.replace_one(doc! { "uuid": event.post.uuid.clone() },event.post, None).await?;
    }
    else {
        collection.insert_one(event.post, None).await?;
    }
    Ok(())
}