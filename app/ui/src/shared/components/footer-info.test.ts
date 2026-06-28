import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// happy-dom 15.x does not expose localStorage until a window URL is set.
// localizationService.init() may read localStorage at module load; install a
// minimal in-memory polyfill BEFORE static imports resolve (mirrors
// app-header.test.ts). vi.hoisted is hoisted above imports by vitest.
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

// Mock configService: init() resolves immediately; getConfig() return value is
// reshaped per-test to drive each branding scenario. FooterInfo reads getConfig()
// after awaiting init() in connectedCallback.
vi.mock('@/features/auth/services/config.service', () => ({
  configService: {
    init: vi.fn().mockResolvedValue(undefined as never),
    getConfig: vi.fn(),
  },
}));

import './footer-info';
import type { FooterInfo } from './footer-info';
import { configService } from '@/features/auth/services/config.service';
import { localizationService } from '@/features/localization';

describe('footer-info', () => {
  let element: FooterInfo;

  beforeEach(() => {
    localStorage.clear();
    localizationService.init();
    vi.mocked(configService.init).mockResolvedValue(undefined as never);
    vi.mocked(configService.getConfig).mockReturnValue({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'velora',
      themeColorLight: '#ff6b35',
      themeColorDark: '#10b981',
      copyrightYear: 2024,
    });
  });

  afterEach(() => {
    element?.remove();
  });

  // connectedCallback awaits configService.init() (mocked to resolve on the
  // microtask queue); flush microtasks then wait for the state-triggered
  // re-render before asserting.
  async function mountFooter(): Promise<FooterInfo> {
    element = document.createElement('footer-info') as FooterInfo;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve));
    await element.updateComplete;
    return element;
  }

  it('renders copyright with the year and brand name from config', async () => {
    vi.mocked(configService.getConfig).mockReturnValue({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'Acme',
      themeColorLight: '#123456',
      themeColorDark: '#123456',
      copyrightYear: 2025,
    });

    const el = await mountFooter();

    const copyright = el.shadowRoot?.querySelector('.copyright');
    expect(copyright?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '© 2025 ACME. All rights reserved.'
    );
  });

  it('renders all three links with separators when every URL is present', async () => {
    vi.mocked(configService.getConfig).mockReturnValue({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'Acme',
      themeColorLight: '#123456',
      themeColorDark: '#123456',
      copyrightYear: 2025,
      termsUrl: 'https://example.com/terms',
      privacyUrl: 'https://example.com/privacy',
      supportUrl: 'https://example.com/support',
    });

    const el = await mountFooter();

    const links = el.shadowRoot?.querySelectorAll('.links a') ?? [];
    expect(links.length).toBe(3);
    expect(links[0]!.getAttribute('href')).toBe('https://example.com/terms');
    expect(links[1]!.getAttribute('href')).toBe('https://example.com/privacy');
    expect(links[2]!.getAttribute('href')).toBe('https://example.com/support');

    const separators = el.shadowRoot?.querySelectorAll('.separator') ?? [];
    expect(separators.length).toBe(2);
  });

  it('renders only present links with no dangling separators (partial branding)', async () => {
    vi.mocked(configService.getConfig).mockReturnValue({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'Acme',
      themeColorLight: '#123456',
      themeColorDark: '#123456',
      copyrightYear: 2025,
      termsUrl: 'https://example.com/terms',
    });

    const el = await mountFooter();

    const links = el.shadowRoot?.querySelectorAll('.links a') ?? [];
    expect(links.length).toBe(1);
    expect(links[0]!.getAttribute('href')).toBe('https://example.com/terms');

    const separators = el.shadowRoot?.querySelectorAll('.separator') ?? [];
    expect(separators.length).toBe(0);
  });

  it('renders no links and no separators when no URLs are configured', async () => {
    vi.mocked(configService.getConfig).mockReturnValue({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'Acme',
      themeColorLight: '#123456',
      themeColorDark: '#123456',
      copyrightYear: 2025,
    });

    const el = await mountFooter();

    expect(el.shadowRoot?.querySelectorAll('.links a').length).toBe(0);
    expect(el.shadowRoot?.querySelectorAll('.separator').length).toBe(0);

    const copyright = el.shadowRoot?.querySelector('.copyright');
    expect(copyright?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '© 2025 ACME. All rights reserved.'
    );
  });
});
