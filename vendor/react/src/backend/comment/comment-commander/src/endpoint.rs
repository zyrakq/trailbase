use actix_web::{get, post, put, delete, HttpResponse, web };
use actix_web_lab::FromRequest;
use serde::{Deserialize, Serialize};
use uuid::Uuid;


use aliri_actix::scope_policy;

use crate::{
    CommentFactory,
    Opts,
    claims::CustomClaims,
    queue::LapinProducer,
    from_token::Token,
    command::{
        create_comment,
        update_comment,
        delete_comment,
        DeleteComment,
        UpdateComment,
        CreateComment
    }
};



#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}


scope_policy!(Profile / ProfileScope(CustomClaims); "profile");

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub(crate) struct CreateCommentPayload {
    pub text: String,
    pub files: Vec<String>,
    pub post_uuid: Uuid,
    pub reply_uuid: Option<Uuid>,
    pub parent_uuid: Option<Uuid>,
}

#[derive(Debug, FromRequest)]
struct CreateCommentRequest {
    payload: web::Json<CreateCommentPayload>,
    factory: web::Data<CommentFactory>,
    lapin: web::Data<LapinProducer>,
    profile: Profile,
}

impl From<CreateCommentRequest> for CreateComment {
    fn from(request: CreateCommentRequest) -> Self {
        let payload = request.payload.into_inner();
        let user_id: Uuid = request.profile.claims().sub.as_str().parse().unwrap();
        Self { 
            uuid: Uuid::new_v4(), 
            text: payload.text,
            files: payload.files,
            post_uuid: payload.post_uuid,
            reply_uuid: payload.reply_uuid,
            parent_uuid: payload.parent_uuid,
            created_by: user_id
        }
    }
}

#[post("/comments")]
async fn create_comment_endpoint(request: CreateCommentRequest) -> HttpResponse {
    let factory = request.factory.clone();
    let lapin = request.lapin.clone();
    let command_request = request.into();

    match create_comment(&factory, &lapin, &command_request).await {
        Ok(_) => {
           
            HttpResponse::Accepted()
            .body(command_request.uuid.to_string())
        },

        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}







#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct UpdateCommentPayload {
    pub text: Option<String>,
    pub add_files: Vec<String>,
    pub remove_files: Vec<String>,
}

#[derive(Debug, FromRequest)]
struct UpdateCommentRequest {
    uuid: web::Path<Uuid>,
    payload: web::Json<UpdateCommentPayload>,
    factory: web::Data<CommentFactory>,
    lapin: web::Data<LapinProducer>,
    opts: web::Data<Opts>,
    profile: Profile,
    token: Token
}

impl From<UpdateCommentRequest> for UpdateComment {
    fn from(request: UpdateCommentRequest) -> Self {
        let payload = request.payload.into_inner();
        let user_id: Uuid = request.profile.claims().sub.as_str().parse().unwrap();
        let token = request.token.into();

        Self { 
            uuid: request.uuid.into_inner(), 
            text: payload.text,
            add_files: payload.add_files,
            remove_files: payload.remove_files,
            created_by: user_id,
            api_url: request.opts.into_inner().site.clone(),
            token
        }
    }
}

#[put("/comments/{uuid}")]
async fn update_comment_endpoint(request: UpdateCommentRequest) -> HttpResponse {
    let factory = request.factory.clone();
    let lapin = request.lapin.clone();
    let command_request = request.into();

    match update_comment(&factory, &lapin, &command_request).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}







#[derive(Debug, FromRequest)]
struct DeleteCommentRequest {
    uuid: web::Path<Uuid>,
    factory: web::Data<CommentFactory>,
    lapin: web::Data<LapinProducer>,
    opts: web::Data<Opts>,
    profile: Profile,
    token: Token
}

impl From<DeleteCommentRequest> for DeleteComment {
    fn from(request: DeleteCommentRequest) -> Self {
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


#[delete("/comments/{uuid}")]
async fn delete_comment_endpoint(request: DeleteCommentRequest) -> HttpResponse {
    let factory = request.factory.clone();
    let lapin = request.lapin.clone();
    let command_request = request.into();

    match delete_comment(&factory, &lapin, &command_request).await {
        Ok(_res) => HttpResponse::NoContent().finish(),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}
