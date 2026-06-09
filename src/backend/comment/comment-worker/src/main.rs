mod event;
mod command;
mod query;
mod model;
mod projector;
mod queue;

use std::time::Duration;

use futures_lite::stream::StreamExt;
use lapin::{
    options::*, Consumer,
};
use tracing::{info, error};
use uuid::Uuid;

use clap::Parser;

use crate::command::update_comment_view;



mongodb_macro::collection!(CommentFactory; CommentFactoryOpts);
mongodb_macro::collection!(CommentViewFactory; CommentViewFactoryOpts; ("VIEW_DB_URL", "VIEW_DB_NAME", "VIEW_COLLECTION_NAME"));



#[derive(Clone, Debug)]
struct WorkerRequest {
    consumer: Consumer,
    comment_factory: CommentFactory,
    comment_viewe_factory: CommentViewFactory,

}


async fn start(request: WorkerRequest) -> () {
    let mut retry_interval = tokio::time::interval(Duration::from_secs(5));
    loop {
        retry_interval.tick().await;

        match execude(&request).await {
            Ok(_) => info!("rmq listen returned"),
            Err(e) => error!("rmq listen had an error: {}", e)
        }
    }
}

async fn execude(request: &WorkerRequest) -> anyhow::Result<()> {
    
    info!("will consume comment_worker");

    let mut consumer = request.consumer.clone();

    while let Some(delivery) = consumer.next().await {
        let delivery = delivery?;

        let uuid = Uuid::from_slice(delivery.data.as_slice()).expect("error when get uuid from delivery");

        update_comment_view(
            &request.comment_factory, 
            &request.comment_viewe_factory, 
            uuid.into()
        ).await?;


        delivery
            .ack(BasicAckOptions::default())
            .await?;
    };
    Ok(())
}

#[tokio::main]
async fn main() -> lapin::Result<()> {
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "info");
    }

    tracing_subscriber::fmt::init();

    let request = WorkerRequest {
        consumer: queue::create_consumer().await?,
        comment_factory: CommentFactory::parse(),
        comment_viewe_factory: CommentViewFactory::parse()
    };

    start(request).await;

    Ok(())
}