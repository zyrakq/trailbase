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

/**
 * Discriminated union returned by trailbase.service.ts loginWithPassword and
 * propagated up through auth.service.ts to auth-modal.ts.
 *
 * - `redirect`: TrailBase issued a 303 redirect; browser processed Set-Cookie
 *   headers (credentials:include). Modal must navigate to /auth/callback.
 * - `tokens`: TrailBase returned a 200 JSON body with tokens (fallback path).
 *   auth.service.ts updates state immediately from the JWT; no cookie persistence.
 */
export type LoginResult =
  | { type: 'redirect' }
  | { type: 'tokens'; data: { auth_token: string | null } };
