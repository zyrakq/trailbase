// Minimal TrailBase auth API client — no SDK dependency.
// All fetch calls use credentials:'include' to send/receive HttpOnly cookies.

export const AuthErrorCode = {
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  REGISTRATION_DISABLED: "REGISTRATION_DISABLED",
  RATE_LIMITED: "RATE_LIMITED",
  EMAIL_NOT_SENT: "EMAIL_NOT_SENT",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  UNKNOWN: "UNKNOWN",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export class AuthClientError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthClientError";
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
  const response = await fetch("/api/auth/v1/oauth/providers", {
    credentials: "include",
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { providers?: [string, string][] };
  return (data.providers ?? []).map(([name, displayName]) => ({
    name,
    displayName,
  }));
}

// ---------------------------------------------------------------------------
// Current user (decoded from JWT stored in the auth cookie)
// ---------------------------------------------------------------------------

export interface CurrentUser {
  id: string;
  email: string;
  hasMfa: boolean;
  csrfToken: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/status", { credentials: "include" });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error fetching user status",
    );
  }

  if (!response.ok) return null;

  const data = (await response.json()) as {
    auth_token?: string;
    csrf_token?: string;
  };
  if (!data.auth_token) return null;

  const claims = decodeJwtPayload(data.auth_token);
  const email = (claims["email"] as string) || (claims["sub"] as string) || "";
  return {
    id: (claims["sub"] as string) || "",
    email,
    hasMfa: !!(claims["mfa"] as boolean),
    csrfToken: (claims["csrf_token"] as string) || data.csrf_token || "",
  };
}

// ---------------------------------------------------------------------------
// Profile capabilities (WASM endpoint)
// ---------------------------------------------------------------------------

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  mustContainUpperAndLowerCase: boolean;
  mustContainDigits: boolean;
  mustContainSpecialCharacters: boolean;
}

const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  mustContainUpperAndLowerCase: false,
  mustContainDigits: false,
  mustContainSpecialCharacters: false,
};

export interface ProfileCapabilities {
  showOtpSection: boolean;
  showChangePassword: boolean;
  canSetPassword: boolean;
  passwordPolicy: PasswordPolicy;
}

