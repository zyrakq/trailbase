import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { sharedStatusStyles } from './shared-styles.ts';

@customElement('reset-password-success')
@localized()
export class ResetPasswordSuccess extends LitElement {
  render() {
    return html`
      <div class="reset-card status-card">
        <div class="status-icon success-icon" aria-hidden="true">✓</div>
        <p class="status-title">${msg('Password updated')}</p>
        <p class="status-message">
          ${msg('Your password has been reset. You can now sign in with your new password.')}
        </p>
        <button
          class="btn btn-primary"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('navigate', { bubbles: true, composed: true })
            )}
        >
          ${msg('Sign in')}
        </button>
      </div>
    `;
  }

  static styles = [sharedStatusStyles];
}

declare global {
  interface HTMLElementTagNameMap {
    'reset-password-success': ResetPasswordSuccess;
  }
}
