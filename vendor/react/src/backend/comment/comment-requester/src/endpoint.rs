use actix_web::{get, HttpResponse, web};
use aliri_actix::scope_policy;
use uuid::Uuid;
use crate::{query::{get_comment_view, ClientInfo}, CommentFactory, claims::CustomClaims, Opts, from_token::Token, model::CommentError};


#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}

#[get("/public/comments/{uuid}")]
pub async fn get_public_comment_endpoint(
    factory: web::Data<CommentFactory>,
    opts: web::Data<Opts>,
    uuid: web::Path<Uuid>
) -> HttpResponse {
    let uuid = uuid.into_inner();

    let client_info = ClientInfo {
        api_url: opts.post_site.clone(),
        token: None
    };

    match get_comment_view(&factory, &uuid.into(), &client_info).await
    {
        Ok(comment) => HttpResponse::Ok().json(comment),
        Err(err) => match err.downcast_ref::<CommentError>() {
            Some(CommentError::NotFound(_) | CommentError::PostNotFound(_)) => HttpResponse::NotFound().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string()),
        }
    }
}

scope_policy!(Profile / ProfileScope(CustomClaims); "openid", "profile");

#[get("/private/comments/{uuid}")]
pub async fn get_private_comment_endpoint(
    factory: web::Data<CommentFactory>,
    opts: web::Data<Opts>,
    uuid: web::Path<Uuid>,
    _profile: Profile,
    token: Token,
) -> HttpResponse {
    let uuid = uuid.into_inner();

    let client_info = ClientInfo {
        api_url: opts.post_site.clone(),
        token: Some(token.into())
    };

    match get_comment_view(&factory, &uuid.into(), &client_info).await
    {
        Ok(comment) => HttpResponse::Ok().json(comment),
        Err(err) => match err.downcast_ref::<CommentError>() {
            Some(CommentError::Forbidden(_)) => HttpResponse::Forbidden().body(err.to_string()),
            Some(CommentError::NotFound(_) | CommentError::PostNotFound(_)) => HttpResponse::NotFound().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string()),
        }
         
    }
}