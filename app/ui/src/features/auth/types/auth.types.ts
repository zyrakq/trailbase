// Authentication types and interfaces

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
}

/**
 * Application-level auth state.
 * The `token` field has been removed — TrailBase uses HttpOnly cookies exclusively.
 * No client-side token storage is needed or safe.
 *
 * `hasMfa` is true when the current session was established via a TOTP challenge.
 * It is also set to true after the user enables TOTP on the profile page.
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  hasMfa: boolean;
}
