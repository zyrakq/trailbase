import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ConfigService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Reset document state to a known baseline so we can assert that
    // init() rewrites it. happy-dom starts without the index.html shell.
    document.title = 'initial-title';
    let meta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', '#000000');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function loadService() {
    return import('./config.service');
  }

  function mockFetchResponse(body: unknown, ok = true) {
    fetchMock.mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    });
  }

  function mockFetchReject() {
    fetchMock.mockRejectedValueOnce(new Error('network failure'));
  }

  it('init() fetches the config and caches it on success', async () => {
    mockFetchResponse({
      passwordAuthEnabled: false,
      registrationEnabled: false,
      otpEnabled: false,
      brandName: 'Custom Brand',
      themeColor: '#abcdef',
    });

    const { configService } = await loadService();
    const config = await configService.init();

    expect(config).toEqual({
      passwordAuthEnabled: false,
      registrationEnabled: false,
      otpEnabled: false,
      brandName: 'Custom Brand',
      themeColor: '#abcdef',
    });
    expect(configService.getConfig()).toEqual(config);
  });

  it('init() requests /api/config/public', async () => {
    mockFetchResponse({});

    const { configService } = await loadService();
    await configService.init();

    expect(fetchMock).toHaveBeenCalledWith('/api/config/public');
  });

  it('init() falls back to defaults when fetch rejects', async () => {
    mockFetchReject();

    const { configService } = await loadService();
    const config = await configService.init();

    expect(config).toEqual({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'velora',
      themeColor: '#ff6b35',
    });
    expect(configService.getConfig()).toEqual(config);
  });

  it('init() falls back to defaults when response is not ok', async () => {
    mockFetchResponse({}, false);

    const { configService } = await loadService();
    const config = await configService.init();

    expect(config.brandName).toBe('velora');
    expect(config.themeColor).toBe('#ff6b35');
  });

  it('init() applies brandName to document.title', async () => {
    mockFetchResponse({ brandName: 'My Brand', themeColor: '#112233' });

    const { configService } = await loadService();
    await configService.init();

    expect(document.title).toBe('My Brand');
  });

  it('init() applies themeColor to <meta name="theme-color">', async () => {
    mockFetchResponse({ brandName: 'My Brand', themeColor: '#112233' });

    const { configService } = await loadService();
    await configService.init();

    const meta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    expect(meta?.getAttribute('content')).toBe('#112233');
  });

  it('init() applies default branding when fetch fails (fail-open side effects)', async () => {
    mockFetchReject();

    const { configService } = await loadService();
    await configService.init();

    expect(document.title).toBe('velora');
    const meta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    expect(meta?.getAttribute('content')).toBe('#ff6b35');
  });

  it('init() is idempotent: concurrent calls share the in-flight fetch', async () => {
    mockFetchResponse({ brandName: 'Cached', themeColor: '#00ff00' });

    const { configService } = await loadService();
    const p1 = configService.init();
    const p2 = configService.init();

    await Promise.all([p1, p2]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('init() does not re-fetch on subsequent calls after it resolved', async () => {
    mockFetchResponse({ brandName: 'Cached', themeColor: '#00ff00' });

    const { configService } = await loadService();
    await configService.init();
    await configService.init();
    await configService.init();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getConfig() before init() returns the fail-open defaults without fetching', async () => {
    const { configService } = await loadService();
    const config = configService.getConfig();

    expect(config).toEqual({
      passwordAuthEnabled: true,
      registrationEnabled: true,
      otpEnabled: true,
      brandName: 'velora',
      themeColor: '#ff6b35',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('getConfig() returns a defensive copy (mutations do not leak)', async () => {
    mockFetchResponse({ brandName: 'Cached', themeColor: '#00ff00' });

    const { configService } = await loadService();
    await configService.init();

    const first = configService.getConfig();
    first.brandName = 'Mutated';
    first.themeColor = '#000000';

    const second = configService.getConfig();
    expect(second.brandName).toBe('Cached');
    expect(second.themeColor).toBe('#00ff00');
  });
});
