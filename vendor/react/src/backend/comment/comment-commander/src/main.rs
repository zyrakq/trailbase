mod endpoint;
mod command;
mod query;
mod event;
mod claims;
mod queue;
mod from_token;

use actix_web::{middleware::Logger, web, App, HttpServer};
use actix_cors::Cors;

use aliri::jwt;
use aliri_oauth2::Authority;

use dotenv::dotenv;

use clap::Parser;


use endpoint::{
    create_comment_endpoint,
    update_comment_endpoint,
    delete_comment_endpoint,
    healthcheck
};
use queue::create_queue;

mongodb_macro::collection!(CommentFactory; CommentFactoryOpts);

#[derive(Clone, Debug, clap::Parser)]
pub struct Opts {
    /// site
    #[clap(env)]
    pub site: String,

    /// issuer
    #[clap(env)]
    pub issuer: jwt::Issuer,
}



#[actix_web::main]
async fn main() -> std::io::Result<()> {

    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let lapin = create_queue().await.expect("lapin didn't create");

    let factory = CommentFactory::parse();

    let mut opts = Opts::parse();

    opts.site = mongodb_macro::env_expand(&opts.site);

    let validator = jwt::CoreValidator::default()
    .ignore_expiration()
    .ignore_not_before();

    let authority = Authority::new_from_issuer(opts.issuer.to_string(), validator)
    .await.expect("AUTHORITY didn't create");


    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();
        
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(opts.clone()))
            .app_data(web::Data::new(lapin.clone()))
            .app_data(web::Data::new(factory.clone()))
            .app_data(authority.clone())
            .wrap(cors)
            .service(create_comment_endpoint)
            .service(update_comment_endpoint)
            .service(delete_comment_endpoint)

            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}