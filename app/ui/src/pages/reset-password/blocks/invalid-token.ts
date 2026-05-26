import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { sharedStatusStyles } from './shared-styles.ts';

@customElement('reset-password-invalid-token')
@localized()
export class ResetPasswordInvalidToken extends LitElement {
  render() {
    return html`
      <div class="reset-card status-card">
        <div class="status-icon error-icon" aria-hidden="true">✕</div>
        <p class="status-title">${msg('Link expired')}</p>
        <p class="status-message">
          ${msg('This link is invalid or has expired. Reset links are valid for 60 minutes.')}
        </p>
        <button
          class="btn btn-primary"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('navigate', { bubbles: true, composed: true })
            )}
        >
          ${msg('Request new link')}
        </button>
      </div>
    `;
  }

  static styles = [sharedStatusStyles];
}

declare global {
  interface HTMLElementTagNameMap {
    'reset-password-invalid-token': ResetPasswordInvalidToken;
  }
}
