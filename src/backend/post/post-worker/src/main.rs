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

use crate::command::update_post_view;



mongodb_macro::collection!(PostFactory; PostFactoryOpts);
mongodb_macro::collection!(PostViewFactory; PostViewFactoryOpts; ("VIEW_DB_URL", "VIEW_DB_NAME", "VIEW_COLLECTION_NAME"));



#[derive(Clone, Debug)]
struct WorkerRequest {
    consumer: Consumer,
    post_factory: PostFactory,
    post_viewe_factory: PostViewFactory,

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
    
    info!("will consume post_worker");

    let mut consumer = request.consumer.clone();

    while let Some(delivery) = consumer.next().await {
        let delivery = delivery?;

        let uuid = Uuid::from_slice(delivery.data.as_slice()).expect("error when get uuid from delivery");

        update_post_view(
            &request.post_factory, 
            &request.post_viewe_factory, 
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
        post_factory: PostFactory::parse(),
        post_viewe_factory: PostViewFactory::parse()
    };

    start(request).await;

    Ok(())
}