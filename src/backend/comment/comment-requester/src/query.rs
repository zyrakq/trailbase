
use uuid::Uuid;

use crate::{
    CommentFactory,
    model::{CommentView, CommentError}, 
    mongodb::{GetComment, get_comment},
    reqwest::get_post
};



pub struct GetCommentView {
    pub uuid: Uuid
}

impl From<Uuid> for GetCommentView {
    fn from(uuid: Uuid)-> Self {
        Self { uuid }
    }
}

impl From<&GetCommentView> for GetComment {
    fn from(req: &GetCommentView) -> Self {
        Self {
            uuid: req.uuid
        }
    }
}

pub struct ClientInfo {
    pub api_url: String,
    pub token: Option<String>,
}

pub async fn get_comment_view(factory: &CommentFactory, req: &GetCommentView, client_info: &ClientInfo) -> anyhow::Result<CommentView> {

    let comment = get_comment(factory, &req.into()).await?;

    let access = {
        let post = get_post(&client_info.api_url, &client_info.token, &comment.post_uuid).await?;
        post.access
    };

    match access {
        true => Ok(comment.into()),
        false => Err(CommentError::Forbidden(comment.post_uuid).into())
    }
}