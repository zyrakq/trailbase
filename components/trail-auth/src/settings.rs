// HTML wrapper for the trail-auth settings page.
// Served at GET /_/wasm/trail-auth/settings. Loads the bundle and mounts
// <trail-auth-settings>. The light-DOM fallback shows until the element
// upgrades; if the bundle fails to load, the fallback persists.
pub(crate) fn settings_page() -> String {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trail Auth Settings</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--theme-color-background, #f3f4f6);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .fallback {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <trail-auth-settings>
      <div class="fallback">Loading settings...</div>
    </trail-auth-settings>
  </div>
  <script type="module" src="/_/auth/bundle.js"></script>
</body>
</html>"#
        .to_string()
}
