use aliri::jwt;
use aliri_oauth2::scope;
use aliri_clock::UnixTime;

use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub struct CustomClaims {
    //pub token: jwt::Jwt,
    pub iss: jwt::Issuer,
    pub aud: jwt::Audiences,
    pub sub: jwt::Subject,
    pub exp: Option<UnixTime>,
    pub nbf: Option<UnixTime>,
    pub scope: scope::Scope,
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