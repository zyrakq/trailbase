use crate::model::{Comment, CommentEvent, CommentError, OptionUuid};


trait State<TState, TEvent> {
    fn handle(state: Option<TState>, command: &TEvent) -> anyhow::Result<TState> where TState: Sized;
}

struct CommentCreated;
struct CommentUpdated;

struct CommentDeleted;

impl State<Comment, CommentEvent> for CommentCreated {
    fn handle(state: Option<Comment>, event: &CommentEvent) -> anyhow::Result<Comment> {
        match state {
            Some(_) => Err(CommentError::CommentCreatedTwice(event.uuid).into()),
            _ => Ok(Comment::new(
                event.uuid,
                if let Some(text) = event.text.clone() { text } else { "".to_string() },
                if let Some(files) = event.files.clone() { files } else { vec![] },
                event.post_uuid,
                event.reply_uuid.clone(),
                event.parent_uuid.clone(),
                event.created_at,
                event.created_by
            ))
        }
    }
}

impl State<Comment, CommentEvent> for CommentUpdated {
    fn handle(state: Option<Comment>, event: &CommentEvent) -> anyhow::Result<Comment> {
        let state: anyhow::Result<Comment> = state.map_or(
            Err(CommentError::MissingComment(event.uuid).into()),
            |v| Ok(v)
        );
        let mut comment = state?;
        let remove_files: Vec<String> = event.remove_files.clone().into_iter().flatten().collect();

        let files: Vec<String> = comment.files
        .into_iter()
        .filter(|f| -> bool { remove_files.contains(&f) })
        .chain(event.add_files.clone().into_iter().flatten())
        .collect();

        comment.text = if let Some(text) = event.text.clone() { text } else { comment.text.to_owned() };
        comment.files = files;
        comment.updated_at = event.created_at;

        Ok(comment)
    }
}


impl State<Comment, CommentEvent> for CommentDeleted {
    fn handle(state: Option<Comment>, event: &CommentEvent) -> anyhow::Result<Comment> {
        let state: anyhow::Result<Comment> = state.map_or(
            Err(CommentError::MissingComment(event.uuid).into()),
            |v| Ok(v)
        );
        let mut comment = state?;
        comment.deleted_at = Some(event.created_at);
        comment.deleted_by = OptionUuid::Some(event.created_by);
        Ok(comment)
    }
}


pub trait Projector<TEvent> {
    fn load(events: &[TEvent], state: Option<Self>) -> anyhow::Result<Self> where Self: Sized;
}


impl Projector<CommentEvent> for Comment {
    fn load(events: &[CommentEvent], state: Option<Self>) -> anyhow::Result<Comment> {
        let mut acc: Option<Comment> = state;

        for event in events {
            let event_result = match event.command_type.as_str() {
                "created" => CommentCreated::handle(acc, event),
                "updated" => CommentUpdated::handle(acc, event),
                "deleted" => CommentDeleted::handle(acc, event),
                event_type => Err(CommentError::EventTypeUnknown(event_type.to_string()).into()) 
            };
            acc = Some(event_result?);
        }

        Ok(acc.unwrap())
    }
}