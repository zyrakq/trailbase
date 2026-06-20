import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeService } from './theme.service';

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

const FAVICON_LINK_IDS = ['icon-ico', 'icon-svg', 'apple-touch-icon'];

function removeFaviconLinks(): void {
  FAVICON_LINK_IDS.forEach((id) => {
    document.querySelectorAll(`link[id="${id}"]`).forEach((el) => el.remove());
  });
}

async function loadFaviconService(): Promise<{
  faviconService: import('./favicon.service').FaviconService;
  FaviconService: typeof import('./favicon.service').FaviconService;
  themeService: ThemeService;
}> {
  const faviconModule = await import('./favicon.service');
  const themeModule = await import('./theme.service');
  return {
    faviconService: faviconModule.faviconService,
    FaviconService: faviconModule.FaviconService,
    themeService: themeModule.themeService,
  };
}

describe('FaviconService', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    removeFaviconLinks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeFaviconLinks();
  });

  describe('path templates', () => {
    it('returns /branding/ paths for the light theme on init', async () => {
      const { faviconService } = await loadFaviconService();

      expect(faviconService.getFaviconPath('ico')).toBe('/branding/favicon-light.ico');
      expect(faviconService.getFaviconPath('svg')).toBe('/branding/favicon-light.svg');
      expect(faviconService.getFaviconPath('apple')).toBe(
        '/branding/favicons/apple-light.png'
      );
    });

    it('reflects the active theme in getFaviconPath() after a theme change', async () => {
      const { faviconService, themeService } = await loadFaviconService();
      themeService.setTheme('dark');

      expect(faviconService.getFaviconPath('ico')).toBe('/branding/favicon-dark.ico');
      expect(faviconService.getFaviconPath('svg')).toBe('/branding/favicon-dark.svg');
      expect(faviconService.getFaviconPath('apple')).toBe(
        '/branding/favicons/apple-dark.png'
      );
    });
  });

  describe('theme swapping', () => {
    it('creates link elements in document.head during auto-init', async () => {
      await loadFaviconService();

      for (const id of FAVICON_LINK_IDS) {
        const link = document.querySelector<HTMLLinkElement>(`link[id="${id}"]`);
        expect(link, `expected link#${id} to be present`).toBeTruthy();
      }
    });

    it('updates all favicon link hrefs when themeService changes theme', async () => {
      const { themeService } = await loadFaviconService();
      themeService.setTheme('light');

      const icoLink = document.querySelector<HTMLLinkElement>('link#icon-ico');
      const svgLink = document.querySelector<HTMLLinkElement>('link#icon-svg');
      const appleLink = document.querySelector<HTMLLinkElement>('link#apple-touch-icon');

      expect(icoLink?.getAttribute('href')).toBe('/branding/favicon-light.ico');
      expect(svgLink?.getAttribute('href')).toBe('/branding/favicon-light.svg');
      expect(appleLink?.getAttribute('href')).toBe('/branding/favicons/apple-light.png');

      themeService.setTheme('dark');

      expect(icoLink?.getAttribute('href')).toBe('/branding/favicon-dark.ico');
      expect(svgLink?.getAttribute('href')).toBe('/branding/favicon-dark.svg');
      expect(appleLink?.getAttribute('href')).toBe('/branding/favicons/apple-dark.png');
    });

    it('preserves correct rel and type attributes when creating links', async () => {
      await loadFaviconService();

      const icoLink = document.querySelector<HTMLLinkElement>('link#icon-ico');
      const svgLink = document.querySelector<HTMLLinkElement>('link#icon-svg');
      const appleLink = document.querySelector<HTMLLinkElement>('link#apple-touch-icon');

      expect(icoLink?.rel).toBe('icon');
      expect(icoLink?.type).toBe('image/x-icon');

      expect(svgLink?.rel).toBe('icon');
      expect(svgLink?.type).toBe('image/svg+xml');

      expect(appleLink?.rel).toBe('apple-touch-icon');
    });
  });

  describe('lifecycle', () => {
    it('reuses a single instance across calls (singleton)', async () => {
      const { faviconService, FaviconService } = await loadFaviconService();
      const same = FaviconService.getInstance();

      expect(same).toBe(faviconService);
    });

    it('stops reacting to theme changes after destroy()', async () => {
      const { faviconService, themeService } = await loadFaviconService();
      themeService.setTheme('light');

      faviconService.destroy();

      themeService.setTheme('dark');

      const icoLink = document.querySelector<HTMLLinkElement>('link#icon-ico');
      expect(icoLink?.getAttribute('href')).toBe('/branding/favicon-light.ico');
    });
  });
});
