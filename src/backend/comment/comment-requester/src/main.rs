mod mongodb;
mod endpoint;
mod claims;
mod model;
mod query;
mod reqwest;
mod from_token;

use actix_web::{middleware::Logger, web, App, HttpServer};
use actix_cors::Cors;

use aliri::jwt;
use aliri_oauth2::{Authority};

use dotenv::dotenv;
use clap::Parser;

use endpoint::{get_public_comment_endpoint, get_private_comment_endpoint, healthcheck};

mongodb_macro::collection!(CommentFactory; CommentFactoryOpts);

#[derive(Clone, Debug, clap::Parser)]
pub struct Opts {
    /// post_site
    #[clap(env)]
    pub post_site: String,
    /// issuer
    #[clap(env)]
    pub issuer: jwt::Issuer,
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {


    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("warn"));

    let factory = CommentFactory::parse();

    let mut opts = Opts::parse();

    opts.post_site = mongodb_macro::env_expand(&opts.post_site);

    let authority = Authority::new_from_issuer(opts.issuer.to_string(), jwt::CoreValidator::default())
    .await.expect("AUTHORITY didn't create");


    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();

        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(opts.clone()))
            .app_data(web::Data::new(factory.clone()))
            .app_data(authority.clone())
            .wrap(cors)
            .service(get_public_comment_endpoint)
            .service(get_private_comment_endpoint)
            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}