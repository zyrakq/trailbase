import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import type { TotpSetupData } from '@/features/auth';

export type TotpSetupState =
  | 'idle'
  | 'loading-qr'
  | 'qr-ready'
  | 'confirming'
  | 'enabled'
  | 'disabling';

export type TotpActionPayload =
  | { kind: 'enable' }
  | { kind: 'confirm-setup'; code: string }
  | { kind: 'start-disable' }
  | { kind: 'confirm-disable'; code: string }
  | { kind: 'cancel-disable' }
  | { kind: 'verify-code-input'; value: string }
  | { kind: 'disable-code-input'; value: string };

@customElement('profile-security-card')
@localized()
export class ProfileSecurityCard extends LitElement {
  @property({ type: String })
  totpState: TotpSetupState = 'idle';

  @property({ attribute: false })
  totpData: TotpSetupData | null = null;

  @property({ type: String })
  totpSecret: string | null = null;

  @property({ type: String })
  verifyCode = '';

  @property({ type: String })
  disableCode = '';

  @property({ type: String })
  totpError = '';

  private emit(payload: TotpActionPayload) {
    this.dispatchEvent(
      new CustomEvent<TotpActionPayload>('totp-action', {
        detail: payload,
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
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
        @click=${() => this.emit({ kind: 'enable' })}
        ?disabled=${isLoading}
      >
        ${isLoading ? msg('Loading...') : msg('Enable two-factor authentication')}
      </button>
    `;
  }

  private renderTotpQrReady() {
    const isConfirming = this.totpState === 'confirming';
    const secret = this.totpSecret;

    return html`
      <p class="totp-description">
        ${msg('Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to verify.')}
      </p>

      ${this.totpData?.qrPng
        ? html`
            <div class="qr-container">
              <img
                src="data:image/png;base64,${this.totpData.qrPng}"
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

      <form
        class="totp-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.emit({ kind: 'confirm-setup', code: this.verifyCode });
        }}
      >
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
            @input=${(e: Event) =>
              this.emit({
                kind: 'verify-code-input',
                value: (e.target as HTMLInputElement).value,
              })}
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
      <button
        class="btn btn-danger-outline"
        @click=${() => this.emit({ kind: 'start-disable' })}
      >
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
      <form
        class="totp-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.emit({ kind: 'confirm-disable', code: this.disableCode });
        }}
      >
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
            @input=${(e: Event) =>
              this.emit({
                kind: 'disable-code-input',
                value: (e.target as HTMLInputElement).value,
              })}
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
            @click=${() => this.emit({ kind: 'cancel-disable' })}
          >
            ${msg('Cancel')}
          </button>
        </div>
      </form>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

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

    @media (max-width: 640px) {
      .card {
        padding: 1.5rem;
      }

      .button-row {
        flex-direction: column;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-security-card': ProfileSecurityCard;
  }
}
