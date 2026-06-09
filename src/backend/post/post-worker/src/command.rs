use uuid::Uuid;
use crate::event::{postview_updated, PostViewUpdated};
use crate::query::{get_postview, get_post_event_list, GetPostView, GetPostEvents};
use crate::{PostFactory, PostViewFactory};
use crate::model::Post;
use crate::projector::Projector;

pub struct UpdatePostView(Uuid);

impl From<Uuid> for UpdatePostView {
    fn from(uuid: Uuid)-> Self {
        Self(uuid)
    }
}


pub async fn update_post_view(factory: &PostFactory, view_factory: &PostViewFactory, request: UpdatePostView) -> anyhow::Result<()> {

    let post_view = get_postview(view_factory, GetPostView{ uuid: request.0.clone() }).await?;

    let updated_at = post_view.as_ref().map_or(None, |p| Some(p.updated_at));

    let post_events = get_post_event_list(
        factory,
        GetPostEvents {
            uuid: request.0.clone(),
            created_at: updated_at.into()
        }
    ).await?;

    let post = Post::load(&post_events, post_view.clone())?;

    postview_updated(
        view_factory,
        PostViewUpdated { post, existed: post_view.is_some()}
    ).await?;

    Ok(())
}