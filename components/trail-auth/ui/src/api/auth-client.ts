// Minimal TrailBase auth API client — no SDK dependency.
// All fetch calls use credentials:'include' to send/receive HttpOnly cookies.

export const enum AuthErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  REGISTRATION_DISABLED = 'REGISTRATION_DISABLED',
  RATE_LIMITED = 'RATE_LIMITED',
  EMAIL_NOT_SENT = 'EMAIL_NOT_SENT',
  UNKNOWN = 'UNKNOWN',
}

export class AuthClientError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthClientError';
  }
}

export interface OAuthProvider {
  name: string;
  displayName: string;
}

// ---------------------------------------------------------------------------
// OAuth providers
// ---------------------------------------------------------------------------

export async function fetchOAuthProviders(): Promise<OAuthProvider[]> {
  const response = await fetch('/api/auth/v1/oauth/providers', { credentials: 'include' });
  if (!response.ok) return [];
  const data = (await response.json()) as { providers?: [string, string][] };
  return (data.providers ?? []).map(([name, displayName]) => ({ name, displayName }));
}

// ---------------------------------------------------------------------------
// Current user (decoded from JWT stored in the auth cookie)
// ---------------------------------------------------------------------------

export interface CurrentUser {
  id: string;
  email: string;
  hasMfa: boolean;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/status', { credentials: 'include' });
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error fetching user status');
  }

  if (!response.ok) return null;

  const data = (await response.json()) as { auth_token?: string };
  if (!data.auth_token) return null;

  const claims = decodeJwtPayload(data.auth_token);
  const email = (claims['email'] as string) || (claims['sub'] as string) || '';
  return {
    id: (claims['sub'] as string) || '',
    email,
    hasMfa: !!(claims['mfa'] as boolean),
  };
}

// ---------------------------------------------------------------------------
// Profile capabilities (WASM endpoint)
// ---------------------------------------------------------------------------

export interface ProfileCapabilities {
  showOtpSection: boolean;
  showChangePassword: boolean;
}

export async function fetchProfileCapabilities(): Promise<ProfileCapabilities> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/profile', { credentials: 'include' });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      'Network error fetching profile capabilities'
    );
  }

  if (response.status === 401) return { showOtpSection: false, showChangePassword: false };
  if (!response.ok) return { showOtpSection: false, showChangePassword: false };

  const data = (await response.json()) as {
    show_otp_section?: boolean;
    show_change_password?: boolean;
  };

  return {
    showOtpSection: data.show_otp_section ?? false,
    showChangePassword: data.show_change_password ?? false,
  };
}

// ---------------------------------------------------------------------------
// TOTP
// ---------------------------------------------------------------------------

export interface TotpSetupData {
  totpUrl: string;
  qrPng: string;
}

