import type { AuthState, User } from '../types/auth.types';
import { trailbaseService, type TrailBaseUser } from './trailbase.service';
import { AuthError, AuthErrorCode } from '../types/auth-error';

// Side-effect import: ensures <auth-modal> custom element is registered
// before any code attempts to create one via showLogin().
import '../components/auth-modal.ts';
import type { AuthModal } from '../components/auth-modal.ts';

// Authentication service — application state manager.
// Owns auth state, delegates HTTP and session management to trailbaseService (SDK).
class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    hasMfa: false,
  };
  private initPromise: Promise<void> | null = null;
  private authModal: AuthModal | null = null;

  private constructor() {
    // Initialization is deferred — components call init() explicitly
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth state by restoring the TrailBase session from cookie.
   * Idempotent — subsequent calls return the same promise.
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.loadAuthState();
    return this.initPromise;
  }

  /**
   * Load authentication state from the SDK client.
   * initClient() calls GET /api/auth/v1/status to restore session from cookie.
   * hasMfa is sourced from the SDK User.mfa field — no manual tracking needed.
   */
  private async loadAuthState(): Promise<void> {
    try {
      const trailbaseUser = await trailbaseService.getUser();

      if (trailbaseUser) {
        this.authState = {
          isAuthenticated: true,
          user: this.mapTrailBaseUser(trailbaseUser),
          hasMfa: trailbaseUser.mfa ?? false,
        };
      } else {
        this.authState = { isAuthenticated: false, user: null, hasMfa: false };
      }
    } catch {
      this.notify(
        'Failed to load authentication state. Please refresh the page.',
        'warning'
      );
      this.authState = { isAuthenticated: false, user: null, hasMfa: false };
    } finally {
      this.notifyAuthStateChange();
    }
  }

  private mapTrailBaseUser(tbUser: TrailBaseUser): User {
    const tbAny = tbUser as unknown as Record<string, unknown>;
    const admin = typeof tbAny['admin'] === 'boolean' ? tbAny['admin'] : undefined;
    return {
      id: tbUser.id,
      username: tbUser.email || tbUser.id,
      email: tbUser.email,
      displayName: tbUser.email,
      avatarUrl: `/api/auth/v1/avatar/${tbUser.id}`,
      admin,
    };
  }

  isAdmin(): boolean {
    return Boolean(this.authState.user?.admin);
  }

  /**
   * Return a snapshot of the current authentication state.
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Return true when a user is currently authenticated.
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Return the current user, or null if not authenticated.
   */
  getUser(): User | null {
    return this.authState.user ? { ...this.authState.user } : null;
  }

  /**
   * Initiate OAuth/OIDC login by redirecting the browser to the provider.
   *
   * @param provider - OAuth provider key (default: 'oidc0')
   * @param redirectUri - Where to redirect after successful login
   */
  async signIn(
    provider: string = 'oidc0',
    redirectUri?: string
  ): Promise<void> {
    await trailbaseService.login(provider, redirectUri);
  }

  /**
   * Open the authentication modal. Creates a single <auth-modal> instance
   * appended to document.body and reuses it on subsequent calls.
   */
  showLogin(): void {
    if (!this.authModal) {
      this.authModal = document.createElement('auth-modal') as AuthModal;
      document.body.appendChild(this.authModal);
    }
    this.authModal.open();
  }

  /**
   * Authenticate with email and password.
   *
   * Returns `{ requiresMfa: true; mfaToken: string }` when the account has
   * TOTP enabled — the caller (auth-modal) must prompt for the TOTP code and
   * call `loginWithMfa()` to complete authentication.
   *
   * Returns void on successful direct login (no MFA required).
   *
   * @throws AuthError — propagated from trailbaseService (typed codes)
   */
  async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ requiresMfa: true; mfaToken: string } | void> {
    const result = await trailbaseService.loginWithPassword(email, password);
    if (result && result.requiresMfa) {
      return result;
    }
    await this.refresh();
  }

  /**
   * Complete MFA login by submitting a TOTP code.
   *
   * On success, loads auth state with `hasMfa: true` and notifies listeners.
   *
   * @throws AuthError(INVALID_CREDENTIALS) on wrong code
   * @throws AuthError(NETWORK_ERROR) on fetch failure
   */
  async loginWithMfa(mfaToken: string, totpCode: string): Promise<void> {
    await trailbaseService.loginWithMfa(mfaToken, totpCode);
    // Use refresh() (not loadAuthState directly) so the SDK re-reads the new
    // HttpOnly cookies that TrailBase set via the form path 303 redirect.
    await this.refresh();
  }

  /**
   * Register a new user with email and password.
   *
   * After successful registration, attempts to log the user in automatically.
   * Returns a result object indicating whether verification is required and
   * whether the verification email was successfully sent.
   *
   * @throws AuthError — propagated from trailbaseService except EMAIL_NOT_SENT
   */
  async registerWithPassword(
    email: string,
    password: string
  ): Promise<{ requiresVerification: boolean; emailSent: boolean }> {
    try {
      await trailbaseService.registerWithPassword(email, password);
    } catch (err) {
      // 424: account was created but verification email failed (e.g. no SMTP)
      if (
        err instanceof AuthError &&
        err.code === AuthErrorCode.EMAIL_NOT_SENT
      ) {
        return { requiresVerification: true, emailSent: false };
      }
      throw err;
    }

    // Attempt auto-login after registration
    try {
      await trailbaseService.loginWithPassword(email, password);
      await this.refresh();
      return { requiresVerification: false, emailSent: true };
    } catch {
      // Registration succeeded but auto-login failed — email verification is pending
      return { requiresVerification: true, emailSent: true };
    }
  }

  /**
   * Request a new verification email for an unverified account.
   * Delegates to trailbaseService — rate-limited to once per 4 hours by TrailBase.
   *
   * @throws AuthError RATE_LIMITED or NETWORK_ERROR on failure
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await trailbaseService.resendVerificationEmail(email);
  }

  /**
   * Request a password-reset email for the given address.
   * Delegates to trailbaseService — rate-limited to once per 60 minutes by TrailBase.
   *
   * @throws AuthError RATE_LIMITED, EMAIL_NOT_SENT, NETWORK_ERROR, or UNKNOWN
   */
  async requestPasswordReset(email: string): Promise<void> {
    await trailbaseService.requestPasswordReset(email);
  }

  /**
   * Complete a password reset using the JWT token from the email link.
   * Delegates to trailbaseService.
   *
   * @throws AuthError UNKNOWN('invalid-token') when token is expired/malformed
   * @throws AuthError UNKNOWN(serverMessage) on password policy violation
   * @throws AuthError NETWORK_ERROR on fetch failure
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await trailbaseService.resetPassword(token, password);
  }

  /**
   * Sign out the current user and clear local auth state.
   */
  async signOut(): Promise<void> {
    try {
      await trailbaseService.logout();
      this.authState = { isAuthenticated: false, user: null, hasMfa: false };
    } catch (error) {
      this.notify('Failed to sign out. Please try again.', 'error', 'signout');
      throw error;
    } finally {
      this.notifyAuthStateChange();
    }
  }

  /**
   * Re-read auth state from TrailBase. Called by oauth-callback.ts after the
   * browser returns from the OIDC redirect flow.
   *
   * checkCookies() forces the SDK to re-read the session cookie that TrailBase
   * set at /api/auth/v1/oauth/<provider>/callback before redirecting here.
   */
  async refresh(): Promise<void> {
    await trailbaseService.refreshFromCookies();
    await this.loadAuthState();
  }

  /**
   * Dispatch 'auth-state-updated' so UI components (AuthStatus, guards) react
   * to auth state changes without polling.
   */
  private notifyAuthStateChange(): void {
    window.dispatchEvent(
      new CustomEvent('auth-state-updated', {
        detail: { ...this.authState },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Dispatch a 'notification-add' toast event to the notification system.
   */
  private notify(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    prefix = 'auth'
  ): void {
    window.dispatchEvent(
      new CustomEvent('notification-add', {
        detail: { id: `${prefix}-${Date.now()}`, message, type },
        bubbles: true,
        composed: true,
      })
    );
  }
}

export const authService = AuthService.getInstance();
