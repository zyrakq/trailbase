#![forbid(unsafe_code, clippy::unwrap_used)]
#![allow(clippy::needless_return)]

use trailbase_wasm::http::HttpRoute;
use trailbase_wasm::job::Job;
use trailbase_wasm::{Guest, export};

mod activate;

struct Endpoints;

impl Guest for Endpoints {
    fn http_handlers() -> Vec<HttpRoute> {
        return vec![];
    }

    fn job_handlers() -> Vec<Job> {
        return vec![Job::minutely("activate-subscriptions", activate::run)];
    }
}

export!(Endpoints);
