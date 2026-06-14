import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  fetchCurrentUser,
  fetchProfileCapabilities,
  registerTotp,
  confirmTotp,
  unregisterTotp,
  type CurrentUser,
  type TotpSetupData,
  AuthClientError,
  AuthErrorCode,
} from './api/auth-client.ts';

type TotpState = 'idle' | 'loading-qr' | 'qr-ready' | 'confirming' | 'enabled' | 'disabling';

/**
 * `<trail-profile>` — self-contained profile + TOTP management web component.
 *
 * Fetches user data from /api/auth/v1/status (JWT claims) and profile capabilities
 * from /api/auth/v1/profile on connect. Handles TOTP enable/disable entirely.
 *
 * Attributes (optional — provide initial values to avoid a loading flash):
 * - `email` — user email; if omitted, fetched from /api/auth/v1/status
 * - `has-mfa` — boolean; if true starts TOTP state as 'enabled'
 *
 * Events dispatched to host (bubbles, composed):
 * - `trail-profile-sign-out` — user clicked Sign Out; host should handle session teardown
 */
@customElement('trail-profile')
export class TrailProfile extends LitElement {
  @property({ type: String }) email = '';
  @property({ type: Boolean, attribute: 'has-mfa' }) hasMfa = false;

  @state() private user: CurrentUser | null = null;
  @state() private showOtpSection = false;
  @state() private totpState: TotpState = 'idle';
  @state() private totpSetupData: TotpSetupData | null = null;
  @state() private verifyCode = '';
  @state() private disableCode = '';
  @state() private totpError = '';
  @state() private signOutLoading = false;
  @state() private loading = true;

  async connectedCallback() {
    super.connectedCallback();

    // If host provided email, use it directly; otherwise fetch from status.
    if (this.email) {
      this.user = { id: '', email: this.email, hasMfa: this.hasMfa };
      this.totpState = this.hasMfa ? 'enabled' : 'idle';
      this.loading = false;
    } else {
      try {
        const u = await fetchCurrentUser();
        this.user = u;
        this.totpState = u?.hasMfa ? 'enabled' : 'idle';
      } catch {
        // Stay null — show empty state
      } finally {
        this.loading = false;
      }
    }

    // Fetch TOTP section visibility regardless.
    fetchProfileCapabilities()
      .then((caps) => {
        this.showOtpSection = caps.showOtpSection;
      })
      .catch(() => {
        // Default false — safe for OAuth-only users.
      });
  }

  private async handleEnableTotp() {
    this.totpError = '';
    this.totpState = 'loading-qr';
    try {
      this.totpSetupData = await registerTotp(true);
      this.verifyCode = '';
      this.totpState = 'qr-ready';
    } catch {
      this.totpState = 'idle';
    }
  }

  private async handleConfirmTotp() {
    if (this.totpState === 'confirming' || !this.totpSetupData) return;
    if (this.verifyCode.length !== 6) {
      this.totpError = 'Please enter the 6-digit code from your authenticator app.';
      return;
    }
    this.totpState = 'confirming';
    this.totpError = '';
    try {
      await confirmTotp(this.totpSetupData.totpUrl, this.verifyCode);
      this.totpState = 'enabled';
      this.totpSetupData = null;
      this.verifyCode = '';
    } catch (err) {
      if (err instanceof AuthClientError && err.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.totpError = 'Invalid code. Please try again.';
      } else {
        this.totpError = 'Verification failed. Please try again.';
      }
      this.totpState = 'qr-ready';
    }
  }

  private async handleDisableTotp() {
    if (this.disableCode.length !== 6) {
      this.totpError = 'Please enter the 6-digit code from your authenticator app.';
      return;
    }
    this.totpError = '';
    try {
      await unregisterTotp(this.disableCode);
      this.totpState = 'idle';
      this.disableCode = '';
    } catch (err) {
      if (err instanceof AuthClientError && err.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.totpError = 'Invalid code. Please try again.';
      } else {
        this.totpError = 'Failed to disable two-factor authentication. Please try again.';
      }
    }
  }

  private handleSignOut() {
    this.signOutLoading = true;
    this.dispatchEvent(
      new CustomEvent('trail-profile-sign-out', { bubbles: true, composed: true })
    );
  }

  private extractSecret(totpUrl: string): string | null {
    try {
      return new URL(totpUrl).searchParams.get('secret');
    } catch {
      return null;
    }
  }

