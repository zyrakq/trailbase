use actix_web::{get, post, put, delete, HttpResponse, web };
use actix_web_lab::FromRequest;
use serde::{Deserialize, Serialize};
use uuid::Uuid;


use aliri_actix::scope_policy;

use crate::{
    PostFactory,
    Opts,
    claims::CustomClaims,
    queue::LapinProducer,
    from_token::Token,
    request::AccessType,
    command::{
        create_post,
        update_post,
        delete_post,
        DeletePost,
        UpdatePost,
        CreatePost
    }
};



#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}


scope_policy!(Profile / ProfileScope(CustomClaims); "profile");

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub(crate) struct CreatePostPayload {
    pub text: String,
    pub files: Vec<String>,
    pub teaser: String,
    pub preview: String,
    pub access: String
}

#[derive(Debug, FromRequest)]
struct CreatePostRequest {
    payload: web::Json<CreatePostPayload>,
    factory: web::Data<PostFactory>,
    lapin: web::Data<LapinProducer>,
    opts: web::Data<Opts>,
    profile: Profile,
}

impl From<CreatePostRequest> for CreatePost {
    fn from(request: CreatePostRequest) -> Self {
        let payload = request.payload.into_inner();
        let user_id: Uuid = request.profile.claims().sub.as_str().parse().unwrap();

        let access: AccessType = payload.access.into();
        Self { 
            uuid: Uuid::new_v4(), 
            text: payload.text,
            files: payload.files,
            teaser: payload.teaser,
            preview: payload.preview,
            access: access.to_string(),
            created_by: user_id,
            api_url: request.opts.into_inner().site.clone()
        }
    }
}

#[post("/posts")]
async fn create_post_endpoint(request: CreatePostRequest) -> HttpResponse {
    let factory = request.factory.clone();
    let lapin = request.lapin.clone();
    let command_request = request.into();

    match create_post(&factory, &lapin, &command_request).await {
        Ok(_) => {
           
            HttpResponse::Accepted()
            .append_header(("Location", 
                format!("{0}/posts/{1}", &command_request.api_url, &command_request.uuid)))
            .body(command_request.uuid.to_string())
        },

        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}







#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct UpdatePostPayload {
    pub text: Option<String>,
    pub add_files: Vec<String>,
    pub remove_files: Vec<String>,
    pub teaser: Option<String>,
    pub preview: Option<String>,
    pub access: Option<String>
}

#[derive(Debug, FromRequest)]
struct UpdatePostRequest {
    uuid: web::Path<Uuid>,
    payload: web::Json<UpdatePostPayload>,
    factory: web::Data<PostFactory>,
    lapin: web::Data<LapinProducer>,
    opts: web::Data<Opts>,
    profile: Profile,
    token: Token
}

impl From<UpdatePostRequest> for UpdatePost {
    fn from(request: UpdatePostRequest) -> Self {
        let payload = request.payload.into_inner();
        let user_id: Uuid = request.profile.claims().sub.as_str().parse().unwrap();
        let token = request.token.into();
        let access = match payload.access {
            Some(access) => {
                let access: AccessType = access.into();
                Some(access.to_string())
            },
            _ => None
        };
        Self { 
            uuid: request.uuid.into_inner(), 
            text: payload.text,
            add_files: payload.add_files,
            remove_files: payload.remove_files,
            teaser: payload.teaser,
            preview: payload.preview,
            access,
            created_by: user_id,
            api_url: request.opts.into_inner().site.clone(),
            token
        }
    }
}

#[put("/posts/{uuid}")]
async fn update_post_endpoint(request: UpdatePostRequest) -> HttpResponse {
    let factory = request.factory.clone();
    let lapin = request.lapin.clone();
    let command_request = request.into();

    match update_post(&factory, &lapin, &command_request).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}







#[derive(Debug, FromRequest)]
struct DeletePostRequest {
    uuid: web::Path<Uuid>,
    factory: web::Data<PostFactory>,
    lapin: web::Data<LapinProducer>,
    opts: web::Data<Opts>,
    profile: Profile,
    token: Token
}

impl From<DeletePostRequest> for DeletePost {
    fn from(request: DeletePostRequest) -> Self {
        let user_id: Uuid = request.profile.claims().sub.as_str().parse().unwrap();
        let token = request.token.into();
        Self { 
            uuid: request.uuid.into_inner(),
            created_by: user_id,
            api_url: request.opts.into_inner().site.clone(),
            token
        }
    }
}


#[delete("/posts/{uuid}")]
async fn delete_post_endpoint(request: DeletePostRequest) -> HttpResponse {
    let factory = request.factory.clone();
    let lapin = request.lapin.clone();
    let command_request = request.into();

    match delete_post(&factory, &lapin, &command_request).await {
        Ok(_res) => HttpResponse::NoContent().finish(),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}
