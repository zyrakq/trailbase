use axum::Router;
use std::sync::Arc;
use tokio::sync::RwLock;
use trailbase_wasm_common::HttpContextUser;
use trailbase_wasm_runtime_axum::Job;

use crate::{AppState, User};

pub(crate) use trailbase_wasm_runtime_axum::{
  AnyError, KvStore, Runtime, SqliteFunctions, SqliteStore, WasmRuntimeBuilder,
  build_sync_wasm_runtimes_for_components, wasm_runtime_builders,
};

pub(crate) async fn install_routes_and_jobs(
  state: &AppState,
  runtime: Arc<RwLock<Runtime>>,
) -> Result<Option<Router<AppState>>, AnyError> {
  use axum::extract::OptionalFromRequestParts;
  use axum::http::request::Parts;
  use trailbase_wasm_runtime_axum::{InstallResult, install_routes_and_jobs};
  use trailbase_wasm_runtime_host::{HttpStore, InitArgs};

  fn extract_user<'a>(
    parts: &'a mut Parts,
    s: &'a AppState,
  ) -> futures_util::future::BoxFuture<'a, Option<HttpContextUser>> {
    return Box::pin(async {
      User::from_request_parts(parts, s)
        .await
        .ok()
        .flatten()
        .map(|u| HttpContextUser {
          id: u.id,
          email: u.email,
          username: u.username,
          csrf_token: u.csrf_token,
        })
    });
  }

  let version = state.version().git_version_tag.clone();

  let component_name = runtime
    .read()
    .await
    .component_path()
    .file_stem()
    .and_then(|s| s.to_str())
    .unwrap_or("unknown")
    .to_string();

  // Call initialize once to get the full manifest (Http + Jobs + Ui subsystems).
  // install_routes_and_jobs below makes its own initialize call for Http + Jobs;
  // this separate call is needed only to extract the Ui field.
  {
    let store = HttpStore::new(&*runtime.read().await).await?;
    let manifest = store.initialize(InitArgs { version: version.clone() }).await?;

    if let Some(ui) = manifest.ui {
      let wasm_manifest = crate::app_state::WasmManifest {
        display_name: ui.display_name,
        icon: ui.icon,
        config_path: ui.config_path,
        description: ui.description,
      };
      log::info!("Registering manifest for WASM component '{component_name}'");
      state
        .wasm_manifests()
        .write()
        .await
        .insert(component_name, wasm_manifest);
    } else {
      log::debug!("Component '{component_name}' has no UI manifest");
    }
  }

  let InstallResult { router, jobs } =
    install_routes_and_jobs::<AppState>(runtime, extract_user, version).await?;

  for Job {
    name,
    schedule,
    callback,
  } in jobs
  {
    let Some(job) = state.jobs().new_job(None, name, schedule, callback) else {
      return Err("Failed to add job".into());
    };

    job.start();
  }

  return Ok(router);
}