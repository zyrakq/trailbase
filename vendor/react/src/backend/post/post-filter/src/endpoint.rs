
use actix_web::{get, HttpResponse, web};

use serde::Deserialize;
use uuid::Uuid;

use aliri_actix::scope_policy;

use crate::{
    PostFactory,
    claims::CustomClaims,
    query::{GetPostList, get_post_list}
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
pub struct GetPostListInfo {
    sub: Uuid,
    #[serde(default = "default_offset")]
    offset: u64,
    #[serde(default = "default_count")]
    count: i64,
}

impl From<GetPostListInfo> for GetPostList {
    fn from(request: GetPostListInfo) -> Self {
        Self {
            sub: request.sub,
            offset: request.offset,
            count: request.count
        }
    }
}


#[get("/public/posts")]
pub async fn get_public_post_list_endpoint(
    factory: web::Data<PostFactory>,
    req: web::Query<GetPostListInfo>
) -> HttpResponse {
    let req = req.into_inner();

    match get_post_list(&factory, &req.into(), None).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

#[get("/private/posts")]
pub async fn get_private_post_list_endpoint(
    factory: web::Data<PostFactory>,
    profile: Profile,
    req: web::Query<GetPostListInfo>
) -> HttpResponse {
    let req = req.into_inner();
    let sub = profile.claims().sub.as_str().parse().ok();


    match get_post_list(&factory, &req.into(), sub).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}