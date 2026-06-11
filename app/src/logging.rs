use pretty_env_logger::{env_logger::Env, formatted_builder};

const DEFAULT_FILTER: &str = "info,trailbase_refinery=warn,tracing::span=warn,swc_ecma_codegen=off";

pub fn init() {
    let env = Env::new().filter_or("RUST_LOG", DEFAULT_FILTER.to_string());

    formatted_builder().parse_env(env).init()
}
