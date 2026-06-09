use envmnt::{ExpandOptions, ExpansionType};
use lapin::{Channel, Queue};
use lapin::{
    options::*, types::FieldTable, Connection,
    ConnectionProperties, Result,
};

use clap::Parser;

use log::info;


#[derive(Clone, Debug)]
pub struct LapinProducer {
    pub channel: Channel,
    pub queue: Queue
}

#[derive(Clone, Debug, clap::Parser)]
pub struct QueueOpts {
    /// AMQP_ADDR
    #[clap(env)]
    pub amqp_addr: String,
}

pub async fn create_queue() -> Result<LapinProducer> {

    let opts = QueueOpts::parse();

    info!("amqp_addr: {}", &opts.amqp_addr);

    let mut options = ExpandOptions::new();
    options.expansion_type = Some(ExpansionType::Unix);
    let amqp_addr = envmnt::expand(&opts.amqp_addr, Some(options));

    info!("amqp_addr: {}", &amqp_addr);

    let conn = Connection::connect(
        &amqp_addr,
        ConnectionProperties::default(),
    )
    .await?;

    let channel = conn.create_channel().await?;

    let queue = channel
    .queue_declare(
        "comment_worker",
        QueueDeclareOptions::default(),
        FieldTable::default(),
    )
    .await?;

    Ok(LapinProducer { channel, queue })
}