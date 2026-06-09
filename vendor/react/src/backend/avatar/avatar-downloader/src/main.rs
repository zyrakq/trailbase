use actix_web::{middleware::Logger, App, HttpServer, get, HttpResponse, HttpRequest};
use actix_cors::Cors;



use dotenv::dotenv;


use actix_files::{NamedFile};
use std::{path::Path, io};

#[get("/healthcheck")]
async fn healthcheck() -> HttpResponse {
    HttpResponse::Ok().body("I'm alive!")
}


#[get("/{sub}/{filename:[^/]+\\.(jpe?g|png)}")]
async fn index(req: HttpRequest) -> io::Result<NamedFile> {
    let sub = req.match_info().query("sub");
    let file_name = req.match_info().query("filename");
    let str_path = format!("/tmp/static/{}/{}", sub, file_name);
    //let str_path = format!("./static/{}", file_name);
    let path = Path::new(&str_path);
    Ok(NamedFile::open(path)?)
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {

    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("warn"));


    HttpServer::new(move || {
        let cors = Cors::default().allow_any_origin().allow_any_header().allow_any_method().supports_credentials();

        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .service(index)
            .service(healthcheck)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}