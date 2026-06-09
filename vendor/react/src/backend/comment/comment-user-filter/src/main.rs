mod postgre;
mod endpoint;
mod model;

use actix_web::{middleware::Logger, web, App, HttpServer};
use actix_cors::Cors;

use aliri::jwt;
use aliri_oauth2::{Authority};

use dotenv::dotenv;
use clap::Parser;
use nested_env_parser::Env;

use endpoint::{get_user_list_endpoint, healthcheck};
use sqlx::postgres::PgPool;


#[derive(Clone, Debug, clap::Parser)]
pub struct Opts {
    /// Realm
    #[clap(env)]
    pub realm: String,
    /// Database url
    #[clap(env)]
    pub db_url: Env,
    /// issuer
    #[clap(env)]
    pub issuer: jwt::Issuer,
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {


    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("warn"));

    let opts = Opts::parse();

    let authority = Authority::new_from_issuer(opts.issuer.to_string(), jwt::CoreValidator::default())
    .await.expect("AUTHORITY didn't create");

    let pool = PgPool::connect(&opts.db_url)
    .await.expect("PgPool didn't create");


    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();

        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(opts.clone()))
            .app_data(web::Data::new(pool.clone()))
            .app_data(authority.clone())
            .wrap(cors)
            .service(get_user_list_endpoint)
            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}