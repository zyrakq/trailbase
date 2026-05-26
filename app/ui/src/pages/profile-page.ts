import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { totpService } from '@/features/auth';
import type { TotpSetupData } from '@/features/auth';
import { AuthError, AuthErrorCode } from '@/features/auth';
import type { User } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';

type TotpSetupState =
  | 'idle'
  | 'loading-qr'
  | 'qr-ready'
  | 'confirming'
  | 'enabled'
  | 'disabling'
  | 'disabled';

@customElement('profile-page')
@localized()
export class ProfilePage extends LitElement {
  @state() private user: User | null = null;
  @state() private totpState: TotpSetupState = 'idle';
  @state() private totpSetupData: TotpSetupData | null = null;
  @state() private verifyCode = '';
  @state() private disableCode = '';
  @state() private totpError = '';
  @state() private signOutLoading = false;

  async connectedCallback() {
    super.connectedCallback();
    const authState = authService.getAuthState();
    this.user = authState.user;
    // Derive initial TOTP state from auth context
    this.totpState = authState.hasMfa ? 'enabled' : 'idle';
  }

  // ── Sign out ────────────────────────────────────────────────────────────────────────────

  private async handleSignOut() {
    try {
      this.signOutLoading = true;
      await authService.signOut();
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch {
      notificationService.error(msg('Failed to sign out. Please try again.'));
    } finally {
      this.signOutLoading = false;
    }
  }

  // ── TOTP setup ──────────────────────────────────────────────────────────────────────────

  private async handleEnableTotp() {
    this.totpError = '';
    this.totpState = 'loading-qr';
    try {
      const data = await totpService.startSetup();
      this.totpSetupData = data;
      this.verifyCode = '';
      this.totpState = 'qr-ready';
    } catch {
      this.totpState = 'idle';
      notificationService.error(msg('Failed to start TOTP setup. Please try again.'));
    }
  }

  private handleVerifyCodeInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.verifyCode = target.value.replace(/\D/g, '').slice(0, 6);
    if (this.totpError) this.totpError = '';
  }

  private async handleConfirmSetup(e: Event) {
    e.preventDefault();
    if (this.totpState === 'confirming') return;
    if (!this.totpSetupData) return;

    if (this.verifyCode.length !== 6) {
      this.totpError = msg('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    this.totpState = 'confirming';
    this.totpError = '';

    try {
      await totpService.confirmSetup(this.totpSetupData.totpUrl, this.verifyCode);
      this.totpState = 'enabled';
      this.totpSetupData = null;
      this.verifyCode = '';
      notificationService.success(msg('Two-factor authentication enabled.'));
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.totpError = msg('Invalid code. Please try again.');
      } else {
        this.totpError = msg('Verification failed. Please try again.');
      }
      this.totpState = 'qr-ready';
    }
  }

  // ── TOTP disable ───────────────────────────────────────────────────────────────────────────

  private handleStartDisable() {
    this.disableCode = '';
    this.totpError = '';
    this.totpState = 'disabling';
  }

  private handleDisableCodeInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.disableCode = target.value.replace(/\D/g, '').slice(0, 6);
    if (this.totpError) this.totpError = '';
  }

