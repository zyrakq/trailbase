import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg, str } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import {
  changePassword,
  setPassword,
  AuthClientError,
  AuthErrorCode,
  type PasswordPolicy,
} from "./api/auth-client.ts";
import { eyeIcon, eyeSlashIcon } from "./icons.ts";

type PasswordState = "editing" | "submitting" | "success";

@customElement("wcauth-profile-password")
@localized()
export class WcAuthProfilePassword extends LitElement {
  @property({ attribute: false }) passwordPolicy: PasswordPolicy = {
    minLength: 8,
    maxLength: 128,
    mustContainUpperAndLowerCase: false,
    mustContainDigits: false,
    mustContainSpecialCharacters: false,
  };

  @property({ type: String }) mode: "change" | "set" = "change";

  @state() private state: PasswordState = "editing";
  @state() private oldPassword = "";
  @state() private newPassword = "";
  @state() private newPasswordRepeat = "";
  @state() private showOldPassword = false;
  @state() private showNewPassword = false;
  @state() private errorMessage = "";

  private get validationChecks(): Array<{ requirement: string; met: boolean }> {
    const pw = this.newPassword;
    const checks: Array<{ requirement: string; met: boolean }> = [];
    const minLength = this.passwordPolicy.minLength;
    checks.push({
      requirement: msg(str`At least ${minLength} characters`),
      met: pw.length >= this.passwordPolicy.minLength,
    });
    if (this.passwordPolicy.mustContainUpperAndLowerCase) {
      checks.push({
        requirement: msg("Both upper and lower case letters"),
        met: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
      });
    }
    if (this.passwordPolicy.mustContainDigits) {
      checks.push({
        requirement: msg("At least one digit"),
        met: /\d/.test(pw),
      });
    }
    if (this.passwordPolicy.mustContainSpecialCharacters) {
      checks.push({
        requirement: msg("At least one special character"),
        met: !/^[a-zA-Z0-9]*$/.test(pw),
      });
    }
    return checks;
  }

  private get canSubmit(): boolean {
    const oldPasswordOk = this.mode === "set" || !!this.oldPassword;
    return (
      oldPasswordOk &&
      !!this.newPassword &&
      !!this.newPasswordRepeat &&
      this.newPassword === this.newPasswordRepeat &&
      this.validationChecks.every((c) => c.met)
    );
  }

  private resetForm() {
    this.oldPassword = "";
    this.newPassword = "";
    this.newPasswordRepeat = "";
    this.showOldPassword = false;
    this.showNewPassword = false;
    this.errorMessage = "";
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    if (!this.canSubmit) return;

    this.errorMessage = "";
    this.state = "submitting";

    try {
      if (this.mode === "set") {
        await setPassword(this.newPassword, this.newPasswordRepeat);
      } else {
        await changePassword(
          this.oldPassword,
          this.newPassword,
          this.newPasswordRepeat,
        );
      }
      this.resetForm();
      this.state = "success";
    } catch (err) {
      if (err instanceof AuthClientError) {
        switch (err.code) {
          case AuthErrorCode.INVALID_CREDENTIALS:
            this.errorMessage = msg("Current password is incorrect");
            break;
          case AuthErrorCode.WEAK_PASSWORD:
            this.errorMessage = msg("Password does not meet requirements");
            break;
          case AuthErrorCode.RATE_LIMITED:
            this.errorMessage = msg(
              "Too many attempts. Please try again later.",
            );
            break;
          case AuthErrorCode.BAD_REQUEST:
            this.errorMessage = err.message || msg("Invalid request");
            break;
          default:
            this.errorMessage = msg(
              "Failed to change password. Please try again.",
            );
        }
      } else {
        this.errorMessage = msg("Failed to change password. Please try again.");
      }
      this.state = "editing";
    }
  }

  private handleDone() {
    this.resetForm();
    this.state = "editing";
  }

