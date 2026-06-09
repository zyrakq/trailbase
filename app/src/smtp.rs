//! SMTP email intercept setup for development environments.
//!
//! Wraps mailcrab_backend to provide a single setup function that wires the
//! mailcrab router and SMTP listener. Only active when
//! `settings.email.dev_intercept = true`.

use axum::{Router, http::StatusCode, response::Html};
use mailcrab_backend::MailcrabHandle;
use std::net::IpAddr;
use tracing::info;

use crate::settings::EmailSettings;

/// URL prefix where the mailcrab UI is served.
pub const EMAIL_PATH: &str = "/emails";

const SMTP_HOST: &str = "127.0.0.1";
const SMTP_PORT: u16 = 1025;

/// Holds the router and background-task handle for the email interceptor.
pub struct Interceptor {
    pub router: Router,
    pub handle: MailcrabHandle,
}

/// Set up the mailcrab SMTP interceptor if `dev_intercept` is enabled.
///
/// Returns `None` when running in production (`dev_intercept = false`).
///
/// When the mailcrab WASM frontend has not been compiled into the binary
/// (i.e. `vendor/mailcrab/frontend/dist/` was empty at compile time), a
/// fallback handler is attached so that `GET /emails` always returns a
/// helpful page instead of falling through to the SPA.
pub fn setup(settings: &EmailSettings) -> Option<Interceptor> {
    if !settings.dev_intercept {
        return None;
    }

    let smtp_host: IpAddr = SMTP_HOST.parse().expect("valid loopback address");
    let (router, handle) =
        mailcrab_backend::mailcrab_router(EMAIL_PATH, smtp_host, SMTP_PORT);

    // build_router() only registers GET "/" when index.html is embedded.
    // Without a route for "/", a request to /emails would fall through to the
    // SPA fallback, which would then fail on the client side.  Attach a
    // fallback so the browser always gets a non-SPA response.
    let router = if mailcrab_backend::Asset::get("index.html").is_none() {
        router.fallback(frontend_not_built)
    } else {
        router
    };

    info!(
        "Mailcrab email interceptor active at {} (SMTP :{})",
        EMAIL_PATH, SMTP_PORT
    );

    Some(Interceptor { router, handle })
}

/// Placeholder shown when the mailcrab WASM frontend has not been compiled.
async fn frontend_not_built() -> impl axum::response::IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Html(
            "<!DOCTYPE html>\
             <html><head><title>Mailcrab</title></head><body>\
             <h1>Mailcrab — frontend not built</h1>\
             <p>The SMTP interceptor is running, but the web UI was not compiled \
             into this binary.</p>\
             <p>To build it, install \
             <a href=\"https://trunkrs.dev\">Trunk</a> and run:</p>\
             <pre>cd vendor/mailcrab/frontend &amp;&amp; trunk build</pre>\
             <p>Then recompile the server.</p>\
             <p>The raw API is available at \
             <a href=\"/emails/api/messages\">/emails/api/messages</a>.</p>\
             </body></html>",
        ),
    )
}
