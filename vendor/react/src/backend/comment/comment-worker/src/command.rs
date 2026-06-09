use uuid::Uuid;
use crate::event::{commentview_updated, CommentViewUpdated};
use crate::query::{get_commentview, get_comment_event_list, GetCommentView, GetCommentEvents};
use crate::{CommentFactory, CommentViewFactory};
use crate::model::Comment;
use crate::projector::Projector;

pub struct UpdateCommentView(Uuid);

impl From<Uuid> for UpdateCommentView {
    fn from(uuid: Uuid)-> Self {
        Self(uuid)
    }
}


pub async fn update_comment_view(factory: &CommentFactory, view_factory: &CommentViewFactory, request: UpdateCommentView) -> anyhow::Result<()> {

    let comment_view = get_commentview(view_factory, GetCommentView{ uuid: request.0.clone() }).await?;

    let updated_at = comment_view.as_ref().map_or(None, |p| Some(p.updated_at));

    let comment_events = get_comment_event_list(
        factory,
        GetCommentEvents {
            uuid: request.0.clone(),
            created_at: updated_at.into()
        }
    ).await?;

    let comment = Comment::load(&comment_events, comment_view.clone())?;

    commentview_updated(
        view_factory,
        CommentViewUpdated { comment, existed: comment_view.is_some()}
    ).await?;

    Ok(())
}