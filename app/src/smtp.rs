//! SMTP email intercept setup for development environments.
//!
//! Wraps mailcrab_server to provide a single setup function that wires the
//! mailcrab router and SMTP listener. Only active when
//! `settings.email.dev_intercept = true`.

use axum::{Router, http::StatusCode, response::Html};
use mailcrab_server::MailcrabHandle;
use tracing::info;

use crate::settings::EmailSettings;

/// Holds the router and background-task handle for the email interceptor.
pub struct Interceptor {
    path: String,
    router: Router,
    handle: MailcrabHandle,
}

/// Set up the mailcrab SMTP interceptor if `dev_intercept` is enabled.
///
/// Returns `None` when running in production (`dev_intercept = false`).
///
/// When the mailcrab WASM frontend has not been compiled into the binary
/// (i.e. `vendor/mailcrab/frontend/dist/` was empty at compile time), a
/// fallback handler is attached so that requests to the email path always
/// return a helpful page instead of falling through to the SPA.
pub fn setup(settings: &EmailSettings) -> Option<Interceptor> {
    if !settings.dev_intercept {
        return None;
    }

    let smtp_host = settings
        .smtp_host
        .parse()
        .unwrap_or_else(|_| panic!("invalid email.smtp_host: {}", settings.smtp_host));

    let (router, handle) =
        mailcrab_server::mailcrab_router(&settings.path, smtp_host, settings.smtp_port);

    // build_router() only registers GET "/" when index.html is embedded.
    // If the WASM frontend was not compiled into the binary, attach a fallback
    // so the browser always gets a useful response instead of a 404.
    let router = if mailcrab_server::Asset::get("index.html").is_none() {
        router.fallback(frontend_not_built)
    } else {
        router
    };

    info!(
        "Mailcrab email interceptor active at {} (SMTP :{})",
        settings.path, settings.smtp_port
    );

    Some(Interceptor {
        path: settings.path.clone(),
        router,
        handle,
    })
}

/// Nest the mailcrab router into `app_router` at the configured path.
///
/// Returns the combined router and an optional shutdown handle.
/// When `interceptor` is `None` (production), the router is returned unchanged.
pub fn mount(
    interceptor: Option<Interceptor>,
    app_router: Router,
) -> (Router, Option<MailcrabHandle>) {
    match interceptor {
        None => (app_router, None),
        Some(ic) => {
            let router = Router::new().nest(&ic.path, ic.router).merge(app_router);
            (router, Some(ic.handle))
        }
    }
}

/// Cancel mailcrab background tasks.
///
/// Call this after the HTTP server has shut down.
/// Does nothing when `handle` is `None`.
pub fn shutdown(handle: Option<MailcrabHandle>) {
    if let Some(h) = handle {
        h.token.cancel();
    }
}

/// Placeholder shown when the mailcrab WASM frontend has not been compiled.
async fn frontend_not_built() -> impl axum::response::IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Html(
            "<!DOCTYPE html>\
             <html><head><title>Mailcrab</title></head><body>\
             <h1>Mailcrab \u{2014} frontend not built</h1>\
             <p>The SMTP interceptor is running, but the web UI was not compiled \
             into this binary.</p>\
             <p>To build it, install \
             <a href=\"https://trunkrs.dev\">Trunk</a> and run:</p>\
             <pre>cd vendor/mailcrab/frontend &amp;&amp; trunk build --release</pre>\
             <p>Then recompile the server.</p>\
             </body></html>",
        ),
    )
}
