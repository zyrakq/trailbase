import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../services/auth.service';
import { AuthError, AuthErrorCode } from '../types/auth-error';
import { authModalStyles } from './auth-modal.styles';

/**
 * MFA / TOTP verification view.
 *
 * Events dispatched:
 * - auth-success: () → parent closes modal + shows toast
 * - auth-navigate: { view: 'password' } — back button
 */
@customElement('auth-mfa-view')
@localized()
export class AuthMfaView extends LitElement {
  @property({ type: String }) mfaToken = '';

  @state() private mfaCode = '';
  @state() private isLoading = false;
  @state() private errorMessage = '';

  private handleCodeInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.mfaCode = target.value.replace(/\D/g, '').slice(0, 6);
    if (this.errorMessage) this.errorMessage = '';
  }

  private handleBack() {
    this.dispatchEvent(
      new CustomEvent('auth-navigate', {
        detail: { view: 'password' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLoading) return;

    const code = this.mfaCode.trim();
    if (code.length !== 6) {
      this.errorMessage = msg('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await authService.loginWithMfa(this.mfaToken, code);
      this.dispatchEvent(new CustomEvent('auth-success', { bubbles: true, composed: true }));
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.errorMessage = msg('Invalid code. Please try again.');
      } else if (error instanceof AuthError && error.code === AuthErrorCode.NETWORK_ERROR) {
        this.errorMessage = msg(
          'Unable to connect. Please check your internet connection and try again.'
        );
      } else {
        this.errorMessage = msg('Verification failed. Please try again.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <form class="password-form" @submit=${this.handleSubmit}>
        <p class="mfa-subtitle">
          ${msg('Enter the 6-digit code from your authenticator app.')}
        </p>

        <div class="form-field">
          <label for="mfa-code">${msg('Verification code')}</label>
          <input
            id="mfa-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            .value=${this.mfaCode}
            @input=${this.handleCodeInput}
            ?disabled=${this.isLoading}
            required
          />
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button
          type="submit"
          class="btn btn-primary"
          ?disabled=${this.isLoading || this.mfaCode.length !== 6}
        >
          ${this.isLoading ? msg('Verifying...') : msg('Verify')}
        </button>
      </form>

      <button class="back-link" @click=${this.handleBack} ?disabled=${this.isLoading}>
        ${msg('Back to sign in')}
      </button>
    `;
  }

  static styles = authModalStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-mfa-view': AuthMfaView;
  }
}
