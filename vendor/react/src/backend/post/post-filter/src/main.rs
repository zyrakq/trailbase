mod endpoint;
mod query;
mod claims;
mod model;
mod mongodb;
mod reqwest;


use actix_web::{middleware::Logger, App, HttpServer, web};
use actix_cors::Cors;
use dotenv::dotenv;
use clap::Parser;

use aliri::jwt;
use aliri_oauth2::{Authority};
use endpoint::{
    get_public_post_list_endpoint,
    get_private_post_list_endpoint,
    healthcheck
};

mongodb_macro::collection!(PostFactory; PostFactoryOpts);

#[derive(Clone, Debug, clap::Parser)]
pub struct Opts {
    /// issuer
    #[clap(env)]
    pub issuer: jwt::Issuer,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let factory = PostFactory::parse();

    let opts = Opts::parse();

    let authority = Authority::new_from_issuer(opts.issuer.to_string(), jwt::CoreValidator::default())
    .await.expect("AUTHORITY didn't create");

    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();

        App::new()
            .app_data(web::Data::new(factory.clone()))
            .app_data(authority.clone())
            .wrap(Logger::default())
            .wrap(cors)
            .service(get_public_post_list_endpoint)
            .service(get_private_post_list_endpoint)
            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