export async function fetchProfileCapabilities(): Promise<ProfileCapabilities> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/profile", { credentials: "include" });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error fetching profile capabilities",
    );
  }

  if (response.status === 401) {
    return {
      showOtpSection: false,
      showChangePassword: false,
      canSetPassword: false,
      passwordPolicy: defaultPasswordPolicy,
    };
  }
  if (!response.ok) {
    return {
      showOtpSection: false,
      showChangePassword: false,
      canSetPassword: false,
      passwordPolicy: defaultPasswordPolicy,
    };
  }

  const data = (await response.json()) as {
    show_otp_section?: boolean;
    show_change_password?: boolean;
    can_set_password?: boolean;
    password_policy?: {
      min_length?: number;
      max_length?: number;
      must_contain_upper_and_lower_case?: boolean;
      must_contain_digits?: boolean;
      must_contain_special_characters?: boolean;
    };
  };

  const policy = data.password_policy;
  return {
    showOtpSection: data.show_otp_section ?? false,
    showChangePassword: data.show_change_password ?? false,
    canSetPassword: data.can_set_password ?? false,
    passwordPolicy: {
      minLength: policy?.min_length ?? defaultPasswordPolicy.minLength,
      maxLength: policy?.max_length ?? defaultPasswordPolicy.maxLength,
      mustContainUpperAndLowerCase:
        policy?.must_contain_upper_and_lower_case ??
        defaultPasswordPolicy.mustContainUpperAndLowerCase,
      mustContainDigits:
        policy?.must_contain_digits ?? defaultPasswordPolicy.mustContainDigits,
      mustContainSpecialCharacters:
        policy?.must_contain_special_characters ??
        defaultPasswordPolicy.mustContainSpecialCharacters,
    },
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
      credentials: "include",
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during TOTP setup",
    );
  }

  if (!response.ok) {
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      `TOTP setup failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    totp_url: string;
    png?: string | null;
  };
  return { totpUrl: data.totp_url, qrPng: data.png ?? "" };
}

export async function confirmTotp(
  totpUrl: string,
  code: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/totp/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ totp_url: totpUrl, totp: code }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during TOTP confirmation",
    );
  }

  if (response.status === 401) {
    throw new AuthClientError(
      AuthErrorCode.INVALID_CREDENTIALS,
      "Invalid verification code",
    );
  }
  if (!response.ok) {
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      `TOTP confirmation failed: ${response.status}`,
    );
  }
}

export async function unregisterTotp(code: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/totp/unregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ totp: code }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during TOTP disable",
    );
  }

  if (response.status === 401) {
    throw new AuthClientError(
      AuthErrorCode.INVALID_CREDENTIALS,
      "Invalid code",
    );
  }
  if (!response.ok) {
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      `TOTP disable failed: ${response.status}`,
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
  password: string,
): Promise<{ requiresMfa: true; mfaToken: string } | void> {
  const body = new URLSearchParams();
  body.set("email", email);
  body.set("password", password);
  body.set("redirect_uri", "/auth/callback");
  body.set("mfa_redirect_uri", "/auth/mfa-pending");

  let response: Response;
  try {
    response = await fetch("/api/auth/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
      body: body.toString(),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during login",
    );
  }

  if (response.redirected) {
    const finalUrl = new URL(response.url, window.location.origin);
    const mfaToken = finalUrl.searchParams.get("mfa_token");
    if (mfaToken) {
      return { requiresMfa: true as const, mfaToken };
    }
    const alert = finalUrl.searchParams.get("alert");
    if (alert) {
      if (alert.includes("401")) {
        throw new AuthClientError(
          AuthErrorCode.INVALID_CREDENTIALS,
          "Invalid email or password",
        );
      }
      throw new AuthClientError(AuthErrorCode.UNKNOWN, alert);
    }
    return;
  }

  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    `Unexpected login response: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Login — MFA
// ---------------------------------------------------------------------------

/**
 * Complete MFA login by submitting a TOTP code.
 * Cookie is set by TrailBase via the 303 redirect.
 */
export async function loginWithMfa(
  mfaToken: string,
  totpCode: string,
): Promise<void> {
  const body = new URLSearchParams();
  body.set("mfa_token", mfaToken);
  body.set("totp", totpCode);
  body.set("redirect_uri", "/auth/callback");

  let response: Response;
  try {
    response = await fetch("/api/auth/v1/login_mfa", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
      body: body.toString(),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during MFA login",
    );
  }

  if (response.redirected) {
    return;
  }
  if (response.status === 401) {
    throw new AuthClientError(
      AuthErrorCode.INVALID_CREDENTIALS,
      "Invalid MFA code",
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    `MFA login failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerWithPassword(
  email: string,
  password: string,
  redirectUri?: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
        password_repeat: password,
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during registration",
    );
  }

  if (response.ok) return;

  if (response.status === 424) {
    throw new AuthClientError(
      AuthErrorCode.EMAIL_NOT_SENT,
      "Account created but verification email failed",
    );
  }

  const text = await response.text().catch(() => "");
  if (response.status === 409 || text.toLowerCase().includes("already")) {
    throw new AuthClientError(
      AuthErrorCode.EMAIL_TAKEN,
      "Email already registered",
    );
  }
  if (response.status === 400 && text.toLowerCase().includes("too short")) {
    throw new AuthClientError(
      AuthErrorCode.WEAK_PASSWORD,
      "Password does not meet requirements",
    );
  }
  if (response.status === 403) {
    throw new AuthClientError(
      AuthErrorCode.REGISTRATION_DISABLED,
      "Registration is disabled",
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Registration failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Verification email
// ---------------------------------------------------------------------------

export async function resendVerificationEmail(
  email: string,
  redirectUri?: string,
): Promise<void> {
  let response: Response;
  const params = new URLSearchParams({ email });
  if (redirectUri) params.set("redirect_uri", redirectUri);
  try {
    response = await fetch(
      `/api/auth/v1/verify_email/trigger?${params.toString()}`,
      {
        credentials: "include",
      },
    );
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error resending email",
    );
  }

  if (response.ok) return;

  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      "Verification email already sent recently",
    );
  }
  if (response.status === 424) {
    throw new AuthClientError(
      AuthErrorCode.EMAIL_NOT_SENT,
      "Verification email could not be sent",
    );
  }

  const text = await response.text().catch(() => "");
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Resend failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(email: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/reset_password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during password reset request",
    );
  }

  if (response.ok) return;

  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      "Password reset email already sent recently",
    );
  }
  if (response.status === 424) {
    throw new AuthClientError(
      AuthErrorCode.EMAIL_NOT_SENT,
      "Could not send password reset email",
    );
  }

  const text = await response.text().catch(() => "");
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Password reset request failed: ${response.status}`,
  );
}

export async function updatePassword(
  token: string,
  password: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/reset_password/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        password,
        password_repeat: password,
        password_reset_token: token,
      }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during password reset",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  if (response.status === 400) {
    const lower = text.toLowerCase();
    if (
      lower.includes("token") ||
      lower.includes("invalid") ||
      lower.includes("expired")
    ) {
      throw new AuthClientError(AuthErrorCode.UNKNOWN, "invalid-token");
    }
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || "Password does not meet requirements",
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Password reset failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Change email
// ---------------------------------------------------------------------------

export async function changeEmail(
  oldEmail: string,
  newEmail: string,
): Promise<void> {
  // Fetch a fresh CSRF token on-demand right before the POST. The /status
  // endpoint rotates the JWT and sets both the response body and the auth
  // cookie to the same new token, keeping them in sync.
  let statusResponse: Response;
  try {
    statusResponse = await fetch("/api/auth/v1/status", {
      credentials: "include",
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error fetching auth status",
    );
  }

  if (!statusResponse.ok) {
    throw new AuthClientError(AuthErrorCode.UNAUTHORIZED, "Not authenticated");
  }

  const statusData = (await statusResponse.json()) as {
    auth_token?: string;
    csrf_token?: string;
  };

  if (!statusData.auth_token) {
    throw new AuthClientError(AuthErrorCode.UNAUTHORIZED, "Not authenticated");
  }

  const claims = decodeJwtPayload(statusData.auth_token);
  const freshCsrfToken =
    (claims["csrf_token"] as string) || statusData.csrf_token || "";
  if (!freshCsrfToken) {
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      "Failed to extract CSRF token",
    );
  }

  let response: Response;
  try {
    response = await fetch("/api/auth/v1/change_email/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        csrf_token: freshCsrfToken,
        old_email: oldEmail,
        new_email: newEmail,
      }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during email change",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  if (response.status === 409) {
    throw new AuthClientError(
      AuthErrorCode.EMAIL_TAKEN,
      "Email already registered",
    );
  }
  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      "Email change request already sent recently",
    );
  }
  if (response.status === 400) {
    throw new AuthClientError(
      AuthErrorCode.BAD_REQUEST,
      text || "Invalid email address",
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Email change failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  newPasswordRepeat: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/change_password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_repeat: newPasswordRepeat,
      }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during password change",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  if (response.status === 400) {
    const lower = text.toLowerCase();
    if (lower.includes("old") || lower.includes("credential")) {
      throw new AuthClientError(
        AuthErrorCode.INVALID_CREDENTIALS,
        "Current password is incorrect",
      );
    }
    if (lower.includes("weak") || lower.includes("short")) {
      throw new AuthClientError(
        AuthErrorCode.WEAK_PASSWORD,
        "Password does not meet requirements",
      );
    }
    throw new AuthClientError(
      AuthErrorCode.BAD_REQUEST,
      text || "Invalid password change request",
    );
  }
  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      "Password change rate limited",
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Password change failed: ${response.status}`,
  );
}

export async function setPassword(
  newPassword: string,
  newPasswordRepeat: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/set_password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        new_password: newPassword,
        new_password_repeat: newPasswordRepeat,
      }),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during password set",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  if (response.status === 400) {
    const lower = text.toLowerCase();
    if (lower.includes("weak") || lower.includes("short")) {
      throw new AuthClientError(
        AuthErrorCode.WEAK_PASSWORD,
        "Password does not meet requirements",
      );
    }
    throw new AuthClientError(
      AuthErrorCode.BAD_REQUEST,
      text || "Invalid password set request",
    );
  }
  if (response.status === 429) {
    throw new AuthClientError(
      AuthErrorCode.RATE_LIMITED,
      "Password set rate limited",
    );
  }
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Password set failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Avatar upload
// ---------------------------------------------------------------------------

export async function uploadAvatar(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/auth/v1/avatar", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during avatar upload",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Avatar upload failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Avatar delete
// ---------------------------------------------------------------------------

export async function deleteAvatar(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/avatar", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during avatar deletion",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Avatar deletion failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

export async function deleteUser(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/v1/delete", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error during account deletion",
    );
  }

  if (response.ok) return;

  const text = await response.text().catch(() => "");
  throw new AuthClientError(
    AuthErrorCode.UNKNOWN,
    text || `Account deletion failed: ${response.status}`,
  );
}

// ---------------------------------------------------------------------------
// WcAuth admin — config (require_admin + CSRF)
// ---------------------------------------------------------------------------

// Admin SPA login uses the JSON path (no cookies). Tokens are stored in
// localStorage under "auth_tokens" by @nanostores/persistent. When present,
// we send an Authorization: Bearer header; otherwise we fall back to cookies.
interface AdminTokens {
  auth_token: string;
  refresh_token: string;
  csrf_token: string;
}

function readAdminTokens(): AdminTokens | null {
  try {
    const raw = localStorage.getItem("auth_tokens");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminTokens>;
    if (!parsed.auth_token) return null;
    return {
      auth_token: parsed.auth_token,
      refresh_token: parsed.refresh_token ?? "",
      csrf_token: parsed.csrf_token ?? "",
    };
  } catch {
    return null;
  }
}

function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const tokens = readAdminTokens();
  if (tokens) {
    headers["Authorization"] = `Bearer ${tokens.auth_token}`;
    if (tokens.csrf_token && !headers["CSRF-Token"]) {
      headers["CSRF-Token"] = tokens.csrf_token;
    }
  }
  return headers;
}

export interface WcAuthConfig {
  reset_password_redirect_url: string;
}

export async function fetchWcAuthConfig(): Promise<WcAuthConfig> {
  let response: Response;
  try {
    response = await fetch("/_/wasm/wcauth/config", {
      credentials: "include",
      headers: adminHeaders(),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error fetching wcauth config",
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || `Failed to fetch config: ${response.status}`,
    );
  }

  return (await response.json()) as WcAuthConfig;
}

export async function updateWcAuthConfig(
  config: WcAuthConfig,
): Promise<WcAuthConfig> {
  let response: Response;
  try {
    response = await fetch("/_/wasm/wcauth/config", {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(config),
    });
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error updating wcauth config",
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || `Failed to update config: ${response.status}`,
    );
  }

  return (await response.json()) as WcAuthConfig;
}

// ---------------------------------------------------------------------------
// WcAuth admin — i18n overrides (require_admin + CSRF)
// ---------------------------------------------------------------------------

export interface I18nEntry {
  id: string;
  value: string;
}

export interface WcAuthI18n {
  default: I18nEntry[];
  override: I18nEntry[];
}

export async function fetchWcAuthI18n(locale: string): Promise<WcAuthI18n> {
  let response: Response;
  try {
    response = await fetch(
      `/_/wasm/wcauth/i18n/${encodeURIComponent(locale)}`,
      { credentials: "include", headers: adminHeaders() },
    );
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error fetching i18n overrides",
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || `Failed to fetch i18n: ${response.status}`,
    );
  }

  return (await response.json()) as WcAuthI18n;
}

export async function updateWcAuthI18n(
  locale: string,
  entries: I18nEntry[],
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `/_/wasm/wcauth/i18n/${encodeURIComponent(locale)}`,
      {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(entries),
      },
    );
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error updating i18n overrides",
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || `Failed to update i18n: ${response.status}`,
    );
  }
}

export async function deleteWcAuthI18n(locale: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `/_/wasm/wcauth/i18n/${encodeURIComponent(locale)}`,
      {
        method: "DELETE",
        headers: adminHeaders(),
        credentials: "include",
      },
    );
  } catch {
    throw new AuthClientError(
      AuthErrorCode.NETWORK_ERROR,
      "Network error deleting i18n overrides",
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AuthClientError(
      AuthErrorCode.UNKNOWN,
      text || `Failed to delete i18n: ${response.status}`,
    );
  }
}
