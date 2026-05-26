import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { sharedStatusStyles } from './shared-styles.ts';

@customElement('reset-password-error')
@localized()
export class ResetPasswordError extends LitElement {
  render() {
    return html`
      <div class="reset-card status-card">
        <p class="status-title">${msg('Something went wrong')}</p>
        <p class="status-message">
          ${msg('An unexpected error occurred. Please try again or contact support.')}
        </p>
        <button
          class="btn btn-primary"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('navigate', { bubbles: true, composed: true })
            )}
        >
          ${msg('Go to home')}
        </button>
      </div>
    `;
  }

  static styles = [sharedStatusStyles];
}

declare global {
  interface HTMLElementTagNameMap {
    'reset-password-error': ResetPasswordError;
  }
}
