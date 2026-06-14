import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { authSharedStyles } from "../styles.ts";
import type { OAuthProvider } from "../api/auth-client.ts";

/**
 * Choice view — OAuth provider buttons, email/password sign-in, optional registration.
 *
 * Events dispatched (bubbles, composed):
 * - trail-auth-navigate: { view: 'password' | 'register' }
 * - trail-auth-close: (before OAuth redirect so host can close modal cleanly)
 */
@customElement("trail-auth-choice")
export class TrailAuthChoiceView extends LitElement {
  @property({ type: Boolean }) passwordAuthEnabled = true;
  @property({ type: Boolean }) registrationEnabled = true;
  @property({ type: Array }) oauthProviders: OAuthProvider[] = [];

  private handleOAuthClick(provider: OAuthProvider, e: Event) {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("trail-auth-close", { bubbles: true, composed: true }),
    );
    window.location.href = `/api/auth/v1/oauth/${provider.name}/login?redirect_uri=/auth/callback`;
  }

  private navigate(view: "password" | "register") {
    this.dispatchEvent(
      new CustomEvent("trail-auth-navigate", {
        detail: { view },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="choice-view">
        ${this.oauthProviders.map(
          (p) => html`
            <a
              class="btn btn-outline oauth-btn"
              href="/api/auth/v1/oauth/${p.name}/login?redirect_uri=/auth/callback"
              @click=${(e: Event) => this.handleOAuthClick(p, e)}
            >
              <img
                class="oauth-icon"
                src="/_/auth/oauth2/${p.displayName}.svg"
                alt=${p.displayName}
              />
              <span>${p.displayName}</span>
            </a>
          `,
        )}
        ${this.oauthProviders.length > 0 && this.passwordAuthEnabled
          ? html`<div class="divider"></div>`
          : nothing}
        ${this.passwordAuthEnabled
          ? html`
              <button
                class="btn btn-primary"
                @click=${() => this.navigate("password")}
              >
                Sign in with email and password
              </button>
            `
          : nothing}
        ${this.passwordAuthEnabled && this.registrationEnabled
          ? html`
              <div class="divider"></div>
              <button
                class="btn btn-secondary"
                @click=${() => this.navigate("register")}
              >
                Create an account
              </button>
            `
          : nothing}
      </div>
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      .choice-view {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .divider {
        height: 1px;
        background: var(--theme-color-border, #e5e7eb);
        margin: 0.25rem 0;
        transition: background-color 0.2s ease;
      }

      .oauth-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        text-decoration: none;
        font-weight: 500;
      }

      .oauth-icon {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "trail-auth-choice": TrailAuthChoiceView;
  }
}
