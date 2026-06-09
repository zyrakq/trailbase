use actix_web::{get, HttpResponse, web};
use aliri_actix::scope_policy;
use serde::Deserialize;
use sqlx::{Pool, Postgres};

use crate::{
    postgre::{get_user_list, GetUserList},
    Opts
};


#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}

scope_policy!(Profile / ProfileScope; "query-users-scope");

#[derive(Deserialize)]
pub struct GetUserListQueries {
    ids: String,
}

#[get("comments/users")]
pub async fn get_user_list_endpoint(
    pool: web::Data<Pool<Postgres>>,
    opts: web::Data<Opts>,
    query: web::Query<GetUserListQueries>,
    _profile: Profile,
) -> HttpResponse {
    let ids = match serde_json::from_str(&query.ids) {
        Ok(ids) => ids,
        Err(err) => return HttpResponse::BadRequest().body(err.to_string()),
    };

    // let ids = vec![
    //     Uuid::parse_str("24cf84df-434b-4bc8-9a5d-403fc8384f99").unwrap(),
    // ];

    let request = GetUserList { ids, realm: opts.realm.clone() };

    match get_user_list(&pool, &request).await
    {
        Ok(comment) => HttpResponse::Ok().json(comment),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}