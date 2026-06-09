
use bson::Document;
use mongodb::{bson::doc, options::FindOptions};
use uuid::Uuid;
use futures::stream::StreamExt;

use crate::{CommentFactory, model::Comment};

struct GetCommentList {
    filter: Document,
    find_options: FindOptions,
}

async fn get_comment_list(factory: &CommentFactory, req: GetCommentList) -> anyhow::Result<Vec<Comment>> {
    let collection = factory.create::<Comment>().await?;

    let result = collection
    .find(req.filter, req.find_options)
    .await?
    .collect::<Vec<Result<Comment, _>>>()
    .await
    .into_iter()
    .collect::<Result<Vec<Comment>, _>>()?;

    Ok(result)
}


pub struct GetCommentListByPost {
    pub post_uuid: Uuid,
    pub offset: u64,
    pub count: i64,
}


pub async fn get_comment_list_by_post(factory: &CommentFactory, req: &GetCommentListByPost) -> anyhow::Result<Vec<Comment>> {
    // Фильтр по post_uuid
    let filter = doc! {"post_uuid": req.post_uuid };

    let find_options = FindOptions::builder()
    .sort(doc! {"created_at": -1})
    .skip(req.offset)
    .limit(req.count)
    .build();

    get_comment_list(factory, GetCommentList {filter, find_options}).await
}

pub struct GetCommentListByParent {
    pub parent_uuid: Uuid,
    // pub offset: u64,
    // pub count: i64,
}


pub async fn get_comment_list_by_parent(factory: &CommentFactory, req: &GetCommentListByParent) -> anyhow::Result<Vec<Comment>> {
    // Фильтр по parent_uuid
    let filter = doc! {"parent_uuid": req.parent_uuid };

    let find_options = FindOptions::builder()
    //.sort(doc! {"created_at": -1})
    // .skip(req.offset)
    // .limit(req.count)
    .build();

    get_comment_list(factory, GetCommentList {filter, find_options}).await
}



pub struct GetCommentCount {
    pub post_uuid: Uuid
}

pub async fn get_comment_count(factory: &CommentFactory, req: &GetCommentCount) -> anyhow::Result<u64> {
    let collection = factory.create::<Comment>().await?;

    let result = collection
    .count_documents(doc! { "post_uuid": req.post_uuid, "parent_uuid": Option::<Uuid>::None }, None)
    .await?;

    Ok(result)
}