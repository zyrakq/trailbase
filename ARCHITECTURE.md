# ARCHITECTURE.md

## Overview

Argiago is a content platform (author profiles, posts, subscriptions, comments) currently being
migrated from React to Lit web components. The backend is a Rust/Axum server that embeds
**TrailBase** — an open-source database + auth backend. The frontend is built with **Lit 3**,
Vite, and TypeScript following a feature-based modular architecture.

> **Migration status**: The `react/` folder is legacy reference code — read-only, do not modify.
> The active codebase lives entirely in `app/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Lit 3.x (web components) |
| Build tool | Vite 7 + bun |
| Language | TypeScript 5.9 (strict mode) |
| Routing | `@lit-labs/router` |
| i18n | `@lit/localize` (XLIFF, no page reload) |
| Backend language | Rust (edition 2021) |
| Backend framework | Axum 0.8 |
| Database + Auth | TrailBase (embedded, git dep) |
| HTTP server | Tokio + tower-http |
| Containerization | Docker + docker-compose |

---

## Repository Layout

```
argiago/
├── app/                    # Active application
│   ├── src/                # Rust backend source
│   │   ├── main.rs         # Backend entry point
│   │   ├── routes.rs       # HTTP route definitions
│   │   ├── components.rs   # Backend component registrations
│   │   ├── frontend.rs     # Serves compiled frontend assets
│   │   ├── logging.rs      # Logging configuration
│   │   ├── preflight.rs    # Startup checks
│   │   └── settings.rs     # Config loading
│   ├── traildepot/         # TrailBase data dir (DB, migrations, secrets)
│   ├── ui/                 # Frontend application (Lit + Vite)
│   └── Cargo.toml
├── react/                  # Legacy React code — READ ONLY, do not modify
├── trailbase/              # Cloned TrailBase repo — READ ONLY, reference only
│   └── crates/
│       ├── auth-ui/        # Official TrailBase auth UI — reference for auth flow internals
│       └── core/           # Core API handlers (e.g. auth/api/login.rs)
├── Cargo.toml              # Workspace root
├── Cargo.lock
├── docker-compose.yml
├── Dockerfile
└── AGENTS.md               # AI agent rules
```

---

## Frontend Structure (`app/ui/`)

```
app/ui/
├── index.html              # HTML entry point → imports app-component.ts
├── vite.config.ts          # Build config + path aliases
├── tsconfig.json           # TypeScript config (strict)
├── lit-localize.json       # i18n config (source: en, targets: ru, es, zh-Hans)
├── package.json            # Dependencies + scripts
├── xliff/                  # Translation files (*.xlf per locale)
├── dist/                   # Compiled output (gitignored)
└── src/
    ├── app-component.ts    # Root component + router
    ├── index.css           # Global CSS (imports theme-variables.css)
    ├── features/           # Isolated feature modules
    ├── pages/              # Top-level page components
    ├── shared/             # Reusable cross-feature UI components
    └── assets/             # Static images (logo-light.svg, logo-dark.svg)
