import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authSharedStyles } from '../auth-shared.styles';

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

  static styles = [
    authSharedStyles,
    css`
      .success-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
        text-align: center;
      }

      .success-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--theme-color-success);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .success-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--theme-color-text-primary);
        margin: 0;
      }

      .success-message {
        font-size: 0.875rem;
        color: var(--theme-color-text-secondary);
        margin: 0;
        line-height: 1.5;
      }

      .resend-confirmation {
        font-size: 0.875rem;
        color: var(--theme-color-success);
        margin: 0;
      }

      .resend-rate-limited {
        font-size: 0.875rem;
        color: var(--theme-color-text-muted);
        margin: 0;
      }

      .resend-smtp-error {
        font-size: 0.875rem;
        color: var(--theme-color-error);
        margin: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-forgot-password-sent-view': AuthForgotPasswordSentView;
  }
}
