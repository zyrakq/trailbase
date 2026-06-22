import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '../i18n/localized';
import { authSharedStyles } from '../styles.ts';

/**
 * Email verification success screen — shown after the backend confirms
 * an email. No API calls, no token, no form.
 *
 * Events dispatched (bubbles, composed):
 * - trail-auth-navigate: { view: 'choice' }
 */
@customElement('trail-auth-verify-email')
@localized()
export class TrailAuthVerifyEmail extends LitElement {
  render() {
    return html`
      <div class="done">
        <div class="success-icon" aria-hidden="true">&#10003;</div>
        <p class="message">${msg('Your email has been verified.')}</p>
        <button
          class="btn btn-primary"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('trail-auth-navigate', {
                detail: { view: 'choice' },
                bubbles: true,
                composed: true,
              })
            )}
        >
          ${msg('Sign in')}
        </button>
      </div>
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      :host {
        display: block;
      }

      .done {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem 0;
        text-align: center;
      }

      .success-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--theme-color-success, #22c55e) 15%, transparent);
        color: var(--theme-color-success, #22c55e);
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .message {
        font-size: 0.9375rem;
        color: var(--theme-color-text-secondary, #6b7280);
        margin: 0;
        line-height: 1.5;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'trail-auth-verify-email': TrailAuthVerifyEmail;
  }
}
