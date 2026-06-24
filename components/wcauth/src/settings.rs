// HTML fragment for the wcauth settings panel.
// Served at GET /_/wasm/wcauth/settings. Injected by the trailbase admin SPA
// into a container div — NOT a standalone page. The SPA executes the script tag
// after injection (script-cloning technique) so the bundle loads correctly.
// The light-DOM fallback text shows until <wcauth-settings> upgrades;
// if the bundle fails to load, the fallback persists.
pub(crate) fn settings_page() -> String {
    r#"<wcauth-settings>
  <div class="fallback">Loading settings...</div>
</wcauth-settings>
<script type="module" src="/_/auth/bundle.js"></script>"#
        .to_string()
}
