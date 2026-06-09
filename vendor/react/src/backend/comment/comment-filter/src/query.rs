
use aliri_extra_reqwest::AuthClient;
use uuid::Uuid;

use crate::{
    CommentFactory,
    model::{CommentResult, CommentError, CommentWithReplies, CommentView},
    reqwest::{get_post, GetUserList, get_user_list},
    mongodb::{
        GetCommentListByPost,
        GetCommentListByParent,
        GetCommentCount,
        get_comment_list_by_post,
        get_comment_list_by_parent,
        get_comment_count
    }
};


pub struct GetCommentListByFilter {
    pub post_uuid: Uuid,
    pub offset: u64,
    pub count: i64,
}

impl From<&GetCommentListByFilter> for GetCommentListByPost {
    fn from(req: &GetCommentListByFilter) -> Self {
        Self {
            post_uuid: req.post_uuid,
            offset: req.offset,
            count: req.count
        }
    }
}


pub async fn get_comment_list_by_filter(client: &AuthClient, factory: &CommentFactory, req: &GetCommentListByFilter) -> anyhow::Result<Vec<CommentView>> {

    let comments = get_comment_list_by_post(&factory, &req.into()).await?;

    let ids = comments.iter().map(|x| x.created_by).collect();

    let users = get_user_list(client, &GetUserList { ids }).await?;

    let mut result:Vec<CommentView> = vec![];

    for parent in comments.into_iter() {
        let replies = get_comment_list_by_parent(
            &factory,
            &GetCommentListByParent { parent_uuid: parent.uuid })
        .await?;
        let comment = CommentWithReplies { parent, replies, users: users.clone() };
        result.push(comment.into())
    };
    
    result.reverse();

    Ok(result)

}


pub struct GetCommentList {
    pub post_uuid: Uuid,
    pub offset: u64,
    pub count: i64,
}

impl From<&GetCommentList> for GetCommentListByFilter {
    fn from(req: &GetCommentList) -> Self {
        Self {
            post_uuid: req.post_uuid,
            offset: req.offset,
            count: req.count
        }
    }
}

impl From<&GetCommentList> for GetCommentCount {
    fn from(req: &GetCommentList) -> Self {
        Self {
            post_uuid: req.post_uuid
        }
    }
}

pub struct ClientInfo {
    pub api_url: String,
    pub token: Option<String>,
}

pub async fn get_comment_list(client: &AuthClient, factory: &CommentFactory, req: &GetCommentList, client_info: &ClientInfo) -> anyhow::Result<CommentResult> {

    let access = {
        let post = get_post(&client_info.api_url, &client_info.token, &req.post_uuid).await?;
        post.access
    };

    if !access {
        return Err(CommentError::Forbidden(req.post_uuid).into());
    };

    let items = get_comment_list_by_filter(client, factory, &req.into())
        .await?
        .into_iter()
        .map(|it| it.into())
        .collect();

    let total = get_comment_count(&factory, &req.into()).await?;

    let result = CommentResult {
        items,
        total,
        count: req.count,
        offset: req.offset
    };
    Ok(result)
}