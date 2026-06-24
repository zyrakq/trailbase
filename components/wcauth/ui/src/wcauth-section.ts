import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import { fetchOAuthProviders, type OAuthProvider } from "./api/auth-client.ts";

// Internal view registrations (side-effect imports).
import "./views/choice-view.ts";
import "./views/password-view.ts";
import "./views/register-view.ts";
import "./views/register-success-view.ts";
import "./views/mfa-view.ts";
import "./views/forgot-password-view.ts";
import "./views/forgot-password-sent-view.ts";
import "./views/reset-password-view.ts";
import "./views/reset-password-done-view.ts";
import "./views/verify-email-view.ts";

type ViewState =
  | "choice"
  | "password"
  | "register"
  | "register-success"
  | "mfa"
  | "forgot-password"
  | "forgot-password-sent"
  | "reset-password"
  | "reset-password-done"
  | "verify-email";

/**
 * `<wcauth>` — drop-in auth UI web component.
 *
 * The host is responsible for placement (modal overlay, page section, etc.)
 * and for supplying all configuration via attributes/properties. This component
 * owns only the auth flow state machine.
 *
 * Events re-dispatched to the host (bubbles, composed):
 * - wcauth-success — user successfully authenticated
 * - wcauth-close   — user wants to dismiss (before OAuth redirect or explicit close)
 *
 * Attributes:
 * - `mode`            — `"auth"` (default) | `"reset-password"` (requires `token`) | `"verify-email"`
 * - `token`           — password-reset JWT; used only when `mode="reset-password"`
 * - `no-password-auth` — boolean; disables password login/registration UI
 * - `no-registration`  — boolean; hides the "Create account" path
 * - `oauth-providers`  — JSON string: `[{"name":"oidc0","displayName":"SSO"}, ...]`
 *                        Can also be set as a JS property: `el.oauthProviders = [...]`
 * - `verify-email-redirect-url` — host-app path users land on after verifying their email
 *                                (forwarded to TrailBase as `redirect_uri` on register/resend)
 */
@customElement("wcauth-section")
@localized()
export class WcAuthSection extends LitElement {
  @property({ type: String }) mode: "auth" | "reset-password" | "verify-email" =
    "auth";
  @property({ type: String }) token = "";

  @property({ type: Boolean, attribute: "no-password-auth" }) noPasswordAuth =
    false;
  @property({ type: Boolean, attribute: "no-registration" }) noRegistration =
    false;

  @property({ attribute: "verify-email-redirect-url" })
  verifyEmailRedirectUrl?: string;

  @state() private view: ViewState = "choice";
  @state() private oauthProviders: OAuthProvider[] = [];

  @state() private sharedEmail = "";
  @state() private mfaToken = "";
  @state() private registerSuccessEmailSent = false;

  connectedCallback() {
    super.connectedCallback();
    this.view = this.initialView();
    if (this.mode === "auth") this.loadProviders();
  }

  // Exposed method so the host can reset state when re-opening.
  reset() {
    this.view = this.initialView();
    this.sharedEmail = "";
    this.mfaToken = "";
    this.registerSuccessEmailSent = false;
  }

  private initialView(): ViewState {
    if (this.mode === "reset-password") return "reset-password";
    if (this.mode === "verify-email") return "verify-email";
    return "choice";
  }

  private loadProviders() {
    fetchOAuthProviders()
      .then((providers) => {
        this.oauthProviders = providers;
      })
      .catch(() => {
        // No OAuth providers — password-only mode.
      });
  }

  private handleNavigate(e: CustomEvent) {
    e.stopPropagation();
    const { view, email, mfaToken, emailSent } = (e.detail ?? {}) as {
      view: ViewState;
      email?: string;
      mfaToken?: string;
      emailSent?: boolean;
    };

    if (email !== undefined) this.sharedEmail = email;
    if (mfaToken !== undefined) this.mfaToken = mfaToken;
    if (emailSent !== undefined) this.registerSuccessEmailSent = emailSent;

    this.view = view;
  }

  // wcauth-success and wcauth-close bubble through shadow DOM to the host.
  // We stop them here only to prevent duplicate handling, then re-dispatch from this element.
  private handleSuccess(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("wcauth-success", { bubbles: true, composed: true }),
    );
  }

  private handleClose(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("wcauth-close", { bubbles: true, composed: true }),
    );
  }

  private get viewTitle(): string {
    if (this.view === "register" || this.view === "register-success")
      return msg("Create account");
    if (this.view === "mfa") return msg("Two-factor authentication");
    if (
      this.view === "forgot-password" ||
      this.view === "forgot-password-sent" ||
      this.view === "reset-password" ||
      this.view === "reset-password-done"
    )
      return msg("Reset password");
    if (this.view === "verify-email") return msg("Email verified");
    return msg("Sign in");
  }

  private renderView() {
    switch (this.view) {
      case "choice":
        return html`<wcauth-choice
          .passwordAuthEnabled=${!this.noPasswordAuth}
          .registrationEnabled=${!this.noRegistration}
          .oauthProviders=${this.oauthProviders}
        ></wcauth-choice>`;

      case "password":
        return html`<wcauth-password
          .initialEmail=${this.sharedEmail}
        ></wcauth-password>`;

      case "register":
        return html`<wcauth-register
          .verifyEmailRedirectUrl=${this.verifyEmailRedirectUrl}
        ></wcauth-register>`;

      case "register-success":
        return html`<wcauth-register-success
          .email=${this.sharedEmail}
          .emailSent=${this.registerSuccessEmailSent}
          .verifyEmailRedirectUrl=${this.verifyEmailRedirectUrl}
        ></wcauth-register-success>`;

      case "mfa":
        return html`<wcauth-mfa .mfaToken=${this.mfaToken}></wcauth-mfa>`;

      case "forgot-password":
        return html`<wcauth-forgot-password
          .initialEmail=${this.sharedEmail}
        ></wcauth-forgot-password>`;

      case "forgot-password-sent":
        return html`<wcauth-forgot-password-sent></wcauth-forgot-password-sent>`;

      case "reset-password":
        return html`<wcauth-reset-password
          .token=${this.token}
        ></wcauth-reset-password>`;

      case "reset-password-done":
        return html`<wcauth-reset-password-done></wcauth-reset-password-done>`;

      case "verify-email":
        return html`<wcauth-verify-email></wcauth-verify-email>`;
    }
  }

  render() {
    return html`
      <div
        class="wcauth-root"
        @wcauth-navigate=${this.handleNavigate}
        @wcauth-success=${this.handleSuccess}
        @wcauth-close=${this.handleClose}
      >
        <div class="wcauth-header">
          <span class="wcauth-title">${this.viewTitle}</span>
        </div>
        <div class="wcauth-content">${this.renderView()}</div>
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

    .wcauth-root {
      background: var(--theme-color-surface-elevated, #ffffff);
      border-radius: 12px;
      padding: 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    .wcauth-header {
      margin-bottom: 1.5rem;
    }

    .wcauth-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
    }

    .wcauth-content {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-section": WcAuthSection;
  }
}
