// Typed auth error — replaces bare Error strings thrown by trailbase.service.ts.
// auth-modal.ts switches on AuthErrorCode instead of matching substrings.

/**
 * All structured error conditions that can arise during
 * TrailBase authentication operations.
 */
export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MFA_REQUIRED: 'MFA_REQUIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * Structured error thrown by trailbase.service.ts for authentication failures.
 * Callers (auth-modal.ts) switch on `error.code` to display localized messages.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
    // Restore prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
