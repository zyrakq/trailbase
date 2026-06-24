import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import {
  changeEmail,
  AuthClientError,
  AuthErrorCode,
} from "./api/auth-client.ts";

type EmailState = "editing" | "submitting" | "verification-sent";

@customElement("wcauth-profile-email")
@localized()
export class WcAuthProfileEmail extends LitElement {
  @property({ type: String }) currentEmail = "";

  @state() private state: EmailState = "editing";
  @state() private emailValue = "";
  @state() private errorMessage = "";

  connectedCallback() {
    super.connectedCallback();
    this.emailValue = this.currentEmail;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    if (this.emailValue === this.currentEmail) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.emailValue)) {
      this.errorMessage = msg("Please enter a valid email address.");
      return;
    }

    this.state = "submitting";
    this.errorMessage = "";

    try {
      await changeEmail(this.currentEmail, this.emailValue);
      this.state = "verification-sent";
      this.dispatchEvent(
        new CustomEvent("wcauth-profile-email-changed", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      if (err instanceof AuthClientError) {
        switch (err.code) {
          case AuthErrorCode.EMAIL_TAKEN:
            this.errorMessage = msg("Email already in use");
            break;
          case AuthErrorCode.RATE_LIMITED:
            this.errorMessage = msg("Please wait before trying again");
            break;
          case AuthErrorCode.BAD_REQUEST:
            this.errorMessage = err.message || msg("Invalid request");
            break;
          default:
            this.errorMessage = msg(
              "Failed to request email change. Please try again.",
            );
        }
      } else {
        this.errorMessage = msg(
          "Failed to request email change. Please try again.",
        );
      }
      this.state = "editing";
    }
  }

  private handleBack() {
    this.state = "editing";
    this.emailValue = this.currentEmail;
    this.errorMessage = "";
  }

  private renderEditing() {
    const isSubmitting = this.state === "submitting";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailPattern.test(this.emailValue);
    const isUnchanged = this.emailValue === this.currentEmail;

    return html`
      <form @submit=${this.handleSubmit}>
        <div class="form-field">
          <label for="wcauth-email-input">${msg("Email")}</label>
          <div class="input-wrapper">
            <input
              id="wcauth-email-input"
              type="email"
              autocomplete="email"
              .value=${this.emailValue}
              @input=${(e: Event) => {
                this.emailValue = (e.target as HTMLInputElement).value;
                if (this.errorMessage) this.errorMessage = "";
              }}
              ?disabled=${isSubmitting}
              required
            />
            <button
              type="submit"
              class="btn-inline"
              ?disabled=${isSubmitting || isUnchanged || !isValid}
            >
              ${isSubmitting ? msg("...") : msg("Change")}
            </button>
          </div>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">
              ${this.errorMessage}
            </div>`
          : ""}
      </form>
    `;
  }

  private renderVerificationSent() {
    return html`
      <div class="success-message">
        ${msg("Verification email sent to")}
        <strong>${this.emailValue}</strong>. ${msg("Check your inbox.")}
      </div>
      <button class="btn-back" @click=${this.handleBack}>${msg("Back")}</button>
    `;
  }

  render() {
    return html`
      <div class="card">
        <h2 class="card-title">${msg("Email")}</h2>
        ${this.state === "verification-sent"
          ? this.renderVerificationSent()
          : this.renderEditing()}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        sans-serif;
      font-size: 1rem;
      color: var(--theme-color-text-primary, #111827);
    }

    .card {
      background: var(--theme-color-surface, #ffffff);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: var(--theme-shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
      margin: 0 0 1.5rem 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-color-text-primary, #111827);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper input {
      width: 100%;
      padding: 0.625rem 4.5rem 0.625rem 0.75rem;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--theme-color-text-primary, #111827);
      background: var(--theme-color-surface, #f9fafb);
      border: 1px solid var(--theme-color-border, #e5e7eb);
      border-radius: 6px;
      box-sizing: border-box;
      margin: 0;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .input-wrapper input:focus {
      outline: none;
      border-color: var(--theme-color-primary, #6366f1);
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--theme-color-primary, #6366f1) 15%, transparent);
    }

    .input-wrapper input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-inline {
      position: absolute;
      right: 0.375rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      font-family: inherit;
      color: white;
      background: var(--theme-color-primary, #6366f1);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-inline:hover:not(:disabled) {
      background: var(--theme-color-primary-hover, #4f46e5);
    }

    .btn-inline:active:not(:disabled) {
      background: var(--theme-color-primary-active, #4338ca);
    }

    .btn-inline:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--theme-color-error, #ef4444);
      background: var(--theme-color-surface, #f9fafb);
      border: 1px solid var(--theme-color-error, #ef4444);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
    }

    .success-message {
      font-size: 0.9375rem;
      color: var(--theme-color-success, #22c55e);
      background: color-mix(
        in srgb,
        var(--theme-color-success, #22c55e) 12%,
        transparent
      );
      border-radius: 6px;
      padding: 0.75rem 1rem;
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }

    .btn-back {
      padding: 0;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--theme-color-text-secondary, #6b7280);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .btn-back:hover {
      color: var(--theme-color-text-primary, #111827);
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .card {
        padding: 1.5rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-profile-email": WcAuthProfileEmail;
  }
}
