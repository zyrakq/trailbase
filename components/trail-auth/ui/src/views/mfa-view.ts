import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { authSharedStyles } from '../styles.ts';
import { loginWithMfa, AuthClientError, AuthErrorCode } from '../api/auth-client.ts';

/**
 * MFA / TOTP verification view.
 *
 * Events dispatched (bubbles, composed):
 * - trail-auth-success
 * - trail-auth-navigate: { view: 'password' }
 */
@customElement('trail-auth-mfa')
export class TrailAuthMfaView extends LitElement {
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
      new CustomEvent('trail-auth-navigate', {
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
      this.errorMessage = 'Please enter the 6-digit code from your authenticator app.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await loginWithMfa(this.mfaToken, code);
      this.dispatchEvent(
        new CustomEvent('trail-auth-success', { bubbles: true, composed: true })
      );
    } catch (error) {
      if (error instanceof AuthClientError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.errorMessage = 'Invalid code. Please try again.';
      } else if (error instanceof AuthClientError && error.code === AuthErrorCode.NETWORK_ERROR) {
        this.errorMessage =
          'Unable to connect. Please check your internet connection and try again.';
      } else {
        this.errorMessage = 'Verification failed. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <form class="password-form" @submit=${this.handleSubmit}>
        <p class="mfa-subtitle">Enter the 6-digit code from your authenticator app.</p>

        <div class="form-field">
          <label for="mfa-code">Verification code</label>
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
          ${this.isLoading ? 'Verifying\u2026' : 'Verify'}
        </button>
      </form>

      <button class="back-link" @click=${this.handleBack} ?disabled=${this.isLoading}>
        Back to sign in
      </button>
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      .password-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'trail-auth-mfa': TrailAuthMfaView;
  }
}
