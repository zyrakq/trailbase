
use mongodb::{bson::doc, options::FindOptions};
use uuid::Uuid;
use futures::stream::StreamExt;

use crate::{PostFactory, model::Post};


pub struct GetPostListByFilter {
    pub sub: Uuid,
    pub offset: u64,
    pub count: i64,
}


pub async fn get_post_list_by_filter(factory: &PostFactory, req: &GetPostListByFilter) -> anyhow::Result<Vec<Post>> {
    let collection = factory.create::<Post>().await?;

    let find_options = FindOptions::builder().skip(req.offset).limit(req.count).build();

    let result = collection
    .find(doc! { "created_by": req.sub }, find_options)
    .await?
    .collect::<Vec<Result<Post, _>>>()
    .await
    .into_iter()
    .collect::<Result<Vec<Post>, _>>()?;

    Ok(result)
}

pub struct GetPostCount {
    pub sub: Uuid
}

pub async fn get_post_count(factory: &PostFactory, req: &GetPostCount) -> anyhow::Result<u64> {
    let collection = factory.create::<Post>().await?;

    let result = collection
    .count_documents(doc! { "created_by": req.sub }, None)
    .await?;

    Ok(result)
}