export interface PublicConfig {
  passwordAuthEnabled: boolean;
  registrationEnabled: boolean;
  otpEnabled: boolean;
  brandName: string;
  themeColorLight: string;
  themeColorDark: string;
  copyrightYear: number;
  termsUrl?: string;
  privacyUrl?: string;
  supportUrl?: string;
}

const DEFAULT_CONFIG: PublicConfig = {
  passwordAuthEnabled: true,
  registrationEnabled: true,
  otpEnabled: true,
  brandName: 'velora',
  themeColorLight: '#ff6b35',
  themeColorDark: '#10b981',
  copyrightYear: new Date().getFullYear(),
};

const STORAGE_KEY = 'publicConfig';
const DARK_MEDIA = '(prefers-color-scheme: dark)';

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
        themeColorLight: data.themeColorLight ?? DEFAULT_CONFIG.themeColorLight,
        themeColorDark: data.themeColorDark ?? DEFAULT_CONFIG.themeColorDark,
        copyrightYear: data.copyrightYear ?? DEFAULT_CONFIG.copyrightYear,
        termsUrl: data.termsUrl,
        privacyUrl: data.privacyUrl,
        supportUrl: data.supportUrl,
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  async init(): Promise<PublicConfig> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      const cached = this.readCache();
      if (cached) {
        this.cachedConfig = cached;
      } else {
        const config = await this.fetchConfig();
        this.writeCache(config);
        this.cachedConfig = config;
      }
      this.applyBranding(this.cachedConfig);
      return this.cachedConfig;
    })();
    return this.initPromise;
  }

  getConfig(): PublicConfig {
    return { ...this.cachedConfig };
  }

  private readCache(): PublicConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        version: string;
        config: Partial<PublicConfig>;
      };
      if (parsed.version !== __BUILD_VERSION__) return null;
      const c = parsed.config;
      return {
        passwordAuthEnabled:
          c.passwordAuthEnabled ?? DEFAULT_CONFIG.passwordAuthEnabled,
        registrationEnabled:
          c.registrationEnabled ?? DEFAULT_CONFIG.registrationEnabled,
        otpEnabled: c.otpEnabled ?? DEFAULT_CONFIG.otpEnabled,
        brandName: c.brandName ?? DEFAULT_CONFIG.brandName,
        themeColorLight: c.themeColorLight ?? DEFAULT_CONFIG.themeColorLight,
        themeColorDark: c.themeColorDark ?? DEFAULT_CONFIG.themeColorDark,
        copyrightYear: c.copyrightYear ?? DEFAULT_CONFIG.copyrightYear,
        termsUrl: c.termsUrl,
        privacyUrl: c.privacyUrl,
        supportUrl: c.supportUrl,
      };
    } catch {
      return null;
    }
  }

  private writeCache(config: PublicConfig): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: __BUILD_VERSION__, config })
      );
    } catch {
      // private mode / quota exceeded — next init() fetches fresh
    }
  }

  private applyBranding(config: PublicConfig): void {
    document.title = config.brandName;
    this.ensureThemeColorMeta(null).setAttribute(
      'content',
config.themeColorLight
     );
     this.ensureThemeColorMeta(DARK_MEDIA).setAttribute(
       'content',
      config.themeColorDark
    );
  }

  private ensureThemeColorMeta(media: string | null): HTMLMetaElement {
    const metas = document.head.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    let meta: HTMLMetaElement | undefined;
    metas.forEach((m) => {
      const mMedia = m.getAttribute('media');
      if (media === null && mMedia === null) meta = m;
      else if (media !== null && mMedia === media) meta = m;
    });
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      if (media) meta.setAttribute('media', media);
      document.head.appendChild(meta);
    }
    return meta;
  }
}

export const configService = ConfigService.getInstance();
