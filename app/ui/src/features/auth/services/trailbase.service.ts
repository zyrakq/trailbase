// TrailBase API client — wraps the official trailbase SDK.
// SDK docs: https://trailbase.io/documentation/auth
import { initClientFromCookies, type Client } from 'trailbase';
import { AuthError, AuthErrorCode } from '../types/auth-error';

/**
 * User information returned by the SDK after authentication.
 */
export interface TrailBaseUser {
  id: string;
  email?: string;
}

class TrailBaseService {
  private static instance: TrailBaseService;
  private clientPromise: Promise<Client> | null = null;

  private constructor() {}

  static getInstance(): TrailBaseService {
    if (!TrailBaseService.instance) {
      TrailBaseService.instance = new TrailBaseService();
    }
    return TrailBaseService.instance;
  }

  /**
   * Initialize (or return the cached) SDK client.
   *
   * initClientFromCookies() calls GET /api/auth/v1/status to restore a
   * previously established session from the HttpOnly cookie set by TrailBase.
   * This is the single entry point for auth state on every page load.
   */
  async initClient(): Promise<Client> {
    if (!this.clientPromise) {
      this.clientPromise = initClientFromCookies();
    }
    return this.clientPromise;
  }

  /**
   * Return the currently authenticated user, or null if not authenticated.
   * Requires initClient() to have been called first.
   */
  async getUser(): Promise<TrailBaseUser | null> {
    const client = await this.initClient();
    const user = client.user();
    if (!user) return null;
    return { id: user.id, email: user.email };
  }

  /**
   * Re-check the session cookie and update the SDK client state.
   * Called by oauth-callback.ts after TrailBase redirects back with a fresh cookie.
   */
  async refreshFromCookies(): Promise<void> {
    const client = await this.initClient();
    await client.checkCookies();
  }

  /**
   * Authenticate with email and password via the SDK.
   *
   * The SDK POSTs to /api/auth/v1/login without redirect_uri, receiving a
   * 200 JSON response. TrailBase sets an HttpOnly session cookie in the same
   * response, enabling session restore via initClientFromCookies() on reload.
   *
   * @throws AuthError with a typed code on 401, 403, or network failure
   */
  async loginWithPassword(email: string, password: string): Promise<void> {
    const client = await this.initClient();
    try {
      await client.login(email, password);
    } catch (err) {
      // Map SDK errors to our typed AuthError codes
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.toLowerCase().includes('credential')) {
        throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
      }
      if (msg.includes('403')) {
        throw new AuthError(AuthErrorCode.MFA_REQUIRED, 'Multi-factor authentication required');
      }
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Network error during login');
      }
      throw new AuthError(AuthErrorCode.UNKNOWN, `Login failed: ${msg}`);
    }
  }

  /**
   * Redirect the browser to the OAuth provider login page.
   * TrailBase handles the full OIDC exchange at /api/auth/v1/oauth/<provider>/callback.
   * After auth, TrailBase sets the session cookie and redirects to redirectUri.
   *
   * @param provider - OAuth provider key (e.g. 'oidc0')
   * @param redirectUri - SPA landing page after successful login (e.g. '/auth/callback')
   */
  async login(provider: string = 'oidc0', redirectUri?: string): Promise<void> {
    let url = `/api/auth/v1/oauth/${provider}/login`;
    if (redirectUri) {
      url += `?redirect_uri=${encodeURIComponent(redirectUri)}`;
    }
    window.location.href = url;
  }

  /**
   * Sign out the current user and reset the SDK client.
   */
  async logout(): Promise<void> {
    const client = await this.initClient();
    await client.logout();
    // Reset so the next initClient() call creates a fresh unauthenticated client
    this.clientPromise = null;
  }
}

export const trailbaseService = TrailBaseService.getInstance();
