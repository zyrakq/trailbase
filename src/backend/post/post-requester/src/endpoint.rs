use actix_web::{get, HttpResponse, web};
use aliri_actix::scope_policy;
use uuid::Uuid;
use crate::{query::get_post_view, PostFactory, claims::CustomClaims, model::PostError};


#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}

#[get("/public/posts/{uuid}")]
pub async fn get_public_post_endpoint(
    factory: web::Data<PostFactory>,
    uuid: web::Path<Uuid>
) -> HttpResponse {
    let uuid = uuid.into_inner();

    match get_post_view(&factory, &uuid.into(), None).await
    {
        Ok(post) => HttpResponse::Ok().json(post),
        Err(err) => match err.downcast_ref::<PostError>() {
            Some(PostError::NotFound(_)) => HttpResponse::NotFound().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string()),
        }
    }
}

scope_policy!(Profile / ProfileScope(CustomClaims); "openid", "profile");

#[get("/private/posts/{uuid}")]
pub async fn get_private_post_endpoint(
    factory: web::Data<PostFactory>,
    profile: Profile,
    uuid: web::Path<Uuid>
) -> HttpResponse {
    let uuid = uuid.into_inner();
    let sub = profile.claims().sub.as_str().parse().ok();

    match get_post_view(&factory, &uuid.into(), sub).await
    {
        Ok(post) => HttpResponse::Ok().json(post),
        Err(err) => match err.downcast_ref::<PostError>() {
            Some(PostError::NotFound(_)) => HttpResponse::NotFound().body(err.to_string()),
            _ => HttpResponse::InternalServerError().body(err.to_string()),
        }
    }
}