  private renderForm() {
    const isSubmitting = this.state === "submitting";

    return html`
      <form @submit=${this.handleSubmit}>
        ${this.mode === "change"
          ? html`
              <div class="form-field">
                <label for="wcauth-pwd-old">${msg("Current password")}</label>
                <div class="password-input-wrapper">
                  <input
                    id="wcauth-pwd-old"
                    type=${this.showOldPassword ? "text" : "password"}
                    autocomplete="current-password"
                    .value=${this.oldPassword}
                    @input=${(e: Event) => {
                      this.oldPassword = (e.target as HTMLInputElement).value;
                      if (this.errorMessage) this.errorMessage = "";
                    }}
                    ?disabled=${isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click=${() => {
                      this.showOldPassword = !this.showOldPassword;
                    }}
                    ?disabled=${isSubmitting}
                    aria-label=${this.showOldPassword
                      ? msg("Hide password")
                      : msg("Show password")}
                  >
                    ${this.showOldPassword ? eyeSlashIcon() : eyeIcon()}
                  </button>
                </div>
              </div>
            `
          : ""}

        <div class="form-field">
          <label for="wcauth-pwd-new">${msg("New password")}</label>
          <div class="password-input-wrapper">
            <input
              id="wcauth-pwd-new"
              type=${this.showNewPassword ? "text" : "password"}
              autocomplete="new-password"
              .value=${this.newPassword}
              @input=${(e: Event) => {
                this.newPassword = (e.target as HTMLInputElement).value;
                if (this.errorMessage) this.errorMessage = "";
              }}
              ?disabled=${isSubmitting}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${() => {
                this.showNewPassword = !this.showNewPassword;
              }}
              ?disabled=${isSubmitting}
              aria-label=${this.showNewPassword
                ? msg("Hide password")
                : msg("Show password")}
            >
              ${this.showNewPassword ? eyeSlashIcon() : eyeIcon()}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label for="wcauth-pwd-repeat">${msg("Confirm new password")}</label>
          <div class="password-input-wrapper">
            <input
              id="wcauth-pwd-repeat"
              type=${this.showNewPassword ? "text" : "password"}
              autocomplete="new-password"
              .value=${this.newPasswordRepeat}
              @input=${(e: Event) => {
                this.newPasswordRepeat = (e.target as HTMLInputElement).value;
                if (this.errorMessage) this.errorMessage = "";
              }}
              ?disabled=${isSubmitting}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${() => {
                this.showNewPassword = !this.showNewPassword;
              }}
              ?disabled=${isSubmitting}
              aria-label=${this.showNewPassword
                ? msg("Hide password")
                : msg("Show password")}
            >
              ${this.showNewPassword ? eyeSlashIcon() : eyeIcon()}
            </button>
          </div>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">
              ${this.errorMessage}
            </div>`
          : ""}
        ${this.newPassword.length > 0
          ? html`
              <ul class="validation-hints">
                ${this.validationChecks.map(
                  (c) => html`
                    <li class=${c.met ? "hint-met" : "hint-unmet"}>
                      <span class="hint-icon" aria-hidden="true"
                        >${c.met ? "✓" : "○"}</span
                      >
                      ${c.requirement}
                    </li>
                  `,
                )}
              </ul>
            `
          : ""}

        <button
          type="submit"
          class="btn btn-primary"
          ?disabled=${isSubmitting || !this.canSubmit}
        >
          ${isSubmitting
            ? msg("Changing password...")
            : this.mode === "set"
              ? msg("Create password")
              : msg("Change password")}
        </button>
      </form>
    `;
  }

  private renderSuccess() {
    return html`
      <div class="success-message">
        <span class="success-icon" aria-hidden="true">✓</span>
        <span>${msg("Password changed successfully")}</span>
      </div>
      <button class="btn-back" @click=${this.handleDone}>${msg("Done")}</button>
    `;
  }

  render() {
    return html`
      <div class="card">
        <h2 class="card-title">${msg("Password")}</h2>
        ${this.state === "success" ? this.renderSuccess() : this.renderForm()}
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
      gap: 1rem;
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

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input-wrapper input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 0.75rem;
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

    .password-input-wrapper input:focus {
      outline: none;
      border-color: var(--theme-color-primary, #6366f1);
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--theme-color-primary, #6366f1) 15%, transparent);
    }

    .password-input-wrapper input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .password-toggle {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--theme-color-text-secondary, #6b7280);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
    }

    .password-toggle:hover:not(:disabled) {
      color: var(--theme-color-text-primary, #111827);
    }

    .password-toggle:focus {
      outline: 2px solid var(--theme-color-primary, #6366f1);
      outline-offset: 1px;
    }

    .password-toggle:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
      transition: background-color 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--theme-color-primary, #6366f1);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--theme-color-primary-hover, #4f46e5);
    }

    .btn-primary:active:not(:disabled) {
      background: var(--theme-color-primary-active, #4338ca);
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      padding: 0.625rem 0.875rem;
      border-radius: 6px;
      background: color-mix(
        in srgb,
        var(--theme-color-success, #22c55e) 12%,
        transparent
      );
      color: var(--theme-color-success, #22c55e);
      margin-bottom: 0.75rem;
    }

    .success-icon {
      font-size: 1rem;
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

    .validation-hints {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .validation-hints li {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      transition: color 0.2s ease;
    }

    .hint-icon {
      font-size: 0.75rem;
      line-height: 1;
    }

    .hint-met {
      color: var(--theme-color-success, #22c55e);
    }

    .hint-unmet {
      color: var(--theme-color-text-secondary, #6b7280);
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
    "wcauth-profile-password": WcAuthProfilePassword;
  }
}
