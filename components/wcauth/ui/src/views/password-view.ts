import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "../i18n/localized.ts";
import { authSharedStyles } from "../styles.ts";
import { eyeIcon, eyeSlashIcon } from "../icons.ts";
import {
  loginWithPassword,
  AuthClientError,
  AuthErrorCode,
} from "../api/auth-client.ts";

/**
 * Password sign-in view — email + password form.
 *
 * Events dispatched (bubbles, composed):
 * - wcauth-success
 * - wcauth-navigate: { view: 'mfa', mfaToken: string }
 * - wcauth-navigate: { view: 'forgot-password', email: string }
 * - wcauth-navigate: { view: 'choice' }
 */
@customElement("wcauth-password")
@localized()
export class WcAuthPasswordView extends LitElement {
  @property({ type: String }) initialEmail = "";

  @state() private email = "";
  @state() private password = "";
  @state() private showPassword = false;
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

  private handlePasswordInput(e: Event) {
    this.password = (e.target as HTMLInputElement).value;
    if (this.errorMessage) this.errorMessage = "";
  }

  private togglePasswordVisibility(e: Event) {
    e.preventDefault();
    this.showPassword = !this.showPassword;
  }

  private handleForgotPassword() {
    this.dispatchEvent(
      new CustomEvent("wcauth-navigate", {
        detail: { view: "forgot-password", email: this.email },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleBack() {
    this.dispatchEvent(
      new CustomEvent("wcauth-navigate", {
        detail: { view: "choice" },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLoading) return;

    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password;

    if (!trimmedEmail || !trimmedPassword) {
      this.errorMessage = msg("Please enter your email and password.");
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    try {
      const result = await loginWithPassword(trimmedEmail, trimmedPassword);

      if (result && result.requiresMfa) {
        this.dispatchEvent(
          new CustomEvent("wcauth-navigate", {
            detail: { view: "mfa", mfaToken: result.mfaToken },
            bubbles: true,
            composed: true,
          }),
        );
        return;
      }

      this.dispatchEvent(
        new CustomEvent("wcauth-success", { bubbles: true, composed: true }),
      );
    } catch (error) {
      if (error instanceof AuthClientError) {
        switch (error.code) {
          case AuthErrorCode.INVALID_CREDENTIALS:
            this.errorMessage = msg(
              "Invalid email or password. Please try again.",
            );
            break;
          case AuthErrorCode.NETWORK_ERROR:
            this.errorMessage = msg(
              "Unable to connect. Please check your internet connection and try again.",
            );
            break;
          default:
            this.errorMessage = msg("Sign in failed. Please try again.");
        }
      } else {
        this.errorMessage = msg("Sign in failed. Please try again.");
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <form class="password-form" @submit=${this.handleSubmit}>
        <div class="form-field">
          <label for="auth-email">${msg("Email address")}</label>
          <input
            id="auth-email"
            type="email"
            autocomplete="email"
            .value=${this.email}
            @input=${this.handleEmailInput}
            ?disabled=${this.isLoading}
            required
          />
        </div>

        <div class="form-field password-field">
          <label for="auth-password">${msg("Password")}</label>
          <div class="password-input-wrapper">
            <input
              id="auth-password"
              type=${this.showPassword ? "text" : "password"}
              autocomplete="current-password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${this.isLoading}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${this.togglePasswordVisibility}
              aria-label=${this.showPassword
                ? msg("Hide password")
                : msg("Show password")}
              ?disabled=${this.isLoading}
            >
              ${this.showPassword ? eyeSlashIcon() : eyeIcon()}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="forgot-password-link"
          @click=${this.handleForgotPassword}
          ?disabled=${this.isLoading}
        >
          ${msg("Forgot password?")}
        </button>

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
          ${this.isLoading ? msg("Signing in\u2026") : msg("Sign in")}
        </button>
      </form>

      <button
        class="back-link"
        @click=${this.handleBack}
        ?disabled=${this.isLoading}
      >
        ${msg("Back to sign in options")}
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
    "wcauth-password": WcAuthPasswordView;
  }
}
