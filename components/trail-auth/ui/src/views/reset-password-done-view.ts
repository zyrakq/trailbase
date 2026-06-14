import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('trail-auth-reset-password-done')
export class TrailAuthResetPasswordDone extends LitElement {
  render() {
    return html`
      <div class="done">
        <div class="success-icon" aria-hidden="true">✓</div>
        <p class="message">Your password has been updated successfully.</p>
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
          Sign in
        </button>
      </div>
    `;
  }

  static styles = css`
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

    .btn {
      padding: 0.625rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-primary {
      background: var(--theme-color-primary, #6366f1);
      color: white;
    }

    .btn-primary:hover {
      background: var(--theme-color-primary-hover, #4f46e5);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'trail-auth-reset-password-done': TrailAuthResetPasswordDone;
  }
}
