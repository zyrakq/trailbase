import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.hoisted(() => {
  if (typeof localStorage !== 'undefined') return;
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.has(key) ? (store.get(key) as string) : null;
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
    },
    writable: true,
    configurable: true,
  });
});

describe('ConfigService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    document.head
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function mockFetchResponse(body: unknown, ok = true) {
    fetchMock.mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    });
  }

  it('fetches and applies branding on cache miss', async () => {
    mockFetchResponse({
      brandName: 'Custom',
      themeColorLight: '#abcdef',
      themeColorDark: '#123456',
      copyrightYear: 2024,
    });

    const { configService } = await import('./config.service');
    const config = await configService.init();

    expect(config).toEqual({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'Custom',
      themeColorLight: '#abcdef',
      themeColorDark: '#123456',
      copyrightYear: 2024,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.title).toBe('Custom');
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute('content')
    ).toBe('#abcdef');
    expect(
      document
        .querySelector('meta[name="theme-color"][media]')
        ?.getAttribute('content')
    ).toBe('#123456');
  });

  it('falls back to defaults when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));

    const { configService } = await import('./config.service');
    const config = await configService.init();

    expect(config.brandName).toBe('velora');
    expect(config.themeColorLight).toBe('#ff6b35');
    expect(config.themeColorDark).toBe('#10b981');
  });

  it('uses cached config without fetching when build version matches', async () => {
    localStorage.setItem(
      'publicConfig',
      JSON.stringify({
        version: __BUILD_VERSION__,
        config: {
          brandName: 'Cached',
          themeColorLight: '#ccc',
          themeColorDark: '#333',
        },
      })
    );

    const { configService } = await import('./config.service');
    const config = await configService.init();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(config.brandName).toBe('Cached');
    expect(config.themeColorLight).toBe('#ccc');
  });

  it('fetches fresh config when build version mismatches', async () => {
    localStorage.setItem(
      'publicConfig',
      JSON.stringify({ version: 'stale', config: { brandName: 'Old' } })
    );
    mockFetchResponse({ brandName: 'Fresh' });

    const { configService } = await import('./config.service');
    const config = await configService.init();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(config.brandName).toBe('Fresh');
  });

  it('applies DEFAULT_CONFIG for missing fields in stale cache (schema evolution)', async () => {
    localStorage.setItem(
      'publicConfig',
      JSON.stringify({
        version: __BUILD_VERSION__,
        config: { brandName: 'Old', themeColorLight: '#old' },
      })
    );

    const { configService } = await import('./config.service');
    const config = await configService.init();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(config.brandName).toBe('Old');
    expect(config.themeColorLight).toBe('#old');
    expect(config.themeColorDark).toBe('#10b981');
  });
});