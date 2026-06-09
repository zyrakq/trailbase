use std::collections::HashMap;

use actix_web::{middleware::Logger, App, HttpServer, HttpResponse, get, web, put};
use actix_cors::Cors;


use aliri::jwt;
use aliri_actix::{scope_policy};
use aliri_clock::{UnixTime};
use aliri_oauth2::{Authority, scope};



use dotenv::dotenv;
use clap::Parser;

use serde_json::json;
use serde::Deserialize;

use aliri_extra_reqwest::{AuthClient, auth_client_with_sso_info};
use aliri_keycloak::{FindUserWays, get_user_attributes, update_user_attributes};


#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}

#[get("/{username}")]
async fn get_author(client: web::Data<AuthClient>, username: web::Path<String>) -> HttpResponse {
    match get_user_attributes(&client, &FindUserWays::Username(username.into_inner())).await {
        Ok(user) => {
            let is_author = user.attributes["is_author"][0] == "true";
            let picture = user.attributes["picture"][0].as_str();

            HttpResponse::Ok().json(json!({
                "sub": user.sub.to_string(),
                "is_author": is_author,
                "picture": picture
            }))
        }
        Err(err) => {
            HttpResponse::InternalServerError().body(err.to_string())
        }
    } 
}

#[derive(Clone, Debug, Deserialize)]
pub struct CustomClaims {
    iss: jwt::Issuer,
    aud: jwt::Audiences,
    sub: jwt::Subject,
    exp: Option<UnixTime>,
    nbf: Option<UnixTime>,
    scope: scope::Scope,
}

impl jwt::CoreClaims for CustomClaims {
    fn nbf(&self) -> Option<UnixTime> { self.nbf }
    fn exp(&self) -> Option<UnixTime> { self.exp }
    fn aud(&self) -> &jwt::Audiences { &self.aud }
    fn iss(&self) -> Option<&jwt::IssuerRef> { Some(&self.iss) }
    fn sub(&self) -> Option<&jwt::SubjectRef> { Some(&self.sub) }
}

impl scope::HasScope for CustomClaims {
    fn scope(&self) -> &scope::Scope { &self.scope }
}


scope_policy!(Profile / ProfileScope(CustomClaims); "openid", "profile");

#[put("/became_author")]
async fn became_author(client: web::Data<AuthClient>, profile: Profile) -> HttpResponse {
    let sub = profile.claims().sub.clone().take();
    let mut updated_attributes = HashMap::new();
    updated_attributes.insert("is_author".to_string(), vec![ "true".to_string() ]);

    match update_user_attributes(&client, &FindUserWays::Sub(sub), updated_attributes).await {
        Ok(_) => {
            HttpResponse::NoContent().finish()
        }
        Err(err) => {
            HttpResponse::InternalServerError().body(err.to_string())
        }
    }
}


#[derive(Clone, Debug, Parser)]
struct Opts {
    /// issuer
    #[clap(env)]
    issuer: jwt::Issuer,
}



#[actix_web::main]
async fn main() -> std::io::Result<()> {

    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let opts = Opts::parse();

    let authority = Authority::new_from_issuer(opts.issuer.to_string(), jwt::CoreValidator::default())
    .await.expect("AUTHORITY didn't create");

    let client = auth_client_with_sso_info().await.expect("AuthClient didn't create");

    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();

        App::new()
            .app_data(web::Data::new(opts.clone()))
            .app_data(web::Data::new(client.clone()))
            .app_data(authority.clone())
            .wrap(Logger::default())
            .wrap(cors)
            .service(
                web::scope("/profile")
                .service(get_author)
                .service(became_author)
            )
            
            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}