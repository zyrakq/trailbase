use wasmtime::component::Instance;
use wasmtime::{AsContext, AsContextMut, Store};

use crate::host::State;

/// Capabilities discovered by probing a component after strict instantiation.
/// All fields are `Option` — absent means the component doesn't implement that interface.
pub struct ComponentCapabilities {
    /// Return value of `trailbase:component/manifest-endpoint.get-manifest`, if present.
    pub manifest: Option<String>,
}

/// Probe all known optional interfaces on `instance` and return their results.
///
/// Never fails: any probe error degrades to `None` for that capability.
pub(crate) async fn probe_capabilities(
    store: &mut Store<State>,
    instance: &Instance,
) -> ComponentCapabilities {
    let manifest = probe_manifest(store, instance).await;
    ComponentCapabilities { manifest }
}

async fn probe_manifest(store: &mut Store<State>, instance: &Instance) -> Option<String> {
    // wasmtime uses the kebab-case interface name as the export key.
    let iface_idx =
        instance.get_export_index(store.as_context_mut(), None, "trailbase:component/manifest-endpoint@0.1.1")?;

    let func_idx =
        instance.get_export_index(store.as_context_mut(), Some(&iface_idx), "get-manifest")?;

    let func = instance.get_func(store.as_context_mut(), &func_idx)?;

    let typed = func
        .typed::<(), (String,)>(store.as_context())
        .ok()?;

    match typed.call_async(store.as_context_mut(), ()).await {
        Ok((s,)) => Some(s),
        Err(err) => {
            log::debug!("manifest probe call failed: {err}");
            None
        }
    }
}
