// TrailBase API client — HTTP adapter only.
// Documentation: https://trailbase.io/documentation/auth
// OpenAPI: https://trailbase.io/api
import { AuthError, AuthErrorCode } from '../types/auth-error';
import type { LoginResult } from '../types/auth.types';

/**
 * Response from /api/auth/v1/status endpoint
 */
export interface LoginStatusResponse {
  auth_token: string | null;
  csrf_token: string | null;
  refresh_token: string | null;
}

/**
 * User information extracted from JWT token
 */
export interface TrailBaseUser {
  id: string;
  email?: string;
  verified?: boolean;
}

class TrailBaseService {
  private static instance: TrailBaseService;

  private constructor() {
    // TrailBase runs on the same origin — all URLs are relative
  }

  static getInstance(): TrailBaseService {
    if (!TrailBaseService.instance) {
      TrailBaseService.instance = new TrailBaseService();
    }
    return TrailBaseService.instance;
  }

  /**
   * Redirect the browser to the OAuth provider login page.
   *
   * @param provider - OAuth provider key (e.g. 'oidc0')
   * @param redirectUri - Where TrailBase should redirect after successful login
   */
  async login(provider: string = 'oidc0', redirectUri?: string): Promise<void> {
    let url = `/api/auth/v1/oauth/${provider}/login`;
    if (redirectUri) {
      url += `?redirect_uri=${encodeURIComponent(redirectUri)}`;
    }
    window.location.href = url;
  }

  /**
   * Fetch the current session status from TrailBase.
   * Returns null when the user is not authenticated (401).
   */
  async getLoginStatus(): Promise<LoginStatusResponse | null> {
    const response = await fetch('/api/auth/v1/status', {
      credentials: 'include',
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json() as Promise<LoginStatusResponse>;
  }

  /**
   * Sign out the current user.
   *
   * @param redirectUri - Optional redirect after logout
   */
  async logout(redirectUri?: string): Promise<void> {
    let url = '/api/auth/v1/logout';
    if (redirectUri) {
      url += `?redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.statusText}`);
    }
  }

  /**
   * Authenticate with email and password.
   *
   * Sends the absolute `redirect_uri` so TrailBase recognises it as a valid
   * redirect target and issues a 303 response with HttpOnly cookies (cookie
   * path). When `response.redirected` is true, fetch followed the 303 and
   * Set-Cookie headers were processed by the browser before the redirect was
   * followed — caller must navigate to `/auth/callback` to complete the session
   * handshake via the existing `oauth-callback` component.
   *
   * Falls back to the 200 JSON path if TrailBase does not issue a redirect
   * (e.g. when redirect_uri validation fails on the server side). On this path
   * the session does not survive a page reload.
   *
   * @param email - User email address
   * @param password - User password
   * @returns LoginResult discriminated union
   * @throws AuthError with a typed code on 401, 403, or network failure
   */
  async loginWithPassword(
    email: string,
    password: string
  ): Promise<LoginResult> {
    let response: Response;

    // Absolute redirect_uri is required — relative URIs are not recognised as
    // valid redirect targets by TrailBase or the OIDC provider (Kanidm).
    const callbackUrl = window.location.origin + '/auth/callback';

    try {
      response = await fetch('/api/auth/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, redirect_uri: callbackUrl }),
      });
    } catch {
      // fetch() itself threw — network-level failure (offline, DNS, CORS preflight)
      throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Network error during login');
    }

    // response.redirected is true when fetch followed a 303 and Set-Cookie was
    // processed by the browser. The final response is from /auth/callback (HTML).
    if (response.redirected) {
      return { type: 'redirect' };
    }

    if (response.status === 200) {
      const data = await response.json() as LoginStatusResponse;
      return { type: 'tokens', data };
    }

    if (response.status === 401) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    if (response.status === 403) {
      throw new AuthError(
        AuthErrorCode.MFA_REQUIRED,
        'Multi-factor authentication required'
      );
    }

    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      `Login failed: ${response.statusText}`
    );
  }
}

export const trailbaseService = TrailBaseService.getInstance();
