use actix_web::{FromRequest, Error, HttpRequest, dev::Payload, error};
use futures::future::{Ready, ok, err};


#[derive(Clone, Debug)]
pub struct Token(String);

impl From<Token> for String {
    fn from(token: Token) -> Self {
        token.0.clone()
    }
}

impl FromRequest for Token {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        // Извлечение заголовка "Authorization" из HTTP-запроса
        if let Some(authorization_header) = req.headers().get("Authorization") {
            // Извлечение значения токена из заголовка
            if let Ok(authorization_str) = authorization_header.to_str() {
                // Парсинг токена из строки заголовка
                let token = authorization_str.trim_start_matches("Bearer ").to_string();

                // Возвращаем успешный результат с извлеченным токеном
                return ok(Token(token));
            }
        }

        err(error::ErrorUnauthorized("Unauthorized"))
    }
}