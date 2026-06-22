// HTML fragment for the trail-auth settings panel.
// Served at GET /_/wasm/trail-auth/settings. Injected by the trailbase admin SPA
// into a container div — NOT a standalone page. The SPA executes the script tag
// after injection (script-cloning technique) so the bundle loads correctly.
// The light-DOM fallback text shows until <trail-auth-settings> upgrades;
// if the bundle fails to load, the fallback persists.
pub(crate) fn settings_page() -> String {
    r#"<trail-auth-settings>
  <div class="fallback">Loading settings...</div>
</trail-auth-settings>
<script type="module" src="/_/auth/bundle.js"></script>"#
        .to_string()
}
