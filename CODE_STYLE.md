# CODE_STYLE.md

## Naming Conventions

### Files

| Pattern | Example |
|---|---|
| Components: `kebab-case.ts` | `auth-status.ts`, `toast-notification.ts` |
| Component styles: `kebab-case.styles.ts` | `auth-modal.styles.ts`, `auth-status.styles.ts` |
| Services: `kebab-case.service.ts` | `auth.service.ts`, `theme.service.ts` |
| Controllers: `kebab-case.controller.ts` | `theme.controller.ts`, `locale.controller.ts` |
| Types: `kebab-case.types.ts` | `auth.types.ts`, `notification.types.ts` |
| Pages: `page-name/index.ts` | `dashboard/index.ts`, `welcome/index.ts` |
| Page styles: `page-name/index.styles.ts` | `dashboard/index.styles.ts` |
| Page blocks: `page-name/blocks/section-name.ts` | `dashboard/blocks/user-info.ts` |
| Block styles: `page-name/blocks/section-name.styles.ts` | `dashboard/blocks/user-info.styles.ts` |
| Data files: `kebab-case.ts` | `locale-metadata.ts`, `locale-codes.ts` |
| Utilities: `kebab-case.ts` | `prevent-fart.ts` |
| CSS: `kebab-case.css` | `theme-variables.css` |

### Classes & Identifiers

| Kind | Convention | Example |
|---|---|---|
| Component class | `PascalCase` matching tag | `AuthStatus` for `auth-status` |
| Page class | `PascalCase` + `Page` | `DashboardPage` |
| Service class | `PascalCase` + `Service` | `AuthService`, `ThemeService` |
| Controller class | `PascalCase` + `Controller` | `ThemeController`, `LocaleController` |
| Interface | `PascalCase`, no `I` prefix | `User`, `AuthState`, `LocaleMetadata` |
| Type alias | `PascalCase` | `Theme`, `NotificationType`, `LocaleCode` |
| Constants | `UPPER_SNAKE_CASE` | `THEME_ATTRIBUTE`, `STORAGE_KEY` |
| Exported singleton | `camelCase` | `authService`, `notificationService` |
| Reactive state fields | `camelCase` | `isAuthenticated`, `loading` |
| Event handlers | `handle` + `PascalCase` | `handleSignIn`, `handleDashboardClick` |
| Private service methods | `_camelCase` (underscore prefix) | `_getLocale`, `_handleStorageChange` |

---

## Component Structure

Every Lit component follows this exact order:

```typescript
import { LitElement, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
// Feature imports (path aliases)
import { ThemeController } from '@/features/theme';
// Asset imports
import logoLight from '@/assets/logo-light.svg';
// Styles (always in a sibling .styles.ts file — never inline)
import { myComponentStyles } from './my-component.styles';

@customElement('my-component')   // 1. Element registration
@localized()                     // 2. i18n decorator (ALWAYS required)
export class MyComponent extends LitElement {
  // 3. Controllers (private, camelCase)
  private theme = new ThemeController(this);

  // 4. Reactive properties (@property for public, @state for internal)
  @property({ type: String }) label = '';
  @state() private loading = false;

  // 5. Lifecycle methods
  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
  }

  // 6. Private methods (data loading, event handlers)
  private async loadData() { ... }
  private async handleSubmit() { ... }

  // 7. render()
  render() {
    return html`...`;
  }

  // 8. static styles — imported from sibling .styles.ts
  static styles = myComponentStyles;
}

// 9. Global type declaration (always at bottom)
declare global {
  interface HTMLElementTagNameMap {
    'my-component': MyComponent;
  }
}
```

---

## Import Style

### Order (within a file)

1. Lit core (`lit`, `lit/decorators.js`)
2. `@lit/*` packages
3. Path alias imports (`@/features/*`, `@/shared/*`, `@/assets/*`)
4. Relative imports (intra-feature only)

### Path Rules

- **Within the same feature**: use relative paths

  ```typescript
  import { authService } from '../services/auth.service.ts';
  import type { User } from '../types/auth.types.ts';
  ```

- **Cross-feature or shared**: use path aliases

  ```typescript
  import { ThemeController } from '@/features/theme';
  import { notificationService } from '@/features/notifications';
  import '@/shared/components/app-header';
  ```

- **Always import from a feature's `index.ts`** (public API), never from internal paths of another feature:

  ```typescript
  // ✅ Correct
  import { authService } from '@/features/auth';

  // ❌ Wrong
  import { authService } from '@/features/auth/services/auth.service';
  ```

- **Side-effect imports** (component registration, auto-init services):

  ```typescript
  import '@/pages/dashboard-page';                        // registers custom element
  import '@/features/theme/services/favicon.service';    // auto-initializes
  ```

