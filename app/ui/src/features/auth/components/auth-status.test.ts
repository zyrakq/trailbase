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

// Mock the auth services so the component reads brandName from a stable,
// controlled value and avoids the real /api/config/public endpoint and SDK.
vi.mock('../services/config.service', () => ({
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

vi.mock('../services/auth.service', () => ({
  authService: {
    init: vi.fn().mockResolvedValue(undefined),
    getAuthState: vi.fn().mockReturnValue({
      isAuthenticated: false,
      user: null,
      hasMfa: false,
    }),
    showLogin: vi.fn(),
  },
}));

import './auth-status';
import type { AuthStatus } from './auth-status';
import { themeService } from '@/features/theme';
import { localizationService } from '@/features/localization';

describe('auth-status', () => {
  let element: AuthStatus;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('theme', 'light');
    // LocalizationService is a no-op until init() runs; init() is idempotent.
    localizationService.init();
  });

  afterEach(() => {
    element?.remove();
    themeService.setTheme('light');
  });

  it('renders the light-theme logo src from /branding/logo-light.svg', async () => {
    themeService.setTheme('light');
    element = document.createElement('auth-status') as AuthStatus;
    document.body.appendChild(element);
    await element.updateComplete;

    const logo = element.shadowRoot?.querySelector('img.logo');
    expect(logo?.getAttribute('src')).toBe('/branding/logo-light.svg');
  });

  it('renders the dark-theme logo src from /branding/logo-dark.svg', async () => {
    themeService.setTheme('dark');
    element = document.createElement('auth-status') as AuthStatus;
    document.body.appendChild(element);
    await element.updateComplete;

    const logo = element.shadowRoot?.querySelector('img.logo');
    expect(logo?.getAttribute('src')).toBe('/branding/logo-dark.svg');
  });

  it('renders the runtime brandName in the title with "Welcome to"', async () => {
    element = document.createElement('auth-status') as AuthStatus;
    document.body.appendChild(element);
    await element.updateComplete;
    // connectedCallback sets brandName asynchronously after authService.init();
    // wait for the post-await re-render before asserting.
    await Promise.resolve();
    await element.updateComplete;

    const title = element.shadowRoot?.querySelector('.title');
    expect(title?.textContent).toContain('Welcome to');
    expect(title?.textContent).toContain('Custom Brand');
  });
});
