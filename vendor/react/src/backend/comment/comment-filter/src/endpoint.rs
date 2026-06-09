
use actix_web::{get, HttpResponse, web};

use aliri_extra_reqwest::AuthClient;
use serde::Deserialize;
use uuid::Uuid;

use aliri_actix::scope_policy;

use crate::{
    CommentFactory,
    claims::CustomClaims,
    query::{GetCommentList, get_comment_list, ClientInfo}, Opts, from_token::Token, model::CommentError
};


#[get("/healthcheck")]
pub async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}


scope_policy!(Profile / ProfileScope(CustomClaims); "openid", "profile");

fn default_offset() -> u64 {
    0
}

fn default_count() -> i64 {
    15
}

#[derive(Deserialize)]
pub struct GetCommentListInfo {
    post_uuid: Uuid,
    #[serde(default = "default_offset")]
    offset: u64,
    #[serde(default = "default_count")]
    count: i64,
}

impl From<GetCommentListInfo> for GetCommentList {
    fn from(request: GetCommentListInfo) -> Self {
        Self {
            post_uuid: request.post_uuid,
            offset: request.offset,
            count: request.count
        }
    }
}


#[get("/public/comments")]
pub async fn get_public_comment_list_endpoint(
    factory: web::Data<CommentFactory>,
    client: web::Data<AuthClient>, 
    opts: web::Data<Opts>,
    req: web::Query<GetCommentListInfo>
) -> HttpResponse {
    let req = req.into_inner();

    let client_info = ClientInfo {
        api_url: opts.post_site.clone(),
        token: None
    };

    match get_comment_list(&client, &factory, &req.into(), &client_info).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(err) => match err.downcast_ref::<CommentError>() {
            Some(CommentError::PostNotFound(_)) => HttpResponse::NotFound().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string()),
        }
    }
}

#[get("/private/comments")]
pub async fn get_private_comment_list_endpoint(
    factory: web::Data<CommentFactory>,
    client: web::Data<AuthClient>, 
    opts: web::Data<Opts>,
    req: web::Query<GetCommentListInfo>,
    _profile: Profile,
    token: Token,
) -> HttpResponse {
    let req = req.into_inner();

    let client_info = ClientInfo {
        api_url: opts.post_site.clone(),
        token: Some(token.into())
    };


    match get_comment_list(&client, &factory, &req.into(), &client_info).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(err) => match err.downcast_ref::<CommentError>() {
            Some(CommentError::Forbidden(_)) => HttpResponse::Forbidden().body(err.to_string()),
            Some(CommentError::PostNotFound(_)) => HttpResponse::NotFound().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string()),
        }
    }
}