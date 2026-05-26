// Public config service — fetches server-side feature flags for the frontend.
// No caching: each call fetches fresh data from the server.

export interface PublicConfig {
  registrationEnabled: boolean;
}

const DEFAULT_CONFIG: PublicConfig = {
  registrationEnabled: true,
};

class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Fetch public configuration flags from the server.
   *
   * Reads disable_password_auth from the live TrailBase config — changes
   * made through the admin panel are reflected immediately.
   *
   * On any failure (network error, non-2xx), defaults to
   * registrationEnabled: true (fail-open). TrailBase will still enforce
   * the real value server-side via the 403 REGISTRATION_DISABLED error.
   */
  async fetchConfig(): Promise<PublicConfig> {
    try {
      const response = await fetch('/api/config/public');
      if (!response.ok) {
        return DEFAULT_CONFIG;
      }
      return (await response.json()) as PublicConfig;
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}

export const configService = ConfigService.getInstance();
