use std::collections::HashMap;

use actix_web::{middleware::Logger, App, HttpServer, HttpResponse, get, post, web, delete};
use actix_cors::Cors;

use actix_multipart::{
    form::{
        tempfile::{TempFile, TempFileConfig},
        MultipartForm,
    }
};

use aliri::jwt;
use aliri_actix::scope_policy;
use aliri_clock::UnixTime;
use aliri_extra_reqwest::{AuthClient, auth_client_with_sso_info};
use aliri_keycloak::{FindUserWays, update_user_attributes};
use aliri_oauth2::{Authority, scope};

use dotenv::dotenv;
use clap::Parser;

use serde::Deserialize;

mod file;

use crate::file::{AvatarError, get_filename, save_file, delete_dir};


#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
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


#[derive(Debug, MultipartForm)]
struct UploadForm {
    #[multipart(rename = "file")]
    files: Vec<TempFile>,
}


#[post("/avatar")]
async fn save_avatar(
    MultipartForm(mut form): MultipartForm<UploadForm>,
    client: web::Data<AuthClient>,
    opts: web::Data<Opts>,
    profile: Profile
) -> HttpResponse {
    if form.files.len() > 1 {
        return HttpResponse::BadRequest().body("More than one file transferred");
    }
    if form.files.len() == 0 {
        return HttpResponse::BadRequest().body("The file was not transferred or was transferred incorrectly");
    }

    let sub = profile.claims().sub.clone().take();

    let file = form.files.pop().unwrap();
    let file_name =  get_filename(&file, &sub);

    if let Err(err) = save_file(file, &sub).await {
        return match err.downcast_ref::<AvatarError>() {
            Some(AvatarError::InvalidFileFormat) => HttpResponse::BadRequest().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string())
        }
    } 
    
    let mut updated_attributes = HashMap::new();
    updated_attributes.insert("picture".to_string(), vec![file_name.clone()]);

    match update_user_attributes(&client, &FindUserWays::Sub(sub), updated_attributes).await {
        Ok(()) => {
            let opts = opts.get_ref();
            let site: String = opts.site.clone().into();
            HttpResponse::NoContent()
            .append_header(("Location", 
                format!("{0}/{1}", site, file_name)))
            .finish()
        },
        Err(err) => HttpResponse::InternalServerError().body(err.to_string())
    }
}


#[delete("/avatar")]
async fn delete_avatar(
    client: web::Data<AuthClient>,
    profile: Profile
) -> HttpResponse {

    let sub = profile.claims().sub.clone().take();

    if let Err(err) = delete_dir(&sub) {
        return HttpResponse::InternalServerError().body(err.to_string());
    } 
    
    let mut updated_attributes = HashMap::new();
    updated_attributes.insert("picture".to_string(), vec![]);

    match update_user_attributes(&client, &FindUserWays::Sub(sub), updated_attributes).await {
        Ok(()) => HttpResponse::NoContent().finish(),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string())
    }
}





#[derive(Clone, Debug, Parser)]
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

    let opts = Opts::parse();

    let authority = Authority::new_from_issuer(opts.issuer.to_string(), jwt::CoreValidator::default())
    .await.expect("AUTHORITY didn't create");

    let client = auth_client_with_sso_info().await;

    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();

        App::new()
            .app_data(web::Data::new(opts.clone()))
            .app_data(web::Data::new(client.clone()))
            .app_data(authority.clone())
            .app_data(TempFileConfig::default().directory("/tmp/static"))
            .wrap(Logger::default())
            .wrap(cors)
            .service(
                web::scope("/profile")
                .service(save_avatar)
                .service(delete_avatar)
            )
            
            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}