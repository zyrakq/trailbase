import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import {
  fetchCurrentUser,
  fetchProfileCapabilities,
  type CurrentUser,
  type PasswordPolicy,
} from "./api/auth-client.ts";
import "./wcauth-profile-avatar.ts";
import "./wcauth-profile-email.ts";
import "./wcauth-profile-password.ts";
import "./wcauth-profile-totp.ts";
import "./wcauth-profile-account.ts";

/**
 * `<wcauth-profile>` — self-contained profile management web component.
 *
 * Fetches user data from /api/auth/v1/status (JWT claims) and profile capabilities
 * from /api/auth/v1/profile on connect. Delegates TOTP, avatar, email, and password
 * management to sub-components.
 *
 * Attributes (optional — provide initial values to avoid a loading flash):
 * - `email` — user email; if omitted, fetched from /api/auth/v1/status
 * - `has-mfa` — boolean; passed to TOTP sub-component for initial state
 *
 * Events dispatched to host (bubbles, composed):
 * - `wcauth-profile-sign-out` — user clicked Sign Out; host should handle session teardown
 */
@customElement("wcauth-profile")
@localized()
export class WcAuthProfile extends LitElement {
  @property({ type: String }) email = "";
  @property({ type: Boolean, attribute: "has-mfa" }) hasMfa = false;

  @state() private user: CurrentUser | null = null;
  @state() private showOtpSection = false;
  @state() private showChangePassword = false;
  @state() private canSetPassword = false;
  @state() private signOutLoading = false;
  @state() private loading = true;
  @state() private passwordPolicy: PasswordPolicy = {
    minLength: 8,
    maxLength: 128,
    mustContainUpperAndLowerCase: false,
    mustContainDigits: false,
    mustContainSpecialCharacters: false,
  };

  async connectedCallback() {
    super.connectedCallback();

    // Always fetch current user — needed for user id/email/mfa state even if
    // the host already provided email/hasMfa.
    try {
      const u = await fetchCurrentUser();
      if (u) {
        this.user = u;
      } else if (this.email) {
        this.user = {
          id: "",
          email: this.email,
          hasMfa: this.hasMfa,
          csrfToken: "",
        };
      }
    } catch {
      if (this.email) {
        this.user = {
          id: "",
          email: this.email,
          hasMfa: this.hasMfa,
          csrfToken: "",
        };
      }
    } finally {
      this.loading = false;
    }

    // Fetch TOTP section visibility regardless.
    fetchProfileCapabilities()
      .then((caps) => {
        this.showOtpSection = caps.showOtpSection;
        this.showChangePassword = caps.showChangePassword;
        this.canSetPassword = caps.canSetPassword;
        this.passwordPolicy = caps.passwordPolicy;
      })
      .catch(() => {
        // Default false — safe for OAuth-only users.
      });
  }

  private handleSignOut() {
    this.signOutLoading = true;
    this.dispatchEvent(
      new CustomEvent("wcauth-profile-sign-out", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderUserCard() {
    const userId = this.user?.id ?? "";

    return html`
      <div class="card">
        <h2 class="card-title">${msg("Profile")}</h2>
        <div class="user-info">
          <wcauth-profile-avatar .userId=${userId}></wcauth-profile-avatar>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-skeleton"></div>`;
    }

    const email = this.user?.email ?? "";

    return html`
      <div class="profile-root">
        ${this.renderUserCard()}
        <wcauth-profile-email .currentEmail=${email}></wcauth-profile-email>
        ${this.showChangePassword || this.canSetPassword
          ? html`<wcauth-profile-password
              .mode=${this.canSetPassword ? "set" : "change"}
              .passwordPolicy=${this.passwordPolicy}
            ></wcauth-profile-password>`
          : ""}
        ${this.showOtpSection
          ? html`<wcauth-profile-totp
              .hasMfa=${this.user?.hasMfa ?? false}
            ></wcauth-profile-totp>`
          : ""}
        <div class="actions">
          <button
            class="btn btn-danger"
            @click=${this.handleSignOut}
            ?disabled=${this.signOutLoading}
          >
            ${this.signOutLoading ? msg("Signing out...") : msg("Sign Out")}
          </button>
        </div>
        <wcauth-profile-account></wcauth-profile-account>
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

    .profile-root {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    .loading-skeleton {
      height: 120px;
      border-radius: 8px;
      background: color-mix(
        in srgb,
        var(--theme-color-text-primary, #111827) 8%,
        transparent
      );
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
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

    .user-info {
      display: flex;
      align-items: center;
    }

    .actions {
      display: flex;
      justify-content: center;
      padding-bottom: 0.5rem;
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

    .btn-danger {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      opacity: 0.9;
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
    "wcauth-profile": WcAuthProfile;
  }
}
