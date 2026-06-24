import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import {
  registerTotp,
  confirmTotp,
  unregisterTotp,
  type TotpSetupData,
  AuthClientError,
  AuthErrorCode,
} from "./api/auth-client.ts";

type TotpState =
  | "idle"
  | "loading-qr"
  | "qr-ready"
  | "confirming"
  | "enabled"
  | "disabling";

@customElement("wcauth-profile-totp")
@localized()
export class WcAuthProfileTotp extends LitElement {
  @property({ type: Boolean, attribute: "has-mfa" }) hasMfa = false;

  @state() private totpState: TotpState = "idle";
  @state() private totpSetupData: TotpSetupData | null = null;
  @state() private verifyCode = "";
  @state() private disableCode = "";
  @state() private totpError = "";

  connectedCallback() {
    super.connectedCallback();
    this.totpState = this.hasMfa ? "enabled" : "idle";
  }

  private async handleEnableTotp() {
    this.totpError = "";
    this.totpState = "loading-qr";
    try {
      this.totpSetupData = await registerTotp(true);
      this.verifyCode = "";
      this.totpState = "qr-ready";
    } catch {
      this.totpState = "idle";
    }
  }

  private async handleConfirmTotp() {
    if (this.totpState === "confirming" || !this.totpSetupData) return;
    if (this.verifyCode.length !== 6) {
      this.totpError = msg(
        "Please enter the 6-digit code from your authenticator app.",
      );
      return;
    }
    this.totpState = "confirming";
    this.totpError = "";
    try {
      await confirmTotp(this.totpSetupData.totpUrl, this.verifyCode);
      this.totpState = "enabled";
      this.totpSetupData = null;
      this.verifyCode = "";
      this.dispatchEvent(
        new CustomEvent("wcauth-profile-totp-changed", {
          detail: { enabled: true },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      if (
        err instanceof AuthClientError &&
        err.code === AuthErrorCode.INVALID_CREDENTIALS
      ) {
        this.totpError = msg("Invalid code. Please try again.");
      } else {
        this.totpError = msg("Verification failed. Please try again.");
      }
      this.totpState = "qr-ready";
    }
  }

  private async handleDisableTotp() {
    if (this.disableCode.length !== 6) {
      this.totpError = msg(
        "Please enter the 6-digit code from your authenticator app.",
      );
      return;
    }
    this.totpError = "";
    try {
      await unregisterTotp(this.disableCode);
      this.totpState = "idle";
      this.disableCode = "";
      this.dispatchEvent(
        new CustomEvent("wcauth-profile-totp-changed", {
          detail: { enabled: false },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      if (
        err instanceof AuthClientError &&
        err.code === AuthErrorCode.INVALID_CREDENTIALS
      ) {
        this.totpError = msg("Invalid code. Please try again.");
      } else {
        this.totpError = msg(
          "Failed to disable two-factor authentication. Please try again.",
        );
      }
    }
  }

  private extractSecret(totpUrl: string): string | null {
    try {
      return new URL(totpUrl).searchParams.get("secret");
    } catch {
      return null;
    }
  }

  private renderTotpIdle() {
    const isLoading = this.totpState === "loading-qr";
    return html`
      <p class="totp-description">
        ${msg(
          "Add an extra layer of security to your account by requiring a code from your authenticator app when signing in.",
        )}
      </p>
      <button
        class="btn btn-secondary"
        @click=${this.handleEnableTotp}
        ?disabled=${isLoading}
      >
        ${isLoading
          ? msg("Loading...")
          : msg("Enable two-factor authentication")}
      </button>
    `;
  }

  private renderTotpQrReady() {
    const isConfirming = this.totpState === "confirming";
    const secret = this.totpSetupData
      ? this.extractSecret(this.totpSetupData.totpUrl)
      : null;

    return html`
      <p class="totp-description">
        ${msg(
          "Scan the QR code with your authenticator app, then enter the 6-digit code to verify.",
        )}
      </p>

      ${this.totpSetupData?.qrPng
        ? html`<div class="qr-container">
            <img
              src="data:image/png;base64,${this.totpSetupData.qrPng}"
              alt=${msg("TOTP QR code")}
              class="qr-image"
            />
          </div>`
        : ""}
      ${secret
        ? html`<div class="manual-key">
            <span class="manual-key-label">${msg("Manual entry key:")}</span>
            <code class="manual-key-value">${secret}</code>
          </div>`
        : ""}

      <form
        class="totp-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.handleConfirmTotp();
        }}
      >
        <div class="form-field">
          <label for="wcauth-profile-verify-code"
            >${msg("Verification code")}</label
          >
          <input
            id="wcauth-profile-verify-code"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="6"
            placeholder="000000"
            .value=${this.verifyCode}
            @input=${(e: Event) => {
              this.verifyCode = (e.target as HTMLInputElement).value
                .replace(/\D/g, "")
                .slice(0, 6);
              if (this.totpError) this.totpError = "";
            }}
            ?disabled=${isConfirming}
            required
          />
        </div>

        ${this.totpError
          ? html`<div class="error-message" role="alert">
              ${this.totpError}
            </div>`
          : ""}

        <button
          type="submit"
          class="btn btn-primary"
          ?disabled=${isConfirming || this.verifyCode.length !== 6}
        >
          ${isConfirming ? msg("Verifying...") : msg("Verify and enable")}
        </button>
      </form>
    `;
  }

  private renderTotpEnabled() {
    return html`
      <div class="totp-status totp-status--enabled">
        <span class="status-icon" aria-hidden="true">✓</span>
        <span>${msg("Two-factor authentication is enabled")}</span>
      </div>
      <button
        class="btn btn-danger-outline"
        @click=${() => {
          this.disableCode = "";
          this.totpError = "";
          this.totpState = "disabling";
        }}
      >
        ${msg("Disable two-factor authentication")}
      </button>
    `;
  }

  private renderTotpDisabling() {
    return html`
      <div class="totp-status totp-status--enabled">
        <span class="status-icon" aria-hidden="true">✓</span>
        <span>${msg("Two-factor authentication is enabled")}</span>
      </div>
      <p class="totp-description">
        ${msg(
          "Enter your current authenticator code to disable two-factor authentication.",
        )}
      </p>
      <form
        class="totp-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.handleDisableTotp();
        }}
      >
        <div class="form-field">
          <label for="wcauth-profile-disable-code"
            >${msg("Current code")}</label
          >
          <input
            id="wcauth-profile-disable-code"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="6"
            placeholder="000000"
            .value=${this.disableCode}
            @input=${(e: Event) => {
              this.disableCode = (e.target as HTMLInputElement).value
                .replace(/\D/g, "")
                .slice(0, 6);
              if (this.totpError) this.totpError = "";
            }}
            required
          />
        </div>

        ${this.totpError
          ? html`<div class="error-message" role="alert">
              ${this.totpError}
            </div>`
          : ""}

        <div class="button-row">
          <button
            type="submit"
            class="btn btn-danger"
            ?disabled=${this.disableCode.length !== 6}
          >
            ${msg("Confirm disable")}
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            @click=${() => {
              this.totpState = "enabled";
              this.disableCode = "";
              this.totpError = "";
            }}
          >
            ${msg("Cancel")}
          </button>
        </div>
      </form>
    `;
  }

  render() {
    return html`
      <div class="card">
        <h2 class="card-title">${msg("Security")}</h2>
        <div class="security-section">
          <h3 class="section-subtitle">${msg("Two-factor authentication")}</h3>
          ${this.totpState === "idle" || this.totpState === "loading-qr"
            ? this.renderTotpIdle()
            : this.totpState === "qr-ready" || this.totpState === "confirming"
              ? this.renderTotpQrReady()
              : this.totpState === "enabled"
                ? this.renderTotpEnabled()
                : this.renderTotpDisabling()}
        </div>
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

    .security-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-subtitle {
      font-size: 1rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
      margin: 0;
    }

    .totp-description {
      font-size: 0.9375rem;
      color: var(--theme-color-text-secondary, #6b7280);
      margin: 0;
      line-height: 1.5;
    }

    .totp-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      padding: 0.625rem 0.875rem;
      border-radius: 6px;
    }

    .totp-status--enabled {
      background: color-mix(
        in srgb,
        var(--theme-color-success, #22c55e) 12%,
        transparent
      );
      color: var(--theme-color-success, #22c55e);
    }

    .status-icon {
      font-size: 1rem;
    }

    .qr-container {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }

    .qr-image {
      width: 180px;
      height: 180px;
      border-radius: 6px;
      border: 1px solid var(--theme-color-border, #e5e7eb);
    }

    .manual-key {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: var(--theme-color-background, #f9fafb);
      border-radius: 6px;
    }

    .manual-key-label {
      font-size: 0.8125rem;
      color: var(--theme-color-text-secondary, #6b7280);
    }

    .manual-key-value {
      font-family: monospace;
      font-size: 0.9375rem;
      color: var(--theme-color-text-primary, #111827);
      word-break: break-all;
      letter-spacing: 0.05em;
    }

    .totp-form {
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

    .form-field input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--theme-color-text-primary, #111827);
      background: var(--theme-color-surface, #ffffff);
      border: 1px solid var(--theme-color-border, #e5e7eb);
      border-radius: 6px;
      box-sizing: border-box;
    }

    .form-field input:focus {
      outline: none;
      border-color: var(--theme-color-primary, #6366f1);
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--theme-color-primary, #6366f1) 15%, transparent);
    }

    .form-field input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--theme-color-error, #ef4444);
      background: var(--theme-color-surface, #ffffff);
      border: 1px solid var(--theme-color-error, #ef4444);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
    }

    .button-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease;
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

    .btn-secondary {
      background: var(--theme-color-surface, #ffffff);
      color: var(--theme-color-text-primary, #111827);
      border: 1px solid var(--theme-color-border, #e5e7eb);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--theme-color-background, #f9fafb);
    }

    .btn-danger {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-danger-outline {
      background: transparent;
      color: var(--theme-color-error, #ef4444);
      border: 1px solid var(--theme-color-error, #ef4444);
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: color-mix(
        in srgb,
        var(--theme-color-error, #ef4444) 8%,
        transparent
      );
    }

    .btn-ghost {
      background: transparent;
      color: var(--theme-color-text-secondary, #6b7280);
    }

    .btn-ghost:hover:not(:disabled) {
      color: var(--theme-color-text-primary, #111827);
      background: var(--theme-color-background, #f9fafb);
    }

    @media (max-width: 640px) {
      .card {
        padding: 1.5rem;
      }
      .button-row {
        flex-direction: column;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-profile-totp": WcAuthProfileTotp;
  }
}
