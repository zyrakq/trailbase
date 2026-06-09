
use uuid::Uuid;

use crate::{
    PostFactory,
    model::{PostResult, PostView}, 
    mongodb::{GetPostListByFilter, GetPostCount, get_post_list_by_filter, get_post_count}, reqwest::{get_permission_info, PermissionInfo}
};

pub struct GetPostList {
    pub sub: Uuid,
    pub offset: u64,
    pub count: i64,
}

impl From<&GetPostList> for GetPostListByFilter {
    fn from(req: &GetPostList) -> Self {
        Self {
            sub: req.sub,
            offset: req.offset,
            count: req.count
        }
    }
}

impl From<&GetPostList> for GetPostCount {
    fn from(req: &GetPostList) -> Self {
        Self {
            sub: req.sub
        }
    }
}

pub async fn get_post_list(factory: &PostFactory, req: &GetPostList, current_user: Option<Uuid>) -> anyhow::Result<PostResult> {


    let permission = match current_user {
        Some(sub) => get_permission_info(sub),
        _ => PermissionInfo::default()
    };

    let items = get_post_list_by_filter(&factory, &req.into())
        .await?
        .into_iter()
        .map(|it| it.into())
        .map(|it| post_with_permission(it, &permission))
        .collect();

    let total = get_post_count(&factory, &req.into()).await?;

    let result = PostResult {
        items,
        total,
        count: req.count,
        offset: req.offset
    };
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