// Public API for auth feature
export { AuthStatus } from './components/auth-status.ts';
export { OAuthCallback } from './components/oauth-callback.ts';
export { AuthModal } from './components/auth-modal.ts';
export { authService } from './services/auth.service.ts';
export { trailbaseService } from './services/trailbase.service.ts';
export type { AuthState, User } from './types/auth.types.ts';
export { AuthError, AuthErrorCode } from './types/auth-error.ts';
