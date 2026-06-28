import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// happy-dom 15.x does not expose localStorage until a window URL is set.
// ThemeService.init() reads localStorage at module load, so we must install a
// minimal in-memory polyfill BEFORE the static `import` statements are resolved.
// `vi.hoisted` is hoisted above imports by vitest's transformer.
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

// Mock the auth config service so the component reads brandName from a
// stable, controlled value rather than the real /api/config/public endpoint.
vi.mock('@/features/auth/services/config.service', () => ({
  configService: {
    getConfig: vi.fn().mockReturnValue({
      brandName: 'Custom Brand',
      themeColorLight: '#ff6b35',
      themeColorDark: '#10b981',
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
    }),
  },
}));

// Mock the auth feature surface used by app-header. Only isAuthenticated,
// showLogin, and init are exercised by the component; each test reshapes
// return values via `vi.mocked(authService.<method>).mockReturnValue(...)`.
vi.mock('@/features/auth', () => ({
  authService: {
    init: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockReturnValue(false),
    showLogin: vi.fn(),
    isAdmin: vi.fn().mockReturnValue(false),
    getUser: vi.fn().mockReturnValue(null),
  },
}));

import './app-header';
import type { AppHeader } from './app-header';
import { authService } from '@/features/auth';
import { themeService } from '@/features/theme';
import { localizationService } from '@/features/localization';

describe('app-header', () => {
  let element: AppHeader;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('theme', 'light');
    // LocaleSwitcher (a child of app-header) reads localizationService.getLocale()
    // during render. The service is a no-op until init() runs; init() is
    // idempotent so calling it in every test is safe.
    localizationService.init();
    // Reset the auth mock to the unauthenticated default so each test
    // starts from a known state and shapes isAuthenticated explicitly.
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.init).mockResolvedValue(undefined);
    vi.mocked(authService.showLogin).mockReset();
  });

  afterEach(() => {
    element?.remove();
    themeService.setTheme('light');
  });

  it('renders the light-theme logo src from /branding/logo-light.svg', async () => {
    themeService.setTheme('light');
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    const logo = element.shadowRoot?.querySelector('img.logo');
    expect(logo?.getAttribute('src')).toBe('/branding/logo-light.svg');
  });

  it('renders the dark-theme logo src from /branding/logo-dark.svg', async () => {
    themeService.setTheme('dark');
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    const logo = element.shadowRoot?.querySelector('img.logo');
    expect(logo?.getAttribute('src')).toBe('/branding/logo-dark.svg');
  });

  it('renders the runtime brandName from configService in the header', async () => {
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    const appName = element.shadowRoot?.querySelector('.app-name');
    expect(appName?.textContent?.trim()).toBe('Custom Brand');
  });

  it('wraps the logo in a home link pointing to /', async () => {
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    const link = element.shadowRoot?.querySelector('a.logo-link');
    expect(link?.getAttribute('href')).toBe('/');
    // The logo must live inside that link, not alongside it.
    const logo = link?.querySelector('img.logo');
    expect(logo?.getAttribute('src')).toBe('/branding/logo-light.svg');
  });

  it('renders the Sign In button when unauthenticated', async () => {
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    const signInBtn = element.shadowRoot?.querySelector('button.login-btn');
    expect(signInBtn).not.toBeNull();
    expect(signInBtn?.textContent?.trim()).toBe('Sign In');
    // The account-menu should not be present in the unauthenticated state.
    expect(element.shadowRoot?.querySelector('account-menu')).toBeNull();
  });

  it('renders <account-menu> when authenticated', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);

    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('account-menu')).not.toBeNull();
    // The Sign In button must not be rendered in the authenticated state.
    expect(element.shadowRoot?.querySelector('button.login-btn')).toBeNull();
  });

  it('reacts to auth-state-updated by re-reading isAuthenticated', async () => {
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    // Start unauthenticated — Sign In button visible.
    expect(element.shadowRoot?.querySelector('button.login-btn')).not.toBeNull();

    // Flip the underlying auth state and notify subscribers.
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('account-menu')).not.toBeNull();
    expect(element.shadowRoot?.querySelector('button.login-btn')).toBeNull();
  });

  it('calls authService.showLogin when the Sign In button is clicked', async () => {
    element = document.createElement('app-header') as AppHeader;
    document.body.appendChild(element);
    await element.updateComplete;

    const signInBtn = element.shadowRoot?.querySelector(
      'button.login-btn'
    ) as HTMLButtonElement;
    signInBtn.click();

    expect(authService.showLogin).toHaveBeenCalledTimes(1);
  });
});
