import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from './i18n/localized';
import { fetchOAuthProviders, type OAuthProvider } from './api/auth-client.ts';

// Internal view registrations (side-effect imports).
import './views/choice-view.ts';
import './views/password-view.ts';
import './views/register-view.ts';
import './views/register-success-view.ts';
import './views/mfa-view.ts';
import './views/forgot-password-view.ts';
import './views/forgot-password-sent-view.ts';
import './views/reset-password-view.ts';
import './views/reset-password-done-view.ts';
import './views/verify-email-view.ts';

type ViewState =
  | 'choice'
  | 'password'
  | 'register'
  | 'register-success'
  | 'mfa'
  | 'forgot-password'
  | 'forgot-password-sent'
  | 'reset-password'
  | 'reset-password-done'
  | 'verify-email';

/**
 * `<trail-auth>` — drop-in auth UI web component.
 *
 * The host is responsible for placement (modal overlay, page section, etc.)
 * and for supplying all configuration via attributes/properties. This component
 * owns only the auth flow state machine.
 *
 * Events re-dispatched to the host (bubbles, composed):
 * - trail-auth-success — user successfully authenticated
 * - trail-auth-close   — user wants to dismiss (before OAuth redirect or explicit close)
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
@customElement('trail-auth')
@localized()
export class TrailAuth extends LitElement {
  @property({ type: String }) mode: 'auth' | 'reset-password' | 'verify-email' = 'auth';
  @property({ type: String }) token = '';

  @property({ type: Boolean, attribute: 'no-password-auth' }) noPasswordAuth = false;
  @property({ type: Boolean, attribute: 'no-registration' }) noRegistration = false;

  @property({ attribute: 'verify-email-redirect-url' }) verifyEmailRedirectUrl?: string;

  @state() private view: ViewState = 'choice';
  @state() private oauthProviders: OAuthProvider[] = [];

  @state() private sharedEmail = '';
  @state() private mfaToken = '';
  @state() private registerSuccessEmailSent = false;

  connectedCallback() {
    super.connectedCallback();
    this.view = this.initialView();
    if (this.mode === 'auth') this.loadProviders();
  }

  // Exposed method so the host can reset state when re-opening.
  reset() {
    this.view = this.initialView();
    this.sharedEmail = '';
    this.mfaToken = '';
    this.registerSuccessEmailSent = false;
  }

  private initialView(): ViewState {
    if (this.mode === 'reset-password') return 'reset-password';
    if (this.mode === 'verify-email') return 'verify-email';
    return 'choice';
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

  // trail-auth-success and trail-auth-close bubble through shadow DOM to the host.
  // We stop them here only to prevent duplicate handling, then re-dispatch from this element.
  private handleSuccess(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('trail-auth-success', { bubbles: true, composed: true }));
  }

  private handleClose(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('trail-auth-close', { bubbles: true, composed: true }));
  }

  private get viewTitle(): string {
    if (this.view === 'register' || this.view === 'register-success') return msg('Create account');
    if (this.view === 'mfa') return msg('Two-factor authentication');
    if (
      this.view === 'forgot-password' ||
      this.view === 'forgot-password-sent' ||
      this.view === 'reset-password' ||
      this.view === 'reset-password-done'
    )
      return msg('Reset password');
    if (this.view === 'verify-email') return msg('Email verified');
    return msg('Sign in');
  }

  private renderView() {
    switch (this.view) {
      case 'choice':
        return html`<trail-auth-choice
          .passwordAuthEnabled=${!this.noPasswordAuth}
          .registrationEnabled=${!this.noRegistration}
          .oauthProviders=${this.oauthProviders}
        ></trail-auth-choice>`;

      case 'password':
        return html`<trail-auth-password
          .initialEmail=${this.sharedEmail}
        ></trail-auth-password>`;

      case 'register':
        return html`<trail-auth-register
          .verifyEmailRedirectUrl=${this.verifyEmailRedirectUrl}
        ></trail-auth-register>`;

      case 'register-success':
        return html`<trail-auth-register-success
          .email=${this.sharedEmail}
          .emailSent=${this.registerSuccessEmailSent}
          .verifyEmailRedirectUrl=${this.verifyEmailRedirectUrl}
        ></trail-auth-register-success>`;

      case 'mfa':
        return html`<trail-auth-mfa .mfaToken=${this.mfaToken}></trail-auth-mfa>`;

      case 'forgot-password':
        return html`<trail-auth-forgot-password
          .initialEmail=${this.sharedEmail}
        ></trail-auth-forgot-password>`;

      case 'forgot-password-sent':
        return html`<trail-auth-forgot-password-sent></trail-auth-forgot-password-sent>`;

      case 'reset-password':
        return html`<trail-auth-reset-password
          .token=${this.token}
        ></trail-auth-reset-password>`;

      case 'reset-password-done':
        return html`<trail-auth-reset-password-done></trail-auth-reset-password-done>`;

      case 'verify-email':
        return html`<trail-auth-verify-email></trail-auth-verify-email>`;
    }
  }

  render() {
    return html`
      <div
        class="trail-auth-root"
        @trail-auth-navigate=${this.handleNavigate}
        @trail-auth-success=${this.handleSuccess}
        @trail-auth-close=${this.handleClose}
      >
        <div class="trail-auth-header">
          <span class="trail-auth-title">${this.viewTitle}</span>
        </div>
        <div class="trail-auth-content">${this.renderView()}</div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      font-size: 1rem;
      color: var(--theme-color-text-primary, #111827);
    }

    .trail-auth-root {
      background: var(--theme-color-surface-elevated, #ffffff);
      border-radius: 12px;
      padding: 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    .trail-auth-header {
      margin-bottom: 1.5rem;
    }

    .trail-auth-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
    }

    .trail-auth-content {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'trail-auth': TrailAuth;
  }
}