- **Type-only imports** use `import type`:

  ```typescript
  import type { User, AuthState } from '../types/auth.types.ts';
  ```

---

## Localization (Required for Every Component)

Every Lit component **must** have `@localized()` and wrap all user-visible strings in `msg()`.

```typescript
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';

@customElement('my-component')
@localized()
export class MyComponent extends LitElement {
  render() {
    return html`
      <h1>${msg('Welcome')}</h1>
      <button>${this.loading ? msg('Loading...') : msg('Submit')}</button>
    `;
  }
}
```

**Rules**:

- No hardcoded user-visible strings outside `msg()`
- After adding new `msg()` calls: run `bun i18n:extract` → translate in `xliff/*.xlf` → `bun i18n:build`
- `localizationService.init()` is called **once** in `app-component.ts` constructor — do not call it elsewhere

---

## Theming (Required for All Styles)

**Never hardcode color values.** Always use CSS custom properties from `theme-variables.css`.

```css
/* ✅ Correct */
color: var(--theme-color-text-primary);
background: var(--theme-color-surface);
border: 1px solid var(--theme-color-border);

/* ❌ Wrong */
color: #1f2937;
background: white;
```

### Standard Variables Reference

```css
/* Primary */
--theme-color-primary          /* Orange: #ff6b35 light / #f97316 dark */
--theme-color-primary-hover
--theme-color-primary-active

/* Backgrounds */
--theme-color-background       /* Page background */
--theme-color-surface          /* Cards, panels */
--theme-color-surface-elevated /* Modals, toasts */

/* Text */
--theme-color-text-primary
--theme-color-text-secondary
--theme-color-text-muted

/* Borders & Shadows */
--theme-color-border
--theme-shadow-sm / --theme-shadow-md / --theme-shadow-lg

/* Semantic */
--theme-color-success / --theme-color-error / --theme-color-warning / --theme-color-info
```

### Theme-Aware Components (Dynamic Assets)

For components that need to swap assets (logos, icons) based on theme:

```typescript
import { ThemeController } from '@/features/theme';

export class MyComponent extends LitElement {
  private theme = new ThemeController(this);

  render() {
    const logo = this.theme.theme === 'dark' ? logoDark : logoLight;
    return html`<img src=${logo} />`;
  }
}
```

### Transitions

Apply to all theme-sensitive properties:

```css
transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
```

---

## Design Standards

| Element | Spec |
|---|---|
| Buttons | Orange (`--theme-color-primary`), no shadows, `border-radius: 6px`, `font-weight: 500` |
| Cards | `--theme-color-surface` background, `box-shadow: var(--theme-shadow-md)`, `border-radius: 8px` |
| Header logo | `48px × 48px` |
| Auth card logo | `120px × 120px` |
| Headings | `font-weight: 600` |
| Semi-bold text | `font-weight: 500` |
| Fonts | System font stack (no custom fonts) |

**No**: gradients on backgrounds, 3D effects, excessive shadows.

---

## Code Patterns

### Singleton Service

```typescript
class MyService {
  private static instance: MyService;

  private constructor() {}

  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService();
    }
    return MyService.instance;
  }
}

export const myService = MyService.getInstance();
```

### Async Init Guard (run-once)

```typescript
private initPromise: Promise<void> | null = null;

async init(): Promise<void> {
  if (this.initPromise) return this.initPromise;
  this.initPromise = this._load();
  return this.initPromise;
}
```

### Async Lifecycle in Components

```typescript
async connectedCallback() {
  super.connectedCallback();   // Always call super first
  await this.loadData();
}

private async loadData() {
  const state = await someService.getState();
  this.data = state;           // Triggers re-render via @state()
}
```

### Loading State Pattern

```typescript
@state() private loading = false;

private async handleAction() {
  try {
    this.loading = true;
    await someService.doSomething();
  } catch (error) {
    notificationService.error(msg('Something went wrong.'));
  } finally {
    this.loading = false;   // Always reset
  }
}

// In template:
// <button ?disabled=${this.loading}>
//   ${this.loading ? msg('Loading...') : msg('Submit')}
// </button>
```

### Multi-Step Async Status

For flows with distinct outcomes (loading → success/error):

```typescript
@state() private status: 'loading' | 'success' | 'error' = 'loading';
@state() private errorMessage = '';

// In template: switch on this.status
```

### Conditional Rendering (if-else over nested ternaries)

When `render()` needs to branch on state, extract a private `renderX()` helper
that returns `TemplateResult`. Never use nested ternaries inside templates.

