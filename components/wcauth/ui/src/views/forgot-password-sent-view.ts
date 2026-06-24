import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "../i18n/localized.ts";
import { authSharedStyles } from "../styles.ts";

/**
 * Post-reset-request confirmation screen (anti-enumeration: neutral message).
 *
 * Events dispatched (bubbles, composed):
 * - wcauth-navigate: { view: 'choice' }
 */
@customElement("wcauth-forgot-password-sent")
@localized()
export class WcAuthForgotPasswordSentView extends LitElement {
  private handleBackToSignIn() {
    this.dispatchEvent(
      new CustomEvent("wcauth-navigate", {
        detail: { view: "choice" },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="success-view">
        <p class="success-message">
          ${msg(
            "If this email address is registered, you'll receive a reset link shortly. Check your inbox.",
          )}
        </p>
        <button class="btn btn-primary" @click=${this.handleBackToSignIn}>
          ${msg("Back to sign in")}
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

      .success-message {
        font-size: 0.875rem;
        color: var(--theme-color-text-secondary, #6b7280);
        margin: 0;
        line-height: 1.5;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-forgot-password-sent": WcAuthForgotPasswordSentView;
  }
}
