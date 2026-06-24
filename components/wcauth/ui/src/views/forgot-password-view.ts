import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "../i18n/localized.ts";
import { authSharedStyles } from "../styles.ts";
import {
  requestPasswordReset,
  AuthClientError,
  AuthErrorCode,
} from "../api/auth-client.ts";

/**
 * Forgot password view — email form to request a reset link.
 *
 * Events dispatched (bubbles, composed):
 * - wcauth-navigate: { view: 'forgot-password-sent' }
 * - wcauth-navigate: { view: 'password', email: string }
 */
@customElement("wcauth-forgot-password")
@localized()
export class WcAuthForgotPasswordView extends LitElement {
  @property({ type: String }) initialEmail = "";

  @state() private email = "";
  @state() private isLoading = false;
  @state() private errorMessage = "";

  connectedCallback() {
    super.connectedCallback();
    this.email = this.initialEmail;
  }

  private handleEmailInput(e: Event) {
    this.email = (e.target as HTMLInputElement).value;
    if (this.errorMessage) this.errorMessage = "";
  }

  private handleBack() {
    this.dispatchEvent(
      new CustomEvent("wcauth-navigate", {
        detail: { view: "password", email: this.email },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLoading) return;

    const trimmedEmail = this.email.trim();
    if (!trimmedEmail) {
      this.errorMessage = msg("Please enter your email address.");
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    try {
      await requestPasswordReset(trimmedEmail);
      this.dispatchEvent(
        new CustomEvent("wcauth-navigate", {
          detail: { view: "forgot-password-sent" },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      if (error instanceof AuthClientError) {
        switch (error.code) {
          case AuthErrorCode.RATE_LIMITED:
            this.errorMessage = msg(
              "A reset link was already sent. Check your inbox or wait 1 hour before trying again.",
            );
            break;
          case AuthErrorCode.EMAIL_NOT_SENT:
            this.errorMessage = msg(
              "Could not send the email. Please contact support.",
            );
            break;
          case AuthErrorCode.NETWORK_ERROR:
            this.errorMessage = msg(
              "Network error. Please check your connection.",
            );
            break;
          default:
            this.errorMessage =
              error.message || msg("An error occurred. Please try again.");
        }
      } else {
        this.errorMessage = msg("An error occurred. Please try again.");
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <form class="password-form" @submit=${this.handleSubmit}>
        <p class="mfa-subtitle">
          ${msg("Enter your email address and we'll send you a reset link.")}
        </p>

        <div class="form-field">
          <label for="forgot-email">${msg("Email address")}</label>
          <input
            id="forgot-email"
            type="email"
            autocomplete="email"
            .value=${this.email}
            @input=${this.handleEmailInput}
            ?disabled=${this.isLoading}
            required
          />
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">
              ${this.errorMessage}
            </div>`
          : ""}

        <button
          type="submit"
          class="btn btn-primary"
          ?disabled=${this.isLoading}
        >
          ${this.isLoading ? msg("Sending\u2026") : msg("Send reset link")}
        </button>
      </form>

      <button
        class="back-link"
        @click=${this.handleBack}
        ?disabled=${this.isLoading}
      >
        ${msg("Back to sign in")}
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
    "wcauth-forgot-password": WcAuthForgotPasswordView;
  }
}
