
use chrono::{DateTime, Utc};
use mongodb::bson::doc;
use futures::stream::StreamExt;
use uuid::Uuid;
use crate::{model::{CommentEvent, Comment}, CommentFactory, CommentViewFactory};





pub struct GetCommentEvents{
    pub uuid: Uuid,
    pub created_at: Option<DateTime<Utc>>
}


pub async fn get_comment_event_list(factory: &CommentFactory, request: GetCommentEvents) -> anyhow::Result<Vec<CommentEvent>> {
    let collection = factory.create::<CommentEvent>().await?;

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
        .collect::<Vec<Result<CommentEvent, _>>>()
        .await
        .into_iter()
        .collect::<Result<Vec<CommentEvent>, _>>()?;

    Ok(result)
}





pub struct GetCommentView{
    pub uuid: Uuid,
}



pub async fn get_commentview(view_factory: &CommentViewFactory, request: GetCommentView) -> anyhow::Result<Option<Comment>> {
    let collection = view_factory.create::<Comment>().await?;

    let result = collection
        .find_one(doc! {
            "uuid": request.uuid
        }, None)
        .await?;

    Ok(result)
}