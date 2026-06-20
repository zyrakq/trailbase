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
      themeColor: '#ff6b35',
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
    }),
  },
}));

import './app-header';
import type { AppHeader } from './app-header';
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
});
