import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "../i18n/localized.ts";
import { authSharedStyles } from "../styles.ts";
import {
  updatePassword,
  AuthClientError,
  AuthErrorCode,
} from "../api/auth-client.ts";

@customElement("wcauth-reset-password")
@localized()
export class WcAuthResetPassword extends LitElement {
  @property({ type: String }) token = "";

  @state() private password = "";
  @state() private confirmPassword = "";
  @state() private isLoading = false;
  @state() private errorMessage = "";
  @state() private invalidToken = false;
  @state() private showPassword = false;

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLoading) return;

    if (this.password !== this.confirmPassword) {
      this.errorMessage = msg("Passwords do not match");
      return;
    }
    if (!this.token) {
      this.invalidToken = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    try {
      await updatePassword(this.token, this.password);
      this.dispatchEvent(
        new CustomEvent("wcauth-navigate", {
          detail: { view: "reset-password-done" },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      if (
        err instanceof AuthClientError &&
        err.code === AuthErrorCode.UNKNOWN &&
        err.message === "invalid-token"
      ) {
        this.invalidToken = true;
      } else if (err instanceof AuthClientError) {
        this.errorMessage = msg(
          "Password does not meet requirements. Please choose a stronger password.",
        );
      } else {
        this.errorMessage = msg("Something went wrong. Please try again.");
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.invalidToken) {
      return html`
        <div class="invalid-token">
          <p class="error-message">
            ${msg("This password reset link is invalid or has expired.")}
          </p>
          <button
            class="btn btn-ghost"
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent("wcauth-navigate", {
                  detail: { view: "forgot-password" },
                  bubbles: true,
                  composed: true,
                }),
              )}
          >
            ${msg("Request a new link")}
          </button>
        </div>
      `;
    }

    return html`
      <form class="form" @submit=${this.handleSubmit} novalidate>
        <div class="form-field">
          <label for="wcauth-reset-password">${msg("New password")}</label>
          <div class="input-wrapper">
            <input
              id="wcauth-reset-password"
              type=${this.showPassword ? "text" : "password"}
              autocomplete="new-password"
              placeholder=${msg("New password")}
              .value=${this.password}
              @input=${(e: Event) => {
                this.password = (e.target as HTMLInputElement).value;
                if (this.errorMessage) this.errorMessage = "";
              }}
              ?disabled=${this.isLoading}
              required
            />
          </div>
        </div>

        <div class="form-field">
          <label for="wcauth-reset-confirm">${msg("Confirm password")}</label>
          <div class="input-wrapper">
            <input
              id="wcauth-reset-confirm"
              type=${this.showPassword ? "text" : "password"}
              autocomplete="new-password"
              placeholder=${msg("Confirm new password")}
              .value=${this.confirmPassword}
              @input=${(e: Event) => {
                this.confirmPassword = (e.target as HTMLInputElement).value;
                if (this.errorMessage) this.errorMessage = "";
              }}
              ?disabled=${this.isLoading}
              required
            />
          </div>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">
              ${this.errorMessage}
            </div>`
          : ""}

        <button
          type="submit"
          class="btn btn-primary"
          ?disabled=${this.isLoading || !this.password || !this.confirmPassword}
        >
          ${this.isLoading
            ? msg("Setting password...")
            : msg("Set new password")}
        </button>
      </form>
    `;
  }

  static styles = authSharedStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-reset-password": WcAuthResetPassword;
  }
}
