// Public config service — fetches specific feature flags for the frontend.
// No caching: each call fetches fresh data from the server.
export interface PublicConfig {
  /** Whether password-based login, registration, and OTP UI should be shown. */
  passwordAuthEnabled: boolean;
  registrationEnabled: boolean;
  /** Whether OTP/TOTP two-factor authentication is enabled server-side. */
  otpEnabled: boolean;
  /** Brand name used for the document title. */
  brandName: string;
  /** Hex color used by the browser chrome (status bar, address bar). */
  themeColor: string;
}

const DEFAULT_CONFIG: PublicConfig = {
  passwordAuthEnabled: true,
  registrationEnabled: true,
  otpEnabled: true,
  brandName: 'velora',
  themeColor: '#ff6b35',
};

const META_THEME_COLOR_SELECTOR = 'meta[name="theme-color"]';

class ConfigService {
  private static instance: ConfigService;

  private cachedConfig: PublicConfig = DEFAULT_CONFIG;
  private initPromise: Promise<PublicConfig> | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Fetch public configuration flags from /api/config/public.
   *
   * On any failure, defaults to fail-open. TrailBase enforces the real values
   * server-side regardless.
   */
  async fetchConfig(): Promise<PublicConfig> {
    try {
      const response = await fetch('/api/config/public');
      if (!response.ok) return DEFAULT_CONFIG;
      const data = (await response.json()) as Partial<PublicConfig>;
      return {
        passwordAuthEnabled:
          data.passwordAuthEnabled ?? DEFAULT_CONFIG.passwordAuthEnabled,
        registrationEnabled:
          data.registrationEnabled ?? DEFAULT_CONFIG.registrationEnabled,
        otpEnabled: data.otpEnabled ?? DEFAULT_CONFIG.otpEnabled,
        brandName: data.brandName ?? DEFAULT_CONFIG.brandName,
        themeColor: data.themeColor ?? DEFAULT_CONFIG.themeColor,
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Initialize the cached config once and apply branding to the document.
   * Idempotent — subsequent calls return the same in-flight (or completed) promise.
   *
   * Side effects:
   *  - sets document.title to config.brandName
   *  - updates the <meta name="theme-color"> content to config.themeColor
   */
  async init(): Promise<PublicConfig> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.fetchConfig().then((config) => {
      this.cachedConfig = config;
      this.applyBranding(config);
      return config;
    });
    return this.initPromise;
  }

  /**
   * Return a copy of the currently cached config. Before init() resolves,
   * returns the fail-open defaults so callers never see an uninitialized value.
   */
  getConfig(): PublicConfig {
    return { ...this.cachedConfig };
  }

  private applyBranding(config: PublicConfig): void {
    document.title = config.brandName;
    const meta = document.head.querySelector<HTMLMetaElement>(
      META_THEME_COLOR_SELECTOR
    );
    if (meta) {
      meta.setAttribute('content', config.themeColor);
    }
  }
}

export const configService = ConfigService.getInstance();
