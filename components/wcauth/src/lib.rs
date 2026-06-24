#![forbid(unsafe_code, clippy::unwrap_used)]
#![allow(clippy::needless_return)]

use rust_embed::RustEmbed;
use trailbase_wasm::http::{
    Html, HttpError, HttpRoute, IntoBody, IntoResponse, Json, Method, Request, Response,
    StatusCode, header, routing,
};
use trailbase_wasm::{Guest, export};

mod config;
mod db_kv;
mod error;
mod i18n;
mod password;
mod profile;
mod set_password;
mod settings;

use config::{KV_RESET_PASSWORD_URL, WcAuthConfig, read_reset_password_url};
use error::{bad_request, internal};
use i18n::{
    I18nEditorResponse, I18nEntry, delete_override, load_default_xliff, merge_entries, parse_xliff,
    parse_xliff_sources, read_override, serialize_js_module, write_override,
};
use profile::profile_capabilities_handler;
use set_password::set_password_handler;
use settings::settings_page;

#[derive(RustEmbed)]
#[folder = "ui/dist/"]
pub(crate) struct Assets;

#[derive(serde::Serialize)]
struct WasmManifest {
    display_name: String,
    icon: Option<String>,
    config_path: Option<String>,
    description: Option<String>,
}

struct Endpoints;