  private renderUserCard() {
    const email = this.user?.email ?? '';
    const initials = email ? email.slice(0, 2).toUpperCase() : '??';

    return html`
      <div class="card">
        <h2 class="card-title">Profile</h2>
        <div class="user-info">
          <div class="avatar" aria-hidden="true">${initials}</div>
          <div class="user-details">
            ${email
              ? html`<div class="detail-row">
                  <span class="label">Email</span>
                  <span class="value">${email}</span>
                </div>`
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  private renderTotpIdle() {
    const isLoading = this.totpState === 'loading-qr';
    return html`
      <p class="totp-description">
        Add an extra layer of security to your account by requiring a code from your authenticator
        app when signing in.
      </p>
      <button
        class="btn btn-secondary"
        @click=${this.handleEnableTotp}
        ?disabled=${isLoading}
      >
        ${isLoading ? 'Loading...' : 'Enable two-factor authentication'}
      </button>
    `;
  }

  private renderTotpQrReady() {
    const isConfirming = this.totpState === 'confirming';
    const secret = this.totpSetupData ? this.extractSecret(this.totpSetupData.totpUrl) : null;

    return html`
      <p class="totp-description">
        Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
      </p>

      ${this.totpSetupData?.qrPng
        ? html`<div class="qr-container">
            <img
              src="data:image/png;base64,${this.totpSetupData.qrPng}"
              alt="TOTP QR code"
              class="qr-image"
            />
          </div>`
        : ''}
      ${secret
        ? html`<div class="manual-key">
            <span class="manual-key-label">Manual entry key:</span>
            <code class="manual-key-value">${secret}</code>
          </div>`
        : ''}

      <form
        class="totp-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.handleConfirmTotp();
        }}
      >
        <div class="form-field">
          <label for="trail-profile-verify-code">Verification code</label>
          <input
            id="trail-profile-verify-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            .value=${this.verifyCode}
            @input=${(e: Event) => {
              this.verifyCode = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
              if (this.totpError) this.totpError = '';
            }}
            ?disabled=${isConfirming}
            required
          />
        </div>

        ${this.totpError
          ? html`<div class="error-message" role="alert">${this.totpError}</div>`
          : ''}

        <button
          type="submit"
          class="btn btn-primary"
          ?disabled=${isConfirming || this.verifyCode.length !== 6}
        >
          ${isConfirming ? 'Verifying...' : 'Verify and enable'}
        </button>
      </form>
    `;
  }

  private renderTotpEnabled() {
    return html`
      <div class="totp-status totp-status--enabled">
        <span class="status-icon" aria-hidden="true">✓</span>
        <span>Two-factor authentication is enabled</span>
      </div>
      <button class="btn btn-danger-outline" @click=${() => {
        this.disableCode = '';
        this.totpError = '';
        this.totpState = 'disabling';
      }}>
        Disable two-factor authentication
      </button>
    `;
  }

  private renderTotpDisabling() {
    return html`
      <div class="totp-status totp-status--enabled">
        <span class="status-icon" aria-hidden="true">✓</span>
        <span>Two-factor authentication is enabled</span>
      </div>
      <p class="totp-description">
        Enter your current authenticator code to disable two-factor authentication.
      </p>
      <form
        class="totp-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.handleDisableTotp();
        }}
      >
        <div class="form-field">
          <label for="trail-profile-disable-code">Current code</label>
          <input
            id="trail-profile-disable-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            .value=${this.disableCode}
            @input=${(e: Event) => {
              this.disableCode = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
              if (this.totpError) this.totpError = '';
            }}
            required
          />
        </div>

        ${this.totpError
          ? html`<div class="error-message" role="alert">${this.totpError}</div>`
          : ''}

        <div class="button-row">
          <button type="submit" class="btn btn-danger" ?disabled=${this.disableCode.length !== 6}>
            Confirm disable
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            @click=${() => {
              this.totpState = 'enabled';
              this.disableCode = '';
              this.totpError = '';
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    `;
  }

  private renderSecurityCard() {
    return html`
      <div class="card">
        <h2 class="card-title">Security</h2>
        <div class="security-section">
          <h3 class="section-subtitle">Two-factor authentication</h3>
          ${this.totpState === 'idle' || this.totpState === 'loading-qr'
            ? this.renderTotpIdle()
            : this.totpState === 'qr-ready' || this.totpState === 'confirming'
              ? this.renderTotpQrReady()
              : this.totpState === 'enabled'
                ? this.renderTotpEnabled()
                : this.renderTotpDisabling()}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-skeleton"></div>`;
    }

    return html`
      <div class="profile-root">
        ${this.renderUserCard()}
        ${this.showOtpSection ? this.renderSecurityCard() : ''}
        <div class="actions">
          <button
            class="btn btn-danger"
            @click=${this.handleSignOut}
            ?disabled=${this.signOutLoading}
          >
            ${this.signOutLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      font-size: 1rem;
      color: var(--theme-color-text-primary, #111827);
    }

    .profile-root {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    .loading-skeleton {
      height: 120px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--theme-color-text-primary, #111827) 8%, transparent);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .card {
      background: var(--theme-color-surface, #ffffff);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: var(--theme-shadow-md, 0 1px 3px rgba(0,0,0,.1));
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
      margin: 0 0 1.5rem 0;
    }

    .user-info {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--theme-color-primary, #6366f1);
      color: white;
      font-size: 1.125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--theme-color-border, #e5e7eb);
    }

    .detail-row:last-child { border-bottom: none; }

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-color-text-secondary, #6b7280);
    }

    .value {
      font-size: 0.9375rem;
      color: var(--theme-color-text-primary, #111827);
      word-break: break-all;
      text-align: right;
    }

    .security-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-subtitle {
      font-size: 1rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
      margin: 0;
    }

    .totp-description {
      font-size: 0.9375rem;
      color: var(--theme-color-text-secondary, #6b7280);
      margin: 0;
      line-height: 1.5;
    }

    .totp-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      padding: 0.625rem 0.875rem;
      border-radius: 6px;
    }

    .totp-status--enabled {
      background: color-mix(in srgb, var(--theme-color-success, #22c55e) 12%, transparent);
      color: var(--theme-color-success, #22c55e);
    }

    .status-icon { font-size: 1rem; }

    .qr-container {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }

    .qr-image {
      width: 180px;
      height: 180px;
      border-radius: 6px;
      border: 1px solid var(--theme-color-border, #e5e7eb);
    }

    .manual-key {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: var(--theme-color-background, #f9fafb);
      border-radius: 6px;
    }

    .manual-key-label {
      font-size: 0.8125rem;
      color: var(--theme-color-text-secondary, #6b7280);
    }

    .manual-key-value {
      font-family: monospace;
      font-size: 0.9375rem;
      color: var(--theme-color-text-primary, #111827);
      word-break: break-all;
      letter-spacing: 0.05em;
    }

    .totp-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-color-text-primary, #111827);
    }

    .form-field input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--theme-color-text-primary, #111827);
      background: var(--theme-color-surface, #ffffff);
      border: 1px solid var(--theme-color-border, #e5e7eb);
      border-radius: 6px;
      box-sizing: border-box;
    }

    .form-field input:focus {
      outline: none;
      border-color: var(--theme-color-primary, #6366f1);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-primary, #6366f1) 15%, transparent);
    }

    .form-field input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--theme-color-error, #ef4444);
      background: var(--theme-color-surface, #ffffff);
      border: 1px solid var(--theme-color-error, #ef4444);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
    }

    .actions {
      display: flex;
      justify-content: center;
      padding-bottom: 0.5rem;
    }

    .button-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--theme-color-primary, #6366f1);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--theme-color-primary-hover, #4f46e5);
    }

    .btn-secondary {
      background: var(--theme-color-surface, #ffffff);
      color: var(--theme-color-text-primary, #111827);
      border: 1px solid var(--theme-color-border, #e5e7eb);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--theme-color-background, #f9fafb);
    }

    .btn-danger {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .btn-danger:hover:not(:disabled) { opacity: 0.9; }

    .btn-danger-outline {
      background: transparent;
      color: var(--theme-color-error, #ef4444);
      border: 1px solid var(--theme-color-error, #ef4444);
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: color-mix(in srgb, var(--theme-color-error, #ef4444) 8%, transparent);
    }

    .btn-ghost {
      background: transparent;
      color: var(--theme-color-text-secondary, #6b7280);
    }

    .btn-ghost:hover:not(:disabled) {
      color: var(--theme-color-text-primary, #111827);
      background: var(--theme-color-background, #f9fafb);
    }

    @media (max-width: 640px) {
      .card { padding: 1.5rem; }
      .user-info { flex-direction: column; align-items: center; text-align: center; }
      .detail-row { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
      .value { text-align: left; }
      .button-row { flex-direction: column; }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'trail-profile': TrailProfile;
  }
}
