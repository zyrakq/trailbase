use envmnt::{ExpandOptions, ExpansionType};
use lapin::{
    options::*, types::FieldTable, Connection,
    ConnectionProperties, Result, Consumer,
};

use clap::Parser;

use tracing::info;

#[derive(Clone, Debug, clap::Parser)]
pub struct QueueOpts {
    /// AMQP_ADDR
    #[clap(env)]
    pub amqp_addr: String,
}

pub async fn create_consumer() -> Result<Consumer> {
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

    info!("CONNECTED");

    let channel = conn.create_channel().await?;

    let consumer = channel
        .basic_consume(
            "post_worker",
            "post_worker_consumer",
            BasicConsumeOptions::default(),
            FieldTable::default(),
        )
        .await?;

    Ok(consumer)
}