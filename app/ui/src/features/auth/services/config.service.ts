// Public config service — fetches argiago-specific feature flags for the frontend.
// No caching: each call fetches fresh data from the server.

export interface PublicConfig {
  /** Whether password-based login, registration, and OTP UI should be shown. */
  passwordAuthEnabled: boolean;
  registrationEnabled: boolean;
  /** Whether OTP/TOTP two-factor authentication is enabled server-side. */
  otpEnabled: boolean;
}

const DEFAULT_CONFIG: PublicConfig = {
  passwordAuthEnabled: true,
  registrationEnabled: true,
  otpEnabled: true,
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
        passwordAuthEnabled: data.passwordAuthEnabled ?? DEFAULT_CONFIG.passwordAuthEnabled,
        registrationEnabled: data.registrationEnabled ?? DEFAULT_CONFIG.registrationEnabled,
        otpEnabled: data.otpEnabled ?? DEFAULT_CONFIG.otpEnabled,
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}

export const configService = ConfigService.getInstance();
