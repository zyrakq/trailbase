import { FetchError } from 'trailbase';
import { AuthError, AuthErrorCode } from '../types/auth-error';
import { trailbaseService } from './trailbase.service';

export interface TotpSetupData {
  /** otpauth:// URI for manual entry */
  totpUrl: string;
  /** Base64-encoded PNG of the QR code */
  qrPng: string;
}

// TOTP API wrapper — delegates to the official trailbase SDK Client methods:
//   client.registerTOTP(), client.confirmTOTP(), client.unregisterTOTP()
// Check the SDK Client interface before adding new raw fetch calls here.
class TotpService {
  private static instance: TotpService;

  private constructor() {}

  static getInstance(): TotpService {
    if (!TotpService.instance) {
      TotpService.instance = new TotpService();
    }
    return TotpService.instance;
  }

  /**
   * Begin TOTP setup: fetch the QR code PNG and the otpauth:// URL.
   *
   * Delegates to client.registerTOTP({ png: true }).
   * Returns { url: string, png: string | null } from the SDK.
   *
   * @throws AuthError(NETWORK_ERROR) on fetch failure
   * @throws AuthError(UNKNOWN) on non-200 response
   */
  async startSetup(): Promise<TotpSetupData> {
    const client = await trailbaseService.initClient();
    try {
      const data = await client.registerTOTP({ png: true });
      return { totpUrl: data.url, qrPng: data.png ?? '' };
    } catch (err) {
      if (err instanceof FetchError) {
        throw new AuthError(
          AuthErrorCode.UNKNOWN,
          `TOTP setup failed: ${err.status}`
        );
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during TOTP setup'
      );
    }
  }

  /**
   * Confirm TOTP setup by verifying the first code from the authenticator app.
   *
   * Delegates to client.confirmTOTP(totpUrl, code).
   *
   * @throws AuthError(INVALID_CREDENTIALS) on 401 (wrong code)
   * @throws AuthError(NETWORK_ERROR) on fetch failure
   * @throws AuthError(UNKNOWN) on other non-200 response
   */
  async confirmSetup(totpUrl: string, code: string): Promise<void> {
    const client = await trailbaseService.initClient();
    try {
      await client.confirmTOTP(totpUrl, code);
    } catch (err) {
      if (err instanceof FetchError) {
        if (err.status === 401) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid verification code'
          );
        }
        throw new AuthError(
          AuthErrorCode.UNKNOWN,
          `TOTP confirmation failed: ${err.status}`
        );
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during TOTP confirmation'
      );
    }
  }

  /**
   * Disable TOTP by providing the current authenticator code.
   *
   * Delegates to client.unregisterTOTP(code).
   *
   * @throws AuthError(INVALID_CREDENTIALS) on 401 (wrong code)
   * @throws AuthError(NETWORK_ERROR) on fetch failure
   * @throws AuthError(UNKNOWN) on other non-200 response
   */
  async disableTotp(code: string): Promise<void> {
    const client = await trailbaseService.initClient();
    try {
      await client.unregisterTOTP(code);
    } catch (err) {
      if (err instanceof FetchError) {
        if (err.status === 401) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid code. Please try again.'
          );
        }
        throw new AuthError(
          AuthErrorCode.UNKNOWN,
          `TOTP disable failed: ${err.status}`
        );
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during TOTP disable'
      );
    }
  }

  /**
   * Extract the TOTP secret from an otpauth:// URL for manual entry display.
   * Returns null if the URL cannot be parsed.
   *
   * Example: otpauth://totp/argiago:user@example.com?secret=JBSWY3DPEHPK3PXP&...
   */
  extractSecret(totpUrl: string): string | null {
    try {
      const url = new URL(totpUrl);
      return url.searchParams.get('secret');
    } catch {
      return null;
    }
  }
}

export const totpService = TotpService.getInstance();