export async function registerTotp(png = true): Promise<TotpSetupData> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/v1/totp/register?png=${png}`, {
      credentials: 'include',
    });
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error during TOTP setup');
  }

  if (!response.ok) {
    throw new AuthClientError(AuthErrorCode.UNKNOWN, `TOTP setup failed: ${response.status}`);
  }

  const data = (await response.json()) as { totp_url: string; png?: string | null };
  return { totpUrl: data.totp_url, qrPng: data.png ?? '' };
}

export async function confirmTotp(totpUrl: string, code: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ totp_url: totpUrl, totp: code }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      'Network error during TOTP confirmation'
    );
  }

  if (response.status === 401) {
    throw new AuthClientError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid verification code');
  }
  if (!response.ok) {
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      `TOTP confirmation failed: ${response.status}`
    );
  }
}

export async function unregisterTotp(code: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/totp/unregister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ totp: code }),
    });
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error during TOTP disable');
  }

  if (response.status === 401) {
    throw new AuthClientError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid code');
  }
  if (!response.ok) {
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      `TOTP disable failed: ${response.status}`
    );
  }
}

// ---------------------------------------------------------------------------
// Login — password
// ---------------------------------------------------------------------------

/**
 * Authenticate with email and password via form-encoded POST.
 *
 * Returns `{ requiresMfa: true; mfaToken: string }` when TOTP is required,
 * or void on direct success (cookie already set by TrailBase redirect).
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ requiresMfa: true; mfaToken: string } | void> {
  const body = new URLSearchParams();
  body.set('email', email);
  body.set('password', password);
  body.set('redirect_uri', '/auth/callback');
  body.set('mfa_redirect_uri', '/auth/mfa-pending');

  let response: Response;
  try {
    response = await fetch('/api/auth/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: body.toString(),
    });
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error during login');
  }

  if (response.redirected) {
    const finalUrl = new URL(response.url, window.location.origin);
    const mfaToken = finalUrl.searchParams.get('mfa_token');
    if (mfaToken) {
      return { requiresMfa: true as const, mfaToken };
    }
    const alert = finalUrl.searchParams.get('alert');
    if (alert) {
      if (alert.includes('401')) {
        throw new AuthClientError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
      }
      throw new AuthClientError(AuthErrorCode.UNKNOWN, alert);
    }
    return;
  }

  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    `Unexpected login response: ${response.status}`
  );
}

// ---------------------------------------------------------------------------
// Login — MFA
// ---------------------------------------------------------------------------

/**
 * Complete MFA login by submitting a TOTP code.
 * Cookie is set by TrailBase via the 303 redirect.
 */
export async function loginWithMfa(mfaToken: string, totpCode: string): Promise<void> {
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
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error during MFA login');
  }

  if (response.redirected) {
    return;
  }
  if (response.status === 401) {
    throw new AuthClientError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid MFA code');
  }
  throw new AuthClientError(AuthErrorCode.UNKNOWN, `MFA login failed: ${response.status}`);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerWithPassword(email: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, password_repeat: password }),
    });
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error during registration');
  }

  if (response.ok) return;

  if (response.status === 424) {
    throw new AuthClientError(
      AuthErrorCode.EMAIL_NOT_SENT,
      'Account created but verification email failed'
    );
  }

  const text = await response.text().catch(() => '');
  if (response.status === 409 || text.toLowerCase().includes('already')) {
    throw new AuthClientError(AuthErrorCode.EMAIL_TAKEN, 'Email already registered');
  }
  if (response.status === 400 && text.toLowerCase().includes('too short')) {
    throw new AuthClientError(AuthErrorCode.WEAK_PASSWORD, 'Password does not meet requirements');
  }
  if (response.status === 403) {
    throw new AuthClientError(AuthErrorCode.REGISTRATION_DISABLED, 'Registration is disabled');
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Registration failed: ${response.status}`
  );
}

// ---------------------------------------------------------------------------
// Verification email
// ---------------------------------------------------------------------------

export async function resendVerificationEmail(email: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `/api/auth/v1/verify_email/trigger?email=${encodeURIComponent(email)}`,
      { credentials: 'include' }
    );
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error resending email');
  }

  if (response.ok) return;

  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      'Verification email already sent recently'
    );
  }
  if (response.status === 424) {
    throw new AuthClientError(AuthErrorCode.EMAIL_NOT_SENT, 'Verification email could not be sent');
  }

  const text = await response.text().catch(() => '');
  throw new AuthClientError(AuthErrorCode.UNKNOWN, text || `Resend failed: ${response.status}`);
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(email: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/reset_password/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      'Network error during password reset request'
    );
  }

  if (response.ok) return;

  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      'Password reset email already sent recently'
    );
  }
  if (response.status === 424) {
    throw new AuthClientError(AuthErrorCode.EMAIL_NOT_SENT, 'Could not send password reset email');
  }

  const text = await response.text().catch(() => '');
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Password reset request failed: ${response.status}`
  );
}

export async function updatePassword(token: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/auth/v1/reset_password/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password, password_repeat: password, password_reset_token: token }),
    });
  } catch {
    throw new AuthClientError(AuthErrorCode.NETWORK_ERROR, 'Network error during password reset');
  }

  if (response.ok) return;

  const text = await response.text().catch(() => '');
  if (response.status === 400) {
    const lower = text.toLowerCase();
    if (lower.includes('token') || lower.includes('invalid') || lower.includes('expired')) {
      throw new AuthClientError(AuthErrorCode.UNKNOWN, 'invalid-token');
    }
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || 'Password does not meet requirements'
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Password reset failed: ${response.status}`
  );
}
