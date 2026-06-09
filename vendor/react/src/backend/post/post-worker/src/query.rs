
use chrono::{DateTime, Utc};
use mongodb::bson::doc;
use futures::stream::StreamExt;
use uuid::Uuid;
use crate::{model::{PostEvent, Post}, PostFactory, PostViewFactory};





pub struct GetPostEvents{
    pub uuid: Uuid,
    pub created_at: Option<DateTime<Utc>>
}


pub async fn get_post_event_list(factory: &PostFactory, request: GetPostEvents) -> anyhow::Result<Vec<PostEvent>> {
    let collection = factory.create::<PostEvent>().await?;

    let filter = match request.created_at {
        Some(created_at) => {
            doc! {
                "uuid": request.uuid,
                "created_at": { "$gte": created_at }
            }
        },
        None => {
            doc! {
                "uuid": request.uuid
            }
        }
    };

    let result = collection
        .find(filter, None)
        .await
        .unwrap()
        .collect::<Vec<Result<PostEvent, _>>>()
        .await
        .into_iter()
        .collect::<Result<Vec<PostEvent>, _>>()?;

    Ok(result)
}





pub struct GetPostView{
    pub uuid: Uuid,
}



pub async fn get_postview(view_factory: &PostViewFactory, request: GetPostView) -> anyhow::Result<Option<Post>> {
    let collection = view_factory.create::<Post>().await?;

    let result = collection
        .find_one(doc! {
            "uuid": request.uuid
        }, None)
        .await?;

    Ok(result)
}