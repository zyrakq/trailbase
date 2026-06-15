use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct EmailSettings {
    /// When true, start the mailcrab SMTP interceptor and serve its UI under `path`.
    /// Should only be true in development environments.
    pub dev_intercept: bool,
    /// URL prefix under which the mailcrab UI and API are served.
    pub path: String,
    /// IP address the SMTP listener binds to.
    pub smtp_host: String,
    /// Port the SMTP listener binds to.
    pub smtp_port: u16,
}
