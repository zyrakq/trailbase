import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { configService, type OAuthProviderConfig } from '../services/config.service';
import { authModalStyles } from './auth-modal.styles';

// Sub-component side-effect imports — registers the custom elements.
import './views/auth-choice-view';
import './views/auth-password-view';
import './views/auth-register-view';
import './views/auth-register-success-view';
import './views/auth-mfa-view';
import './views/auth-forgot-password-view';
import './views/auth-forgot-password-sent-view';

type ViewState =
  | 'choice'
  | 'password'
  | 'register'
  | 'register-success'
  | 'mfa'
  | 'forgot-password'
  | 'forgot-password-sent';

@customElement('auth-modal')
@localized()
export class AuthModal extends LitElement {
  @state() private isOpen = false;
  @state() private view: ViewState = 'choice';

  // Shared state passed down to sub-components as properties.
  @state() private sharedEmail = '';
  @state() private mfaToken = '';
  @state() private passwordAuthEnabled = true;
  @state() private registrationEnabled = true;
  @state() private oauthProviders: OAuthProviderConfig[] = [];
  @state() private registerSuccessEmailSent = false;

  open() {
    this.view = 'choice';
    this.sharedEmail = '';
    this.mfaToken = '';
    this.registerSuccessEmailSent = false;

    configService.fetchConfig().then((config) => {
      this.passwordAuthEnabled = config.passwordAuthEnabled;
      this.registrationEnabled = config.registrationEnabled;
      this.oauthProviders = config.oauthProviders;
    });

    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('modal-opened', { bubbles: true, composed: true }));
  }

  close() {
    this.isOpen = false;
    document.body.style.overflow = '';
    window.dispatchEvent(new CustomEvent('modal-closed', { bubbles: true, composed: true }));
  }

  private handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  private handleClose(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.close();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isOpen) this.close();
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';
  }

  /**
   * Handles navigation events from sub-components.
   * Each sub-component fires auth-navigate with { view, email?, mfaToken?, emailSent? }.
   */
  private handleNavigate(e: CustomEvent) {
    const { view, email, mfaToken, emailSent } = e.detail ?? {};

    if (email !== undefined) this.sharedEmail = email;
    if (mfaToken !== undefined) this.mfaToken = mfaToken;
    if (emailSent !== undefined) this.registerSuccessEmailSent = emailSent;

    this.view = view;
  }

  /**
   * Handles auth-success from sub-components — closes modal and shows toast.
   */
  private handleAuthSuccess() {
    this.close();
    window.dispatchEvent(
      new CustomEvent('notification-add', {
        detail: {
          id: `auth-success-${Date.now()}`,
          message: msg('Successfully signed in.'),
          type: 'success' as const,
          duration: 4000,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private get modalTitle(): string {
    if (this.view === 'register' || this.view === 'register-success') {
      return msg('Create account');
    }
    if (this.view === 'mfa') {
      return msg('Two-factor authentication');
    }
    if (this.view === 'forgot-password' || this.view === 'forgot-password-sent') {
      return msg('Reset password');
    }
    return msg('Sign in');
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div
        class="modal-overlay"
        @click=${this.handleOverlayClick}
        @auth-navigate=${this.handleNavigate}
        @auth-success=${this.handleAuthSuccess}
        @auth-close=${this.handleClose}
      >
        <div class="modal-card">
          <div class="modal-header">
            <span class="modal-title">${this.modalTitle}</span>
            <button
              class="modal-close"
              @click=${(e: Event) => this.handleClose(e)}
              aria-label=${msg('Close dialog')}
            >
              ✕
            </button>
          </div>
          <div class="modal-content">
            ${this.renderCurrentView()}
          </div>
        </div>
      </div>
    `;
  }

  private renderCurrentView() {
    switch (this.view) {
      case 'choice':
        return html`<auth-choice-view
          .passwordAuthEnabled=${this.passwordAuthEnabled}
          .registrationEnabled=${this.registrationEnabled}
          .oauthProviders=${this.oauthProviders}
        ></auth-choice-view>`;

      case 'password':
        return html`<auth-password-view .initialEmail=${this.sharedEmail}></auth-password-view>`;

      case 'register':
        return html`<auth-register-view></auth-register-view>`;

      case 'register-success':
        return html`
          <auth-register-success-view
            .email=${this.sharedEmail}
            .emailSent=${this.registerSuccessEmailSent}
          ></auth-register-success-view>
        `;

      case 'mfa':
        return html`<auth-mfa-view .mfaToken=${this.mfaToken}></auth-mfa-view>`;

      case 'forgot-password':
        return html`<auth-forgot-password-view .initialEmail=${this.sharedEmail}></auth-forgot-password-view>`;

      case 'forgot-password-sent':
        return html`<auth-forgot-password-sent-view></auth-forgot-password-sent-view>`;
    }
  }

  static styles = authModalStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-modal': AuthModal;
  }
}
