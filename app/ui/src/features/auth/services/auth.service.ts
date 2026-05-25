import type { AuthState, User } from '../types/auth.types';
import { trailbaseService, type TrailBaseUser } from './trailbase.service';

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
   */
  private async loadAuthState(): Promise<void> {
    try {
      const trailbaseUser = await trailbaseService.getUser();

      if (trailbaseUser) {
        this.authState = {
          isAuthenticated: true,
          user: this.mapTrailBaseUser(trailbaseUser),
        };
      } else {
        this.authState = { isAuthenticated: false, user: null };
      }
    } catch {
      window.dispatchEvent(
        new CustomEvent('notification-add', {
          detail: {
            id: `auth-error-${Date.now()}`,
            message:
              'Failed to load authentication state. Please refresh the page.',
            type: 'warning' as const,
          },
          bubbles: true,
          composed: true,
        })
      );
      this.authState = { isAuthenticated: false, user: null };
    } finally {
      this.notifyAuthStateChange();
    }
  }

  /**
   * Map a TrailBase user object to the application User type.
   */
  private mapTrailBaseUser(tbUser: TrailBaseUser): User {
    return {
      id: tbUser.id,
      username: tbUser.email || tbUser.id,
      email: tbUser.email,
      displayName: tbUser.email,
    };
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
  async signIn(provider: string = 'oidc0', redirectUri?: string): Promise<void> {
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
   * Authenticate with email and password via the SDK.
   *
   * The SDK POSTs to /api/auth/v1/login without redirect_uri, receiving 200
   * JSON. TrailBase sets an HttpOnly session cookie in the same response so
   * that initClientFromCookies() on the next page load restores the session
   * automatically via GET /api/auth/v1/status.
   *
   * @param email - User email address
   * @param password - User password
   * @throws AuthError — propagated from trailbaseService (typed codes)
   */
  async loginWithPassword(email: string, password: string): Promise<void> {
    await trailbaseService.loginWithPassword(email, password);
    // Read user from the SDK client — it was updated by client.login()
    const trailbaseUser = await trailbaseService.getUser();
    if (trailbaseUser) {
      this.authState = {
        isAuthenticated: true,
        user: this.mapTrailBaseUser(trailbaseUser),
      };
    } else {
      this.authState = { isAuthenticated: false, user: null };
    }
    this.notifyAuthStateChange();
  }

  /**
   * Sign out the current user and clear local auth state.
   */
  async signOut(): Promise<void> {
    try {
      await trailbaseService.logout();
      this.authState = { isAuthenticated: false, user: null };
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('notification-add', {
          detail: {
            id: `signout-error-${Date.now()}`,
            message: 'Failed to sign out. Please try again.',
            type: 'error' as const,
          },
          bubbles: true,
          composed: true,
        })
      );
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
}

export const authService = AuthService.getInstance();
