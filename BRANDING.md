# Branding

Runtime branding is fully driven by server-side configuration — name, theme color,
and asset files. The frontend fetches its branding from a public config endpoint,
so no rebuild is required to rebrand a deployment.

## Overview

Three pieces make up a deployment's brand:

- `brand_name` and `theme_color` — short text values surfaced through
  `GET /api/config/public` and consumed by the SPA.
- An optional `branding_dir` on the server filesystem containing override assets
  (logos, favicons, manifest icons). The route layer resolves each asset through
  a *disk-over-embedded* overlay, so any file not present in the override
  directory falls back to the asset compiled into the binary.

## Configuration

The `[branding]` block lives in `app/appsettings.toml`. The defaults are
suitable for the upstream Velora build; override them per deployment.

### TOML

```toml
[branding]
brand_name = "velora"
theme_color = "#ff6b35"
branding_dir = ""
```

| Key           | Default      | Meaning                                                      |
| ------------- | ------------ | ------------------------------------------------------------ |
| `brand_name`  | `velora`    | Brand name shown in the header, document title, and welcome. |
| `theme_color` | `#ff6b35`    | Hex color applied to the `<meta name="theme-color">` tag.    |
| `branding_dir`| `""`         | Filesystem path to override assets; empty disables override. |

The config crate's `try_parsing(true)` flag means hex colors and other typed
values can be supplied as plain strings; empty `branding_dir` disables the
overlay entirely.

### Environment Variables

Each TOML key can be overridden via the `APP_*` env-var convention used
throughout the app. Double underscores delimit sections.

| Env var                       | TOML key            |
| ----------------------------- | ------------------- |
| `APP_BRANDING__BRAND_NAME`    | `branding.brand_name`   |
| `APP_BRANDING__THEME_COLOR`   | `branding.theme_color`  |
| `APP_BRANDING__BRANDING_DIR`  | `branding.branding_dir` |

Env vars are applied after the TOML files, so a value passed at runtime always
wins over a value baked into `appsettings.toml`.

## Asset Bundle

The override directory must mirror the layout of the embedded assets under
`app/ui/public/branding/`. The resolver looks up files by relative path, so
the filenames below are the only ones recognised.

```text
branding/
├── favicon-light.ico
├── favicon-light.svg
├── favicon-dark.ico
├── favicon-dark.svg
├── logo-light.svg
├── logo-dark.svg
└── favicons/
    ├── 32-light.png
    ├── 32-dark.png
    ├── 192-light.png
    ├── 192-dark.png
    ├── 512-light.png
    ├── 512-dark.png
    ├── apple-light.png
    └── apple-dark.png
```

Anything else in the directory is ignored. Missing files fall through to the
embedded defaults, so partial overrides are safe.

## Public Config Flow

`brand_name` and `theme_color` are read once at startup and exposed to the
frontend as JSON:

```json
{
  "passwordAuthEnabled": true,
  "registrationEnabled": true,
  "otpEnabled": true,
  "brandName": "velora",
  "themeColor": "#ff6b35"
}
```

The frontend `configService` fetches this on init and applies the values as
DOM side effects:

- `document.title` → `config.brandName`
- `<meta name="theme-color">` content → `config.themeColor`
- The shared `<app-header>` shows `brandName` next to the logo.
- The auth card renders `Welcome to {brandName}`.

Branding changes therefore take effect on the next page load — no rebuild, no
container restart needed for the text values.

## Generating Assets

The theme feature ships a recipe for producing every required file from a pair
of light/dark SVGs. See
`app/ui/src/features/theme/README.md` for full context; the relevant commands
are:

```bash
# PNGs from SVG (Inkscape)
inkscape favicon-light.svg -w 180  -h 180  -o favicons/apple-light.png
inkscape favicon-light.svg -w 192  -h 192  -o favicons/192-light.png
inkscape favicon-light.svg -w 512  -h 512  -o favicons/512-light.png
inkscape favicon-dark.svg  -w 180  -h 180  -o favicons/apple-dark.png
inkscape favicon-dark.svg  -w 192  -h 192  -o favicons/192-dark.png
inkscape favicon-dark.svg  -w 512  -h 512  -o favicons/512-dark.png

# 32px intermediates
inkscape favicon-light.svg -w 32 -h 32 -o favicons/32-light.png
inkscape favicon-dark.svg  -w 32 -h 32 -o favicons/32-dark.png

# ICO files (ImageMagick)
convert favicons/32-light.png favicon-light.ico
convert favicons/32-dark.png  favicon-dark.ico
```

The same recipe works for any brand — replace the two source SVGs and run the
commands verbatim.

## Docker Compose

`traildepot/branding/` is a sibling of the existing `traildepot/data`,
`traildepot/backups`, `traildepot/secrets`, and `traildepot/uploads` volumes
already declared in `docker-compose.yml`. Mount a host directory onto it and
point the app at it via `APP_BRANDING__BRANDING_DIR`:

```yaml
services:
  velora-web:
    image: velora
    volumes:
      - ./my-brand:/workspace/app/traildepot/branding
    environment:
      APP_BRANDING__BRAND_NAME: Acme
      APP_BRANDING__BRANDING_DIR: traildepot/branding
```

Files dropped into `./my-brand/` appear at the same paths the embedded assets
use, so the SPA continues to request `/branding/favicon-light.ico`,
`/branding/logo-dark.svg`, and so on without any code changes.