  private async handleConfirmDisable(e: Event) {
    e.preventDefault();
    if (this.disableCode.length !== 6) {
      this.totpError = msg('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    this.totpError = '';

    try {
      await totpService.disableTotp(this.disableCode);
      this.totpState = 'idle';
      this.disableCode = '';
      notificationService.success(msg('Two-factor authentication disabled.'));
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.totpError = msg('Invalid code. Please try again.');
      } else {
        this.totpError = msg('Failed to disable two-factor authentication. Please try again.');
      }
    }
  }

  private handleCancelDisable() {
    this.totpState = 'enabled';
    this.disableCode = '';
    this.totpError = '';
  }

  // ── Render ──────────────────────────────────────────────────────────────────────────────

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">
          <div class="profile-container">
            ${this.renderUserCard()}
            ${this.renderSecurityCard()}
            <div class="actions">
              <button
                class="btn btn-danger"
                @click=${this.handleSignOut}
                ?disabled=${this.signOutLoading}
              >
                ${this.signOutLoading ? msg('Signing out...') : msg('Sign Out')}
              </button>
            </div>
          </div>
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  private renderUserCard() {
    const initials = this.user?.email
      ? this.user.email.slice(0, 2).toUpperCase()
      : '??';

    return html`
      <div class="card">
        <h1 class="card-title">${msg('Profile')}</h1>
        <div class="user-info">
          <div class="avatar" aria-hidden="true">${initials}</div>
          <div class="user-details">
            ${this.user?.displayName
              ? html`<div class="detail-row">
                  <span class="label">${msg('Name')}</span>
                  <span class="value">${this.user.displayName}</span>
                </div>`
              : ''}
            ${this.user?.email
              ? html`<div class="detail-row">
                  <span class="label">${msg('Email')}</span>
                  <span class="value">${this.user.email}</span>
                </div>`
              : ''}
            ${this.user?.username
              ? html`<div class="detail-row">
                  <span class="label">${msg('Username')}</span>
                  <span class="value">${this.user.username}</span>
                </div>`
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  private renderSecurityCard() {
    return html`
      <div class="card">
        <h2 class="card-title">${msg('Security')}</h2>
        <div class="security-section">
          <h3 class="section-subtitle">${msg('Two-factor authentication')}</h3>
          ${this.renderTotpSection()}
        </div>
      </div>
    `;
  }

  private renderTotpSection() {
    switch (this.totpState) {
      case 'idle':
      case 'loading-qr':
        return this.renderTotpIdle();
      case 'qr-ready':
      case 'confirming':
        return this.renderTotpQrReady();
      case 'enabled':
        return this.renderTotpEnabled();
      case 'disabling':
        return this.renderTotpDisabling();
      default:
        return html``;
    }
  }

  private renderTotpIdle() {
    const isLoading = this.totpState === 'loading-qr';
    return html`
      <p class="totp-description">
        ${msg('Add an extra layer of security to your account by requiring a code from your authenticator app when signing in.')}
      </p>
      <button
        class="btn btn-secondary"
        @click=${this.handleEnableTotp}
        ?disabled=${isLoading}
      >
        ${isLoading ? msg('Loading...') : msg('Enable two-factor authentication')}
      </button>
    `;
  }

  private renderTotpQrReady() {
    const isConfirming = this.totpState === 'confirming';
    const secret = this.totpSetupData
      ? totpService.extractSecret(this.totpSetupData.totpUrl)
      : null;

    return html`
      <p class="totp-description">
        ${msg('Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to verify.')}
      </p>

      ${this.totpSetupData?.qrPng
        ? html`
            <div class="qr-container">
              <img
                src="data:image/png;base64,${this.totpSetupData.qrPng}"
                alt=${msg('TOTP QR code')}
                class="qr-image"
              />
            </div>
          `
        : ''}

      ${secret
        ? html`
            <div class="manual-key">
              <span class="manual-key-label">${msg('Manual entry key:')}</span>
              <code class="manual-key-value">${secret}</code>
            </div>
          `
        : ''}

      <form class="totp-form" @submit=${this.handleConfirmSetup}>
        <div class="form-field">
          <label for="totp-verify-code">${msg('Verification code')}</label>
          <input
            id="totp-verify-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            .value=${this.verifyCode}
            @input=${this.handleVerifyCodeInput}
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
          ${isConfirming ? msg('Verifying...') : msg('Verify and enable')}
        </button>
      </form>
    `;
  }

  private renderTotpEnabled() {
    return html`
      <div class="totp-status totp-status--enabled">
        <span class="status-icon" aria-hidden="true">✓</span>
        <span>${msg('Two-factor authentication is enabled')}</span>
      </div>
      <button class="btn btn-danger-outline" @click=${this.handleStartDisable}>
        ${msg('Disable two-factor authentication')}
      </button>
    `;
  }

  private renderTotpDisabling() {
    return html`
      <div class="totp-status totp-status--enabled">
        <span class="status-icon" aria-hidden="true">✓</span>
        <span>${msg('Two-factor authentication is enabled')}</span>
      </div>
      <p class="totp-description">
        ${msg('Enter your current authenticator code to disable two-factor authentication.')}
      </p>
      <form class="totp-form" @submit=${this.handleConfirmDisable}>
        <div class="form-field">
          <label for="totp-disable-code">${msg('Current code')}</label>
          <input
            id="totp-disable-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            .value=${this.disableCode}
            @input=${this.handleDisableCodeInput}
            required
          />
        </div>

        ${this.totpError
          ? html`<div class="error-message" role="alert">${this.totpError}</div>`
          : ''}

        <div class="button-row">
          <button
            type="submit"
            class="btn btn-danger"
            ?disabled=${this.disableCode.length !== 6}
          >
            ${msg('Confirm disable')}
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            @click=${this.handleCancelDisable}
          >
            ${msg('Cancel')}
          </button>
        </div>
      </form>
    `;
  }

  // ── Styles ──────────────────────────────────────────────────────────────────────────────

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--theme-color-background);
      transition: background-color 0.2s ease;
    }

    .main-content {
      flex: 1;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .profile-container {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Cards ── */

    .card {
      background: var(--theme-color-surface);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: var(--theme-shadow-md);
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0 0 1.5rem 0;
      transition: color 0.2s ease;
    }

    /* ── User info ── */

    .user-info {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--theme-color-primary);
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
      border-bottom: 1px solid var(--theme-color-border);
      transition: border-color 0.2s ease;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-color-text-secondary);
      transition: color 0.2s ease;
    }

    .value {
      font-size: 0.9375rem;
      color: var(--theme-color-text-primary);
      word-break: break-all;
      text-align: right;
      transition: color 0.2s ease;
    }

    /* ── Security section ── */

    .security-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-subtitle {
      font-size: 1rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0;
      transition: color 0.2s ease;
    }

    .totp-description {
      font-size: 0.9375rem;
      color: var(--theme-color-text-secondary);
      margin: 0;
      line-height: 1.5;
      transition: color 0.2s ease;
    }

    /* ── TOTP status badge ── */

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
      background: color-mix(in srgb, var(--theme-color-success) 12%, transparent);
      color: var(--theme-color-success);
    }

    .status-icon {
      font-size: 1rem;
    }

    /* ── QR code ── */

    .qr-container {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }

    .qr-image {
      width: 180px;
      height: 180px;
      border-radius: 6px;
      border: 1px solid var(--theme-color-border);
    }

    .manual-key {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: var(--theme-color-background);
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .manual-key-label {
      font-size: 0.8125rem;
      color: var(--theme-color-text-secondary);
      transition: color 0.2s ease;
    }

    .manual-key-value {
      font-family: monospace;
      font-size: 0.9375rem;
      color: var(--theme-color-text-primary);
      word-break: break-all;
      letter-spacing: 0.05em;
      transition: color 0.2s ease;
    }

    /* ── Forms ── */

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
      color: var(--theme-color-text-primary);
      transition: color 0.2s ease;
    }

    .form-field input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--theme-color-text-primary);
      background: var(--theme-color-surface);
      border: 1px solid var(--theme-color-border);
      border-radius: 6px;
      box-sizing: border-box;
      transition: background-color 0.2s ease, border-color 0.2s ease,
        color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-field input:focus {
      outline: none;
      border-color: var(--theme-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
    }

    .form-field input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--theme-color-error);
      background: var(--theme-color-surface);
      border: 1px solid var(--theme-color-error);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
      transition: all 0.2s ease;
    }

    /* ── Buttons ── */

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
      transition: background-color 0.2s ease, color 0.2s ease,
        border-color 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--theme-color-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--theme-color-primary-hover);
    }

    .btn-primary:active:not(:disabled) {
      background: var(--theme-color-primary-active);
    }

    .btn-secondary {
      background: var(--theme-color-surface);
      color: var(--theme-color-text-primary);
      border: 1px solid var(--theme-color-border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--theme-color-background);
    }

    .btn-danger {
      background: var(--theme-color-error);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-danger-outline {
      background: transparent;
      color: var(--theme-color-error);
      border: 1px solid var(--theme-color-error);
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: color-mix(in srgb, var(--theme-color-error) 8%, transparent);
    }

    .btn-ghost {
      background: transparent;
      color: var(--theme-color-text-secondary);
    }

    .btn-ghost:hover:not(:disabled) {
      color: var(--theme-color-text-primary);
      background: var(--theme-color-background);
    }

    /* ── Sign out ── */

    .actions {
      display: flex;
      justify-content: center;
      padding-bottom: 1rem;
    }

    /* ── Responsive ── */

    @media (max-width: 640px) {
      .main-content {
        padding: 1.5rem 1rem;
      }

      .card {
        padding: 1.5rem;
      }

      .user-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .value {
        text-align: left;
      }

      .button-row {
        flex-direction: column;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-page': ProfilePage;
  }
}
