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
   * Authenticate with email and password using a form-encoded POST.
   *
   * TrailBase only sets HttpOnly session cookies (COOKIE_AUTH_TOKEN,
   * COOKIE_REFRESH_TOKEN) on the form path, NOT on the JSON path. The JSON
   * path returns tokens in the response body and stores them in SDK memory
   * only — they are lost on page reload. The form path triggers a 303 with
   * Set-Cookie headers, which the browser processes while following the
   * redirect. After this call, checkCookies()/initClientFromCookies() will
   * find a valid cookie and restore the session on any subsequent page load.
   *
   * On error TrailBase redirects to `redirect_uri?alert=Login Failed: <code>`,
   * which we parse to throw a typed AuthError.
   *
   * @throws AuthError with a typed code on bad credentials, MFA required, or network failure
   */
  async loginWithPassword(email: string, password: string): Promise<void> {
    const body = new URLSearchParams();
    body.set('email', email);
    body.set('password', password);
    // TrailBase redirects here on both success and failure.
    // The cookie is set before this redirect on the success path.
    body.set('redirect_uri', '/auth/callback');

    let response: Response;
    try {
      response = await fetch('/api/auth/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        // redirect: 'follow' (default) — browser follows the 303, cookies are
        // processed from the redirect response before the follow happens.
        body: body.toString(),
      });
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during login'
      );
    }

    // After following the redirect, check the final URL for an error param.
    if (response.redirected) {
      const finalUrl = new URL(response.url, window.location.origin);
      const alert = finalUrl.searchParams.get('alert');
      if (alert) {
        if (alert.includes('401')) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password'
          );
        }
        if (alert.includes('403')) {
          throw new AuthError(
            AuthErrorCode.MFA_REQUIRED,
            'Multi-factor authentication required'
          );
        }
        throw new AuthError(AuthErrorCode.UNKNOWN, alert);
      }
      // No alert param — success, cookie is now set.
      return;
    }

    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      `Unexpected login response: ${response.status}`
    );
  }

  /**
   * Register a new user with email and password.
   *
   * TrailBase requires `password_repeat` matching `password` in the request body.
   * Uses JSON POST to /api/auth/v1/register. TrailBase may require email
   * verification depending on server configuration — in that case the user
   * will not be immediately authenticated after registration.
   *
   * @throws AuthError with a typed code on failure
   */
  async registerWithPassword(email: string, password: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch('/api/auth/v1/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, password_repeat: password }),
      });
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during registration'
      );
    }

    if (response.ok) {
      return;
    }

    // 424: account created, but verification email failed to send (e.g. no SMTP)
    if (response.status === 424) {
      throw new AuthError(
        AuthErrorCode.EMAIL_NOT_SENT,
        'Account created but verification email failed'
      );
    }

    const text = await response.text().catch(() => '');
    if (response.status === 409 || text.toLowerCase().includes('already')) {
      throw new AuthError(
        AuthErrorCode.EMAIL_TAKEN,
        'Email already registered'
      );
    }
    if (response.status === 400 && text.toLowerCase().includes('too short')) {
      throw new AuthError(
        AuthErrorCode.WEAK_PASSWORD,
        'Password does not meet requirements'
      );
    }
    if (response.status === 403) {
      throw new AuthError(
        AuthErrorCode.REGISTRATION_DISABLED,
        'Registration is disabled'
      );
    }
    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      text || `Registration failed: ${response.status}`
    );
  }

  /**
   * Request a new verification email for an unverified account.
   *
   * Calls GET /api/auth/v1/verify_email/trigger — TrailBase rate-limits this
   * to once per 4 hours per email address.
   *
   * @throws AuthError RATE_LIMITED if the 4-hour window has not elapsed
   * @throws AuthError NETWORK_ERROR on fetch failure
   */
  async resendVerificationEmail(email: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(
        `/api/auth/v1/verify_email/trigger?email=${encodeURIComponent(email)}`,
        { credentials: 'include' }
      );
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during verification email resend'
      );
    }

    if (response.ok) {
      return;
    }

    if (response.status === 429) {
      throw new AuthError(
        AuthErrorCode.RATE_LIMITED,
        'Verification email already sent recently'
      );
    }

    if (response.status === 424) {
      throw new AuthError(
        AuthErrorCode.EMAIL_NOT_SENT,
        'Verification email could not be sent'
      );
    }

    const text = await response.text().catch(() => '');
    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      text || `Resend failed: ${response.status}`
    );
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
