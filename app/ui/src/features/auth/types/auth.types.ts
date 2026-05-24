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
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface OIDCConfig {
  clientId: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
}
