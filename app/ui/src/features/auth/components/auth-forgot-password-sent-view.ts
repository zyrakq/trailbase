import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authModalStyles } from './auth-modal.styles';

/**
 * Post-reset-request confirmation screen.
 * Shows a neutral "check your inbox" message (anti-enumeration: no confirmation
 * whether the email is registered or not).
 *
 * Events dispatched:
 * - auth-navigate: { view: 'choice' } — back to sign in
 */
@customElement('auth-forgot-password-sent-view')
@localized()
export class AuthForgotPasswordSentView extends LitElement {
  private handleBackToSignIn() {
    this.dispatchEvent(
      new CustomEvent('auth-navigate', {
        detail: { view: 'choice' },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="success-view">
        <p class="success-message">
          ${msg(
            "If this email address is registered, you'll receive a reset link shortly. Check your inbox."
          )}
        </p>
        <button class="btn btn-primary" @click=${this.handleBackToSignIn}>
          ${msg('Back to sign in')}
        </button>
      </div>
    `;
  }

  static styles = authModalStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-forgot-password-sent-view': AuthForgotPasswordSentView;
  }
}
