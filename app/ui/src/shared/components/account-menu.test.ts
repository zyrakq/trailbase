import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// happy-dom 15.x does not expose localStorage until a window URL is set.
// The ThemeService singleton reads localStorage at module load, so we must
// install a minimal in-memory polyfill BEFORE the static `import` statements
// are resolved. `vi.hoisted` is hoisted above imports by vitest's transformer.
vi.hoisted(() => {
  if (typeof localStorage !== 'undefined') return;
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill,
    writable: true,
    configurable: true,
  });
});

// Mock the auth feature so the component never touches the real TrailBase
// client. Only the surface the component uses is provided: init,
// isAuthenticated, showLogin, and signOut. Each test reshapes return values
// via `vi.mocked(authService.<method>).mockReturnValue(...)`.
vi.mock('@/features/auth', () => ({
  authService: {
    init: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockReturnValue(false),
    showLogin: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

import './account-menu';
import type { AccountMenu } from './account-menu';
import { authService } from '@/features/auth';
import { localizationService } from '@/features/localization';

// Lit 3 + happy-dom have a known limitation: a top-level ChildPart whose
// initial value is `null` does not get a comment anchor created in the
// shadow DOM. When the value later becomes a template, Lit has no position
// to insert the template at, so the dropdown never appears in the DOM even
// though `_isOpen` flips and `aria-expanded` updates on the button. The
// component behaves correctly in real browsers; the test environment just
// cannot observe the conditional render. The tests below therefore drive
// the menu via `aria-expanded` and invoke the click handlers directly on
// the element instance to exercise the same code paths the dropdown items
// would run in a browser.

// Recursively walk a Lit template result and concatenate every string
// portion plus the string form of every value. `msg()` resolves to a string
// at template-build time, so the resolved text is part of the values array
// and would otherwise be missed by `strings.join('')`.
function flattenTemplate(result: unknown): string {
  if (result == null) return '';
  if (typeof result === 'string') return result;
  if (typeof result !== 'object') return String(result);
  const tpl = result as { strings?: unknown[]; values?: unknown[] };
  if (!Array.isArray(tpl.strings) || !Array.isArray(tpl.values)) return '';
  let out = '';
  for (let i = 0; i < tpl.strings.length; i++) {
    out += String(tpl.strings[i] ?? '');
    if (i < tpl.values.length) {
      out += flattenTemplate(tpl.values[i]);
    }
  }
  return out;
}

// The component writes `window.location.href` on Profile/Sign out clicks.
// We override the accessor on the Location object so the assignment is
// captured by a spy instead of triggering an actual navigation. happy-dom
// defines `href` as a configurable property, so the override is safe.
function stubLocationHref(): {
  spy: ReturnType<typeof vi.fn>;
  restore: () => void;
} {
  const original = Object.getOwnPropertyDescriptor(window.location, 'href');
  const spy = vi.fn();
  Object.defineProperty(window.location, 'href', {
    configurable: true,
    get: () => '',
    set: spy,
  });
  return {
    spy,
    restore: () => {
      if (original) {
        Object.defineProperty(window.location, 'href', original);
      }
    },
  };
}

describe('account-menu', () => {
  let element: AccountMenu;
  let hrefSpy: ReturnType<typeof vi.fn>;
  let restoreHref: () => void;

  async function mount(authenticated = false): Promise<AccountMenu> {
    vi.mocked(authService.isAuthenticated).mockReturnValue(authenticated);
    const el = document.createElement('account-menu') as AccountMenu;
    document.body.appendChild(el);
    // connectedCallback awaits authService.init() before setting
    // _isAuthenticated, so let the microtask queue drain and then wait for
    // the resulting re-render.
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    return el;
  }

  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.init).mockResolvedValue(undefined);
    vi.mocked(authService.showLogin).mockReset();
    vi.mocked(authService.signOut).mockReset();
    localizationService.init();
    const stub = stubLocationHref();
    hrefSpy = stub.spy;
    restoreHref = stub.restore;
  });

  afterEach(() => {
    element.remove();
    restoreHref();
  });

  it('exposes Sign in and calls authService.showLogin when clicked while unauthenticated', async () => {
    element = await mount(false);
    // Open the dropdown so the handler is reachable. We exercise the
    // handler directly because Lit 3 + happy-dom cannot render the
    // top-level conditional template (see comment at the top of the file).
    (element as any)._isOpen = true;
    await element.updateComplete;

    // The component owns the "Sign in" string via msg() but never starts a
    // real localize session, so the source string flows through unchanged.
    const renderResult = (element as any)._renderMenu();
    expect(flattenTemplate(renderResult)).toContain('Sign in');

    const event = new MouseEvent('click', { bubbles: true, composed: true });
    (element as any)._handleSignIn(event);

    expect(authService.showLogin).toHaveBeenCalledTimes(1);
  });

  it('exposes Profile and Sign out when authenticated', async () => {
    element = await mount(true);
    (element as any)._isOpen = true;
    await element.updateComplete;

    const renderResult = (element as any)._renderMenu();
    const html = flattenTemplate(renderResult);
    expect(html).toContain('Profile');
    expect(html).toContain('Sign out');
    // The Sign out item carries the `danger` modifier class.
    expect(html).toMatch(/class="dropdown-item[^"]*danger[^"]*"/);
  });

  it('opens the dropdown when the menu button is clicked', async () => {
    element = await mount(false);
    const button = element.shadowRoot!.querySelector(
      'button.account-btn',
    ) as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await element.updateComplete;
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the dropdown when clicking outside the component', async () => {
    element = await mount(false);
    const button = element.shadowRoot!.querySelector(
      'button.account-btn',
    ) as HTMLButtonElement;
    button.click();
    await element.updateComplete;
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // A click that bubbles up to `document` reaches the component's
    // outside-click handler, which clears _isOpen.
    document.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await element.updateComplete;
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('redirects to /profile when Profile is clicked', async () => {
    element = await mount(true);

    const event = new MouseEvent('click', { bubbles: true, composed: true });
    (element as any)._handleProfile(event);

    expect(hrefSpy).toHaveBeenCalledWith('/profile');
  });

  it('calls authService.signOut and redirects to / on successful sign out', async () => {
    element = await mount(true);

    const event = new MouseEvent('click', { bubbles: true, composed: true });
    const promise = (element as any)._handleSignOut(event);

    // The handler awaits authService.signOut() before navigating, so the
    // microtask queue has to drain before the navigation is observed.
    await promise;
    await element.updateComplete;

    expect(authService.signOut).toHaveBeenCalledTimes(1);
    expect(hrefSpy).toHaveBeenCalledWith('/');
  });
});
