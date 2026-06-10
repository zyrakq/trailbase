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
  /** True if the user has TOTP/MFA enabled. Sourced from the SDK User.mfa field. */
  mfa?: boolean;
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
    return { id: user.id, email: user.email, mfa: user.mfa };
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
   * `mfa_redirect_uri` tells TrailBase where to redirect when the account has
   * TOTP enabled. Without it, TrailBase returns 400 "?mfa_redirect required"
   * on the form path. With it, TrailBase redirects to
   * `<mfa_redirect_uri>?mfa_token=<jwt>` instead of completing the login.
   *
   * On credential error TrailBase redirects to `redirect_uri?alert=Login Failed: <code>`,
   * which we parse to throw a typed AuthError.
   *
   * @throws AuthError with a typed code on bad credentials, MFA required, or network failure
   */
  async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ requiresMfa: true; mfaToken: string } | void> {
    const body = new URLSearchParams();
    body.set('email', email);
    body.set('password', password);
    // TrailBase redirects here on both success and failure.
    // The cookie is set before this redirect on the success path.
    body.set('redirect_uri', '/auth/callback');
    // TrailBase redirects here (with ?mfa_token=<jwt>) when the account has TOTP enabled.
    // Without this parameter, TrailBase returns 400 "?mfa_redirect required" instead.
    body.set('mfa_redirect_uri', '/auth/mfa-pending');

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

    if (response.redirected) {
      const finalUrl = new URL(response.url, window.location.origin);

      // MFA required: TrailBase redirected to /auth/mfa-pending?mfa_token=<jwt>
      const mfaToken = finalUrl.searchParams.get('mfa_token');
      if (mfaToken) {
        return { requiresMfa: true as const, mfaToken };
      }

      // Login failed: TrailBase redirected back with ?alert=Login Failed: <code>
      const alert = finalUrl.searchParams.get('alert');
      if (alert) {
        if (alert.includes('401')) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password'
          );
        }
        throw new AuthError(AuthErrorCode.UNKNOWN, alert);
      }

      // No alert param, no mfa_token — success, cookie is now set.
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
   * Request a password-reset email for the given address.
   *
   * Calls POST /api/auth/v1/reset_password/request. TrailBase always returns
   * 200 for known AND unknown emails (anti-enumeration). The only non-200
   * responses are 429 (rate-limited) and 424 (SMTP failure).
   *
   * @throws AuthError RATE_LIMITED on 429
   * @throws AuthError EMAIL_NOT_SENT on 424
   * @throws AuthError UNKNOWN on 400 or other non-200
   * @throws AuthError NETWORK_ERROR on fetch failure
   */
  async requestPasswordReset(email: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch('/api/auth/v1/reset_password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during password reset request'
      );
    }

    if (response.ok) {
      return;
    }

    if (response.status === 429) {
      throw new AuthError(
        AuthErrorCode.RATE_LIMITED,
        'Password reset email already sent recently'
      );
    }

    if (response.status === 424) {
      throw new AuthError(
        AuthErrorCode.EMAIL_NOT_SENT,
        'Could not send password reset email'
      );
    }

    const text2 = await response.text().catch(() => '');
    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      text2 || `Password reset request failed: ${response.status}`
    );
  }

  /**
   * Complete a password reset by submitting the new password and the JWT token
   * from the reset email link.
   *
   * Calls POST /api/auth/v1/reset_password/update. On 400, inspects the
   * response text to distinguish an invalid/expired token from a password
   * policy violation — if the text contains "token" or "invalid" it is a
   * token error; otherwise it is a policy error surfaced as UNKNOWN with the
   * server message so the caller can display it verbatim.
   *
   * @throws AuthError UNKNOWN (message = 'invalid-token') on token-related 400
   * @throws AuthError UNKNOWN (server message) on password-policy 400
   * @throws AuthError NETWORK_ERROR on fetch failure
   * @throws AuthError UNKNOWN on any other non-200
   */
  async resetPassword(token: string, password: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch('/api/auth/v1/reset_password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          password,
          password_repeat: password,
          password_reset_token: token,
        }),
      });
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during password reset'
      );
    }

    if (response.ok) {
      return;
    }

    const text3 = await response.text().catch(() => '');

    if (response.status === 400) {
      const lower = text3.toLowerCase();
      if (
        lower.includes('token') ||
        lower.includes('invalid') ||
        lower.includes('expired')
      ) {
        throw new AuthError(AuthErrorCode.UNKNOWN, 'invalid-token');
      }
      // Password policy violation — surface server message verbatim
      throw new AuthError(
        AuthErrorCode.UNKNOWN,
        text3 || 'Password does not meet requirements'
      );
    }

    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      text3 || `Password reset failed: ${response.status}`
    );
  }

  /**
   * Complete MFA login by submitting a TOTP code via a form-encoded POST.
   *
   * Called after `loginWithPassword()` returns `requiresMfa: true`.
   * Uses the form path (not the SDK JSON path) so TrailBase sets HttpOnly
   * cookies identically to regular login. The JSON path (client.loginSecond())
   * only returns tokens in memory — they are lost on page reload.
   *
   * TrailBase behavior on the form path:
   * - Correct TOTP → 303 redirect to `redirect_uri` with cookies set.
   * - Wrong TOTP  → raw 401 (not redirected).
   *
   * @throws AuthError(INVALID_CREDENTIALS) on 401 (wrong TOTP code)
   * @throws AuthError(NETWORK_ERROR) on fetch failure
   * @throws AuthError(UNKNOWN) on any other non-redirected response
   */
  async loginWithMfa(mfaToken: string, totpCode: string): Promise<void> {
    const body = new URLSearchParams();
    body.set('mfa_token', mfaToken);
    body.set('totp', totpCode);
    body.set('redirect_uri', '/auth/callback');

    let response: Response;
    try {
      response = await fetch('/api/auth/v1/login_mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: body.toString(),
      });
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error during MFA login'
      );
    }

    if (response.redirected) {
      // Success — cookies are set via the 303 redirect headers.
      return;
    }

    // Wrong TOTP: TrailBase returns raw 401 on the form path (not redirected).
    if (response.status === 401) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid MFA code'
      );
    }

    throw new AuthError(
      AuthErrorCode.UNKNOWN,
      `MFA login failed: ${response.status}`
    );
  }

  /**
   * Fetch profile flags from the auth-ui WASM component.
   *
   * Returns `{ showOtpSection }` for the currently authenticated user.
   * The server decides whether to show the OTP/TOTP section based on whether
   * the account is OAuth-based and whether password auth is enabled.
   *
   * Returns null on 401 (not authenticated) or any non-OK response.
   *
   * @throws AuthError(NETWORK_ERROR) on fetch failure
   */
  async fetchUserProfile(): Promise<{
    showOtpSection: boolean;
  } | null> {
    let response: Response;
    try {
      response = await fetch('/_/auth/api/profile', { credentials: 'include' });
    } catch {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Network error fetching profile'
      );
    }

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      show_otp_section: boolean;
    };
    return { showOtpSection: data.show_otp_section };
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
