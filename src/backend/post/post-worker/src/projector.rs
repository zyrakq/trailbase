use crate::model::{Post, PostEvent, PostError, OptionUuid};


trait State<TState, TEvent> {
    fn handle(state: Option<TState>, command: &TEvent) -> anyhow::Result<TState> where TState: Sized;
}

struct PostCreated;
struct PostUpdated;

struct PostDeleted;

impl State<Post, PostEvent> for PostCreated {
    fn handle(state: Option<Post>, event: &PostEvent) -> anyhow::Result<Post> {
        match state {
            Some(_) => Err(PostError::PostCreatedTwice(event.uuid).into()),
            _ => Ok(Post::new(
                event.uuid,
                if let Some(text) = event.text.clone() { text } else { "".to_string() },
                if let Some(files) = event.files.clone() { files } else { vec![] },
                if let Some(teaser) = event.teaser.clone() { teaser } else { "".to_string() },
                if let Some(preview) = event.preview.clone() { preview } else { "".to_string() },
                if let Some(access) = event.access.clone() { access } else { "".to_string() },
                event.created_at,
                event.created_by
            ))
        }
    }
}

impl State<Post, PostEvent> for PostUpdated {
    fn handle(state: Option<Post>, event: &PostEvent) -> anyhow::Result<Post> {
        let state: anyhow::Result<Post> = state.map_or(
            Err(PostError::MissingPost(event.uuid).into()),
            |v| Ok(v)
        );
        let mut post = state?;
        let remove_files: Vec<String> = event.remove_files.clone().into_iter().flatten().collect();

        let files: Vec<String> = post.files
        .into_iter()
        .filter(|f| -> bool { remove_files.contains(&f) })
        .chain(event.add_files.clone().into_iter().flatten())
        .collect();

        post.text = if let Some(text) = event.text.clone() { text } else { post.text.to_owned() };
        post.files = files;
        post.teaser = if let Some(teaser) = event.teaser.clone() { teaser } else { post.teaser.to_owned() };
        post.preview = if let Some(preview) = event.preview.clone() { preview } else { post.preview.to_owned() };
        post.access = if let Some(access) = event.access.clone() { access } else { post.access.to_owned() };
        post.updated_at = event.created_at;

        Ok(post)
    }
}


impl State<Post, PostEvent> for PostDeleted {
    fn handle(state: Option<Post>, event: &PostEvent) -> anyhow::Result<Post> {
        let state: anyhow::Result<Post> = state.map_or(
            Err(PostError::MissingPost(event.uuid).into()),
            |v| Ok(v)
        );
        let mut post = state?;
        post.deleted_at = Some(event.created_at);
        post.deleted_by = OptionUuid::Some(event.created_by);
        Ok(post)
    }
}


pub trait Projector<TEvent> {
    fn load(events: &[TEvent], state: Option<Self>) -> anyhow::Result<Self> where Self: Sized;
}


impl Projector<PostEvent> for Post {
    fn load(events: &[PostEvent], state: Option<Self>) -> anyhow::Result<Post> {
        let mut acc: Option<Post> = state;

        for event in events {
            let event_result = match event.command_type.as_str() {
                "created" => PostCreated::handle(acc, event),
                "updated" => PostUpdated::handle(acc, event),
                "deleted" => PostDeleted::handle(acc, event),
                event_type => Err(PostError::EventTypeUnknown(event_type.to_string()).into()) 
            };
            acc = Some(event_result?);
        }

        Ok(acc.unwrap())
    }
}

// impl FromIterator<PostEvent> for anyhow::Result<Vec<Post>> {
//     fn from_iter<I: IntoIterator<Item = PostEvent>>(iter: I) -> Self {
//         iter.into_iter().fold(HashMap::new(), |mut acc, item| {
//             {
//                 let counter = acc.entry(item.uuid).or_insert(vec![]);
//                 (*counter).append(&mut vec![item])
//             }
//             acc
//         })
//         .into_iter()
//         .map(|(uuid, events)| Post::load(uuid, events, None))
//         .collect::<anyhow::Result<Vec<Post>>>()
//     }
// }