```typescript
import type { TemplateResult } from 'lit';

// ✅ Correct — readable, easy to extend
private renderMain(): TemplateResult {
  if (this.status === 'success') {
    return html`<my-success-block></my-success-block>`;
  }

  if (this.status === 'error') {
    return html`<my-error-block></my-error-block>`;
  }

  return html`<my-form-block .error=${this.serverError}></my-form-block>`;
}

render() {
  return html`<main>${this.renderMain()}</main>`;
}

// ❌ Wrong — deeply nested ternaries in template
render() {
  return html`
    <main>
      ${this.status === 'success'
        ? html`<my-success-block></my-success-block>`
        : this.status === 'error'
          ? html`<my-error-block></my-error-block>`
          : html`<my-form-block></my-form-block>`}
    </main>
  `;
}
```

A single inline ternary is acceptable when the two branches are short:

```typescript
// ✅ OK — simple, fits on one line
html`<button ?disabled=${this.loading}>${this.loading ? msg('Saving...') : msg('Save')}</button>`
```

### Fetch Pattern

```typescript
const response = await fetch('/api/resource', {
  credentials: 'include',   // Always for cookie-based auth
});

if (response.status === 401) return null;   // Expected state, not an error

if (!response.ok) {
  throw new Error(`Failed: ${response.statusText}`);
}

const data: MyType = await response.json();
```

### Notification Dispatch (Circular-Dep-Safe)

When a service cannot import `notificationService` directly:

```typescript
window.dispatchEvent(
  new CustomEvent('notification-add', {
    detail: {
      id: `my-error-${Date.now()}`,
      message: 'Something failed.',
      type: 'error' as const,
    },
    bubbles: true,
    composed: true,
  })
);
```

### Feature Public API (`index.ts`)

```typescript
// Components
export { MyComponent } from './components/my-component';

// Services
export { myService, MyService } from './services/my.service';

// Controllers
export { MyController } from './controllers/my.controller';

// Types (use export type)
export type { MyType, MyInterface } from './types/my.types';

// Constants
export { MY_CONSTANT } from './types/my.types';
```

---

## Error Handling

| Scenario | Pattern |
|---|---|
| Expected "not found" / "not authenticated" | Return `null`, don't throw |
| Unexpected HTTP error | `throw new Error(response.statusText)` |
| Boolean check methods | Catch all, return `false` as safe default |
| Component user action fails | `catch` → `notificationService.error(msg(...))` |
| Service init fails | Dispatch `CustomEvent('notification-add')` on `window`, set safe default state |
| Service method fails (re-throw) | `catch (error) { throw error; }` — let caller decide |

---

## Styling Conventions

Styles live in a **sibling `.styles.ts` file**, never inline in the component file.
This keeps component logic files lean and avoids flooding the context window with CSS details.

```typescript
// my-component.styles.ts
import { css } from 'lit';

export const myComponentStyles = css`
  :host { display: block; }
  .container { padding: 1rem; }
`;

// my-component.ts
import { myComponentStyles } from './my-component.styles';

export class MyComponent extends LitElement {
  static styles = myComponentStyles;
}
```

- Use `:host` for the component's own display/layout
- Use `@media` queries for responsive behavior
- Class names: `kebab-case` (e.g., `.header-content`, `.main-content`, `.btn-primary`)
- No external CSS frameworks — only CSS custom properties from `theme-variables.css`

---

## Testing

No test infrastructure exists yet. When adding tests:

- Use Vitest (consistent with Vite toolchain)
- Test files: `*.test.ts` alongside the file being tested
- No test files exist to reference — establish patterns when first tests are written

---

## Do's and Don'ts

### Do

- Use `@localized()` on every component and `msg()` for every user-visible string
- Use `--theme-color-*` CSS variables for all colors
- Import from feature `index.ts` public APIs only (cross-feature)
- Use relative paths for intra-feature imports
- Call `super.connectedCallback()` before any async work
- Use `finally` to reset `loading` state
- Declare `HTMLElementTagNameMap` at the bottom of every component file
- Write all comments, docs, and strings in English
- Extract `static styles` to a sibling `<name>.styles.ts` file — applies to components, pages (`index.styles.ts`), and blocks

### Don't

- Hardcode color values (`#fff`, `rgb(...)`, named colors)
- Import from internal paths of another feature (`@/features/auth/services/...`)
- Call `localizationService.init()` anywhere except `app-component.ts`
- Modify anything in `react/` (legacy, read-only reference)
- Modify anything in `trailbase/` (cloned reference repo, read-only)
- Use `cd <dir> && command` — use `workdir` parameter instead
- Add `I` prefix to interface names (`IUser` → `User`)
- Use `any` type (strict TypeScript is enforced)
- Leave unused variables or parameters (TypeScript strict mode will error)
- Put `static styles = css\`...\`` inline inside a component file (components, pages, or blocks)
- Use nested ternaries inside `html\`...\`` templates — use private `renderX()` helpers instead