```

### Path Aliases

| Alias | Resolves to |
|---|---|
| `@/` | `src/` |
| `@/features/*` | `src/features/*` |
| `@/pages/*` | `src/pages/*` |
| `@/shared/*` | `src/shared/*` |
| `@/assets/*` | `src/assets/*` |

---

## Application Entry & Routing

**Entry**: `index.html` → `<script type="module" src="./src/app-component.ts">`

**Root component** (`app-component.ts`):

- Calls `localizationService.init()` in constructor (once, app-wide)
- Side-effect imports `favicon.service` (auto-initializes favicon on import)
- Owns a `Router` instance from `@lit-labs/router`
- `render()` returns only `${this._router.outlet()}` — pure routing shell

**Route table**:

| Path | Component | Guard |
|---|---|---|
| `/` | `<welcome-page>` | `authService.init()` → always allow |
| `/auth/callback` | `<oauth-callback>` | None |
| `/dashboard` | `<dashboard-page>` | `authService.init()` → redirect to `/` if not authenticated |

Navigation: `this._router.goto(path)` for programmatic nav; `@lit-labs/router` intercepts `<a>` clicks and `popstate` automatically.

---

## Feature Modules (`src/features/`)

Each feature is **self-contained** and exposes a public API only through its `index.ts`.
Other features must import exclusively from the public API (e.g., `@/features/auth`).

### Standard Feature Structure

```
features/<name>/
├── components/     # Lit web components (UI)
├── services/       # Business logic, API calls, singletons
├── controllers/    # Lit ReactiveControllers (optional)
├── types/          # TypeScript interfaces and type aliases
├── data/           # Static data (optional)
├── utils/          # Utilities (optional)
└── index.ts        # Public API — only export documented interfaces here
```

### `features/auth/`

Authentication via TrailBase OAuth (OIDC) and password login (form-encoded POST for cookie persistence).

| File | Role |
|---|---|
| `config/auth-providers.ts` | Static OIDC provider list (`OIDC_PROVIDERS`) |
| `services/trailbase.service.ts` | HTTP adapter for TrailBase REST API; uses `trailbase` npm SDK internally |
| `services/auth.service.ts` | App-level auth state manager, singleton with init-once guard |
| `components/auth-modal.ts` | Login modal: OIDC buttons + password form |
| `components/auth-status.ts` | Sign-in card / "Go to Dashboard" button |
| `components/oauth-callback.ts` | Handles `/auth/callback` after OIDC or password redirect; calls `authService.refresh()` |
| `types/auth.types.ts` | `User`, `AuthState` interfaces |
| `types/auth-error.ts` | `AuthErrorCode` const, `AuthError extends Error` |

**TrailBase endpoints used**:

| Endpoint | Purpose |
|---|---|
| `GET /api/auth/v1/oauth/{provider}/login` | Initiate OAuth (browser redirect) |
| `POST /api/auth/v1/login` | Password login (form-encoded, sets HttpOnly cookie via 303) |
| `GET /api/auth/v1/status` | Check session / restore from cookie |
| `POST /api/auth/v1/logout` | Invalidate session |

**Auth state**: In-memory only. Persisted via HttpOnly cookie set by TrailBase. On every page load,
`authService.init()` calls `initClientFromCookies()` (SDK) → `GET /api/auth/v1/status` to reconstruct state.

**Cookie path requirement**: TrailBase only sets `Set-Cookie` on form-encoded POST (`application/x-www-form-urlencoded`)
with a `redirect_uri`; JSON POST returns tokens in the response body only (no cookie). See
`trailbase/crates/core/src/auth/api/login.rs`, `build_auth_token_flow_response()` for the server-side logic.

### `features/theme/`

Zero-dependency light/dark theme management.

| File | Role |
|---|---|
| `services/theme.service.ts` | Singleton: reads/writes theme to `localStorage`, detects system preference |
| `services/favicon.service.ts` | Swaps favicon based on theme; auto-initializes on import |
| `controllers/theme.controller.ts` | Lit `ReactiveController` — subscribes to theme, triggers host re-render |
| `components/theme-toggler.ts` | Toggle button UI |
| `styles/theme-variables.css` | All CSS custom properties for light and dark themes |
| `utils/prevent-fart.ts` | Sets `theme` attribute on `<html>` before first paint (anti-FART) |

### `features/localization/`

Runtime i18n with `@lit/localize`. Locale switch without page reload.

| File | Role |
|---|---|
| `services/localization.service.ts` | Initializes `@lit/localize`, persists locale to `localStorage`, syncs across tabs |
| `controllers/locale.controller.ts` | Lit `ReactiveController` — exposes current locale, triggers re-render on change |
| `components/locale-switcher.ts` | Dropdown UI to switch locale |
| `data/` | Static locale metadata (code, native name, flag, text direction) |
| `generated/` | Auto-generated locale modules (output of `bun i18n:build`) |

Supported locales: `en` (source), `ru`, `es`, `zh-Hans`.

### `features/notifications/`

In-app toast notification system.

| File | Role |
|---|---|
| `services/notification.service.ts` | Dispatches `CustomEvent('notification-add')` on `window` |
| `components/toast-container.ts` | Listens for events, renders active toasts |
| `components/toast-notification.ts` | Individual toast item |
| `components/notification-modal.ts` | Modal-style notification dialog |

**Decoupled dispatch**: Services that cannot import `notificationService` directly (circular dep risk) dispatch `CustomEvent('notification-add')` on `window` manually with the same payload shape.

---

## Pages (`src/pages/`)

Page components compose features and shared components into full-page layouts.

| File | Route | Description |
|---|---|---|
| `welcome-page.ts` | `/` | Public landing page with `<auth-status>` |
| `dashboard-page.ts` | `/dashboard` | Authenticated user dashboard (user info, sign-out, notification tests) |

**Standard page shell pattern**:

```
:host { display: block; min-height: 100vh }
.page { display: flex; flex-direction: column; min-height: 100vh }
  <app-header>
  <main class="main-content"> { flex: 1 }
  <footer-info>
```

---

## Shared Components (`src/shared/`)

| File | Description |
|---|---|
| `components/app-header.ts` | App-wide header: logo, theme toggler, locale switcher |
| `components/footer-info.ts` | App footer |

---

## Backend (`app/src/`)

Rust/Axum server that embeds TrailBase and serves the compiled frontend.

| File | Role |
|---|---|
| `main.rs` | Entry point: initializes logging, loads settings, starts Axum server |
| `routes.rs` | HTTP route definitions |
| `components.rs` | Backend component registrations |
| `frontend.rs` | Serves `app/ui/dist/` as static files |
| `settings.rs` | Config loading (TOML + env vars via `config` + `dotenvy`) |
| `logging.rs` | `pretty_env_logger` setup |
| `preflight.rs` | Startup validation checks |

**TrailBase** is embedded as a git dependency from `https://github.com/trailbaseio/trailbase`.
It provides: SQLite database, REST API, OAuth/OIDC auth, file uploads, WASM modules.
Data lives in `app/traildepot/`.

---

## Data Flow

### Authentication Flow

```
1. App loads → authService.init() → initClientFromCookies() → GET /api/auth/v1/status (cookie)
   → 401: unauthenticated state
   → 200: client.user() decodes JWT → user object in memory

2a. OIDC Sign In → authService.signIn('oidc0', '/auth/callback')
    → window.location.href = '/api/auth/v1/oauth/oidc0/login?redirect_uri=/auth/callback'
    → Browser → TrailBase → Kanidm OIDC provider
    → TrailBase /api/auth/v1/oauth/oidc0/callback (sets HttpOnly cookie) → /auth/callback

2b. Password Sign In → authService.loginWithPassword(email, pwd)
    → trailbaseService: form-encoded POST /api/auth/v1/login + redirect_uri=/auth/callback
    → TrailBase sets HttpOnly cookie → 303 → fetch follows → response.redirected = true
    → authService.refresh() → /auth/callback navigation handled by router

3. <oauth-callback> mounts → wait 500ms → authService.refresh()
   → client.checkCookies() → GET /api/auth/v1/status → isAuthenticated: true
   → wait 1500ms → window.location.href = '/dashboard'

4. Sign Out → client.logout() → POST /api/auth/v1/logout → reset authState → navigate to /
```

### Notification Flow

```
Any code → notificationService.error('msg')
         → window.dispatchEvent(CustomEvent('notification-add', { detail: {...} }))
         → <toast-container> listens → renders <toast-notification>
```

---

## Migration Context (React → Lit)

The `react/` folder is a **read-only reference** for what features need to be built.
The React code was never refactored and should not be used as a structural guide.

### Features to Migrate (from React reference)

| Feature | Status |
|---|---|
| Auth (login/logout/OAuth callback) | ✅ Done |
| Theme (light/dark toggle) | ✅ Done |
| Localization (i18n, locale switcher) | ✅ Done |
| Notifications (toasts) | ✅ Done |
| Welcome page | ✅ Done |
| Dashboard page (basic) | ✅ Done (stub) |
| Home page (landing) | Pending |
| Profile page (author + posts + subscriptions) | Pending |
| Post detail page (single post + comments) | Pending |
| New post page (rich text editor + drafts) | Pending |
| Account settings (avatar upload + currency) | Pending |
| 404 / 403 error pages | Pending |
| Header (subscriptions drawer, profile menu) | Partial (basic header done) |
| Footer | Partial |
| Post card (rich text, access gating) | Pending |
| Comment / Reply system | Pending |
| Subscription tier cards | Pending |
| Follow / Unfollow button | Pending |
| Draft management | Pending |
| Post access control UI | Pending |
| Currency selector | Pending |

### Mock Data Strategy

For development without a live backend, use **Convex** (`https://github.com/get-convex/convex-backend`)
as the mock data backend instead of hardcoded fixtures.

---

## Build & Deploy

### Frontend

```bash
bun run build          # Full production build (i18n:build + tsc + vite build)
bun run watch          # Watch mode (dev)
bun run i18n:extract   # Extract msg() strings → xliff/*.xlf
bun run i18n:build     # Generate locale modules from xliff/*.xlf
```

Output: `app/ui/dist/` — served by the Rust backend.

### Backend

```bash
cargo build            # Compile Rust server
cargo run              # Start server (serves frontend from app/ui/dist/)
```

### Docker

```bash
docker-compose up      # Full stack (backend + frontend)
```

### Configuration

- Backend config: TOML file + `.env` (loaded via `dotenvy` + `config` crate)
- TrailBase data: `app/traildepot/` (database, migrations, secrets)
- Frontend env: Vite handles at build time; no runtime env injection
