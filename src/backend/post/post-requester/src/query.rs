
use uuid::Uuid;

use crate::{
    PostFactory,
    model::PostView, 
    mongodb::{GetPost, get_post}, reqwest::{get_permission_info, PermissionInfo}
};



pub struct GetPostView {
    pub uuid: Uuid
}

impl From<Uuid> for GetPostView {
    fn from(uuid: Uuid)-> Self {
        Self { uuid }
    }
}

impl From<&GetPostView> for GetPost {
    fn from(req: &GetPostView) -> Self {
        Self {
            uuid: req.uuid
        }
    }
}

pub async fn get_post_view(factory: &PostFactory, req: &GetPostView, current_user: Option<Uuid>) -> anyhow::Result<PostView> {


    let permission = match current_user {
        Some(sub) => get_permission_info(sub),
        _ => PermissionInfo::default()
    };

    let post = get_post(factory, &req.into()).await?;

    let result = post_with_permission(post.into(), &permission);

    Ok(result)
}

pub fn post_with_permission(post: PostView, permission: &PermissionInfo) -> PostView {

    if permission.subs.is_empty() && permission.paid_posts.is_empty() {
        return post;
    }

    let access = has_permission(&post, permission);

    PostView {
        access,
        text: if access { post.text } else { "".to_string() },
        files: if access { post.files } else { vec![] },
        ..post
    }
}

pub fn has_permission(post: &PostView, permission: &PermissionInfo) -> bool {
    let mut access = permission.subs
    .iter()
    .any(|sub| sub.started_at <= post.published_at && sub.stopped_at >= post.published_at);

    if !access {
        access = permission.paid_posts
        .iter()
        .any(|paid| paid.uuid == post.uuid);
    }
    access
}