impl Guest for Endpoints {
    fn http_handlers() -> Vec<HttpRoute> {
        return vec![
            // Manifest — probed by the host at startup to discover the module's
            // display name, icon, and config link for the admin WASM Modules section.
            routing::get(
                "/_/wasm/wcauth/manifest",
                async |_req: Request| -> Result<Response, HttpError> {
                    return Ok(Json(WasmManifest {
                        display_name: "WcAuth".to_string(),
                        icon: Some(
                            "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" \
                             fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" \
                             stroke-linecap=\"round\" stroke-linejoin=\"round\">\
                             <path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 \
                             18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 \
                             1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>\
                             <path d=\"m9 12 2 2 4-4\"/></svg>"
                                .to_string(),
                        ),
                        config_path: Some("/_/wasm/wcauth/settings".to_string()),
                        description: Some(
                            "Authentication module: login, registration, password reset, \
                             MFA, and i18n management."
                                .to_string(),
                        ),
                    })
                    .into_response());
                },
            ),
            // Settings page — HTML wrapper that loads the bundle and mounts
            // <wcauth-settings>. Linked from the admin WASM Modules section
            // via the manifest's config_path. No admin guard on the page itself;
            // the component's API calls are admin-guarded.
            routing::get(
                "/_/wasm/wcauth/settings",
                async |_req: Request| -> Result<Response, HttpError> {
                    return Ok(Html(settings_page()).into_response());
                },
            ),
            // Admin config — read current wcauth settings.
            routing::get(
                "/_/wasm/wcauth/config",
                async |_req: Request| -> Result<Response, HttpError> {
                    let reset_password_redirect_url = read_reset_password_url()?;
                    return Ok(Json(WcAuthConfig {
                        reset_password_redirect_url,
                    })
                    .into_response());
                },
            )
            .require_admin(),
            // Admin config — update wcauth settings.
            routing::post(
                "/_/wasm/wcauth/config",
                async |mut req: Request| -> Result<Response, HttpError> {
                    let body = req.body().bytes().await.map_err(internal)?;
                    let config: WcAuthConfig =
                        serde_json::from_slice(&body).map_err(bad_request)?;

                    if config.reset_password_redirect_url.is_empty() {
                        return Err(bad_request("reset_password_redirect_url must not be empty"));
                    }

                    db_kv::kv_set(
                        KV_RESET_PASSWORD_URL,
                        config.reset_password_redirect_url.as_bytes(),
                    )?;

                    return Ok(Json(config).into_response());
                },
            )
            .require_admin(),
            // Admin i18n — read default XLIFF entries + override for the editor.
            // Returns JSON { default: [{id, value}], override: [{id, value}] }.
            routing::get(
                "/_/wasm/wcauth/i18n/{locale}",
                async |req: Request| -> Result<Response, HttpError> {
                    let locale = req
                        .path_param("locale")
                        .ok_or_else(|| internal("missing locale"))?;

                    // English is the source language; its text lives in <source>
                    // elements of the other locales' XLIFF files. Use the first
                    // available XLIFF to populate the read-only editor view.
                    let default_entries = if locale == "en" {
                        Assets::iter()
                            .filter(|name| name.starts_with("xliff/") && name.ends_with(".xlf"))
                            .find_map(|name| {
                                Assets::get(name.as_ref()).and_then(|f| {
                                    let xml = String::from_utf8_lossy(&f.data).into_owned();
                                    parse_xliff_sources(&xml).ok()
                                })
                            })
                            .unwrap_or_default()
                    } else {
                        match load_default_xliff(locale) {
                            Some(xml) => parse_xliff(&xml).map_err(internal)?,
                            None => Vec::new(),
                        }
                    };

                    let override_entries = read_override(locale)?.unwrap_or_default();

                    return Ok(Json(I18nEditorResponse {
                        default: default_entries
                            .into_iter()
                            .map(|(id, value)| I18nEntry { id, value })
                            .collect(),
                        override_: override_entries
                            .into_iter()
                            .map(|(id, value)| I18nEntry { id, value })
                            .collect(),
                    })
                    .into_response());
                },
            )
            .require_admin(),
            // Admin i18n — replace the per-locale override stored in KV.
            // Accepts JSON [{id, value}]. No PUT helper in routing, so use
            // HttpRoute::new directly.
            HttpRoute::new(
                Method::PUT,
                "/_/wasm/wcauth/i18n/{locale}",
                async |mut req: Request| -> Result<Response, HttpError> {
                    let body = req.body().bytes().await.map_err(internal)?;
                    let entries: Vec<I18nEntry> =
                        serde_json::from_slice(&body).map_err(bad_request)?;

                    let locale = req
                        .path_param("locale")
                        .ok_or_else(|| internal("missing locale"))?
                        .to_string();

                    let pairs: Vec<(String, String)> =
                        entries.into_iter().map(|e| (e.id, e.value)).collect();
                    write_override(&locale, &pairs)?;

                    return Response::builder()
                        .status(StatusCode::OK)
                        .body(b"".into_body())
                        .map_err(internal);
                },
            )
            .require_admin(),
            // Admin i18n — drop the per-locale override from KV.
            routing::delete(
                "/_/wasm/wcauth/i18n/{locale}",
                async |req: Request| -> Result<Response, HttpError> {
                    let locale = req
                        .path_param("locale")
                        .ok_or_else(|| internal("missing locale"))?;

                    delete_override(locale)?;

                    return Response::builder()
                        .status(StatusCode::OK)
                        .body(b"".into_body())
                        .map_err(internal);
                },
            )
            .require_admin(),
            // Serve the compiled JS bundle with ETag-based cache validation.
            // Cache-Control: no-cache means the browser always revalidates.
            routing::get(
                "/_/auth/bundle.js",
                async |req: Request| -> Result<Response, HttpError> {
                    let file = Assets::get("bundle.iife.js")
                        .ok_or_else(|| internal("bundle.iife.js not found in embedded assets"))?;

                    let etag = {
                        let hash = file.metadata.sha256_hash();
                        let hex: String = hash.iter().map(|b| format!("{b:02x}")).collect();
                        format!("\"{hex}\"")
                    };

                    if req.header("if-none-match").and_then(|v| v.to_str().ok()) == Some(&etag) {
                        return Response::builder()
                            .status(StatusCode::NOT_MODIFIED)
                            .body(b"".into_body())
                            .map_err(internal);
                    }

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "no-cache")
                        .header(
                            header::CONTENT_TYPE,
                            "application/javascript; charset=utf-8",
                        )
                        .header(header::ETAG, etag)
                        .body(file.data.into_body())
                        .map_err(internal);
                },
            ),
            // Profile capabilities endpoint — required by the Velora host app
            // to determine whether to show the OTP/change-password sections.
            routing::get(
                "/api/auth/v1/profile",
                async |req: Request| -> Result<Response, HttpError> {
                    let user = req
                        .user()
                        .ok_or_else(|| HttpError::status(StatusCode::UNAUTHORIZED))?;
                    return profile_capabilities_handler(user).await;
                },
            ),
            routing::post(
                "/api/auth/v1/set_password",
                async |mut req: Request| -> Result<Response, HttpError> {
                    let body = req.body().bytes().await.map_err(internal)?;
                    let user = req
                        .user()
                        .ok_or_else(|| HttpError::status(StatusCode::UNAUTHORIZED))?;
                    return set_password_handler(user, body.to_vec()).await;
                },
            ),
            // Reset-password email links — 303 redirect to the host app page.
            // The redirect URL is stored in KV with {token} as a placeholder.
            routing::get(
                "/_/auth/reset_password/update/{password_reset_token}",
                async |req: Request| -> Result<Response, HttpError> {
                    let token = req
                        .path_param("password_reset_token")
                        .ok_or_else(|| internal("missing password_reset_token"))?;

                    let url_template = read_reset_password_url()?;
                    let location = url_template.replace("{token}", token);

                    return Response::builder()
                        .status(StatusCode::SEE_OTHER)
                        .header(header::LOCATION, location)
                        .body(b"".into_body())
                        .map_err(internal);
                },
            ),
            // i18n — serve the embedded default XLIFF for a given locale.
            // Used by the UI bundle to load translations at runtime.
            routing::get(
                "/_/auth/i18n/{locale}",
                async |req: Request| -> Result<Response, HttpError> {
                    let locale = req
                        .path_param("locale")
                        .ok_or_else(|| internal("missing locale"))?;

                    let xml = load_default_xliff(locale)
                        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "no-cache")
                        .header(header::CONTENT_TYPE, "application/xml; charset=utf-8")
                        .body(xml.into_body())
                        .map_err(internal);
                },
            ),
            // i18n — serve a JavaScript module for the requested locale.
            // A stored override takes precedence; otherwise the module embedded
            // at build time is served. Returns 404 when neither is available.
            routing::get(
                "/_/auth/locales/{locale}",
                async |req: Request| -> Result<Response, HttpError> {
                    let locale = req
                        .path_param("locale")
                        .ok_or_else(|| internal("missing locale"))?;

                    if let Some(overrides) = read_override(locale)? {
                        // Merge the override entries with the locale's default
                        // translations so non-overridden strings keep their
                        // locale default instead of falling back to English.
                        let defaults = match load_default_xliff(locale) {
                            Some(xml) => parse_xliff(&xml).unwrap_or_default(),
                            None => Vec::new(),
                        };
                        let merged = merge_entries(&defaults, &overrides);
                        let js = serialize_js_module(&merged);
                        return Response::builder()
                            .header(header::CACHE_CONTROL, "no-cache")
                            .header(
                                header::CONTENT_TYPE,
                                "application/javascript; charset=utf-8",
                            )
                            .body(js.into_body())
                            .map_err(internal);
                    }

                    let file = Assets::get(&format!("locales/{locale}.js"))
                        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "no-cache")
                        .header(
                            header::CONTENT_TYPE,
                            "application/javascript; charset=utf-8",
                        )
                        .body(file.data.into_body())
                        .map_err(internal);
                },
            ),
            // Static assets — OAuth provider icons and any other public files.
            // Must be last so more specific routes above take precedence.
            routing::get(
                "/_/auth/{*path}",
                async |req: Request| -> Result<Response, HttpError> {
                    let path = req
                        .path_param("path")
                        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

                    let file = Assets::get(path)
                        .ok_or_else(|| HttpError::status(StatusCode::NOT_FOUND))?;

                    return Response::builder()
                        .header(header::CACHE_CONTROL, "public, max-age=604800, immutable")
                        .header(header::CONTENT_TYPE, file.metadata.mimetype())
                        .body(file.data.into_body())
                        .map_err(internal);
                },
            ),
        ];
    }
}

export!(Endpoints);
