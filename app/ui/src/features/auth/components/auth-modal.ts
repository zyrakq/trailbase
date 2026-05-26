import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../services/auth.service';
import { AuthError, AuthErrorCode } from '../types/auth-error';
import { OIDC_PROVIDERS, type OIDCProvider } from '../config/auth-providers';

type ViewState = 'choice' | 'password' | 'loading' | 'register' | 'register-loading' | 'register-success';

@customElement('auth-modal')
@localized()
export class AuthModal extends LitElement {
  @state() private isOpen = false;
  @state() private view: ViewState = 'choice';
  @state() private errorMessage = '';
  @state() private email = '';
  @state() private password = '';
  @state() private confirmPassword = '';
  @state() private showPassword = false;
  @state() private showConfirmPassword = false;
  @state() private registrationEmailSent = false;
  @state() private resendState: 'idle' | 'loading' | 'sent' | 'rate-limited' | 'smtp-error' = 'idle';

  open() {
    this.view = 'choice';
    this.errorMessage = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.registrationEmailSent = false;
    this.resendState = 'idle';

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

  private handleOIDC(provider: OIDCProvider) {
    this.close();
    authService.signIn(provider.key, '/auth/callback').catch(() => {
      window.dispatchEvent(
        new CustomEvent('notification-add', {
          detail: {
            id: `oidc-error-${Date.now()}`,
            message: msg(str`Failed to start ${provider.label} sign in. Please try again.`),
            type: 'error' as const,
          },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  private handlePasswordChoice() {
    this.view = 'password';
    this.errorMessage = '';
  }

  private handleRegisterChoice() {
    this.view = 'register';
    this.errorMessage = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  private handleBack() {
    this.view = 'choice';
    this.errorMessage = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.registrationEmailSent = false;
    this.resendState = 'idle';
  }

  private handleSignInInstead() {
    // Keep email pre-filled — user just typed it in the register form
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.errorMessage = '';
    this.resendState = 'idle';
    this.view = 'password';
  }

  private async handleResend() {
    if (this.resendState === 'loading' || this.resendState === 'sent') return;
    this.resendState = 'loading';
    try {
      await authService.resendVerificationEmail(this.email.trim());
      this.resendState = 'sent';
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === AuthErrorCode.RATE_LIMITED) {
          this.resendState = 'rate-limited';
        } else if (error.code === AuthErrorCode.EMAIL_NOT_SENT) {
          this.resendState = 'smtp-error';
        } else {
          this.resendState = 'idle';
        }
      } else {
        this.resendState = 'idle';
      }
    }
  }

  private togglePasswordVisibility(e: Event) {
    e.preventDefault();
    this.showPassword = !this.showPassword;
  }

  private toggleConfirmPasswordVisibility(e: Event) {
    e.preventDefault();
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private async handlePasswordSubmit(e: Event) {
    e.preventDefault();
    if (this.view === 'loading') return;

    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password;

    if (!trimmedEmail || !trimmedPassword) {
      this.errorMessage = msg('Please enter your email and password.');
      return;
    }

    this.view = 'loading';
    this.errorMessage = '';

    try {
      await authService.loginWithPassword(trimmedEmail, trimmedPassword);
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
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.code) {
          case AuthErrorCode.INVALID_CREDENTIALS:
            this.errorMessage = msg('Invalid email or password. Please try again.');
            break;
          case AuthErrorCode.MFA_REQUIRED:
            this.errorMessage = msg(
              'Multi-factor authentication is required. Please sign in using Kanidm or contact your administrator.'
            );
            break;
          case AuthErrorCode.NETWORK_ERROR:
            this.errorMessage = msg(
              'Unable to connect. Please check your internet connection and try again.'
            );
            break;
          default:
            this.errorMessage = msg('Sign in failed. Please try again.');
        }
      } else {
        this.errorMessage = msg('Sign in failed. Please try again.');
      }
      this.view = 'password';
    }
  }

  private async handleRegisterSubmit(e: Event) {
    e.preventDefault();
    if (this.view === 'register-loading') return;

    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password;
    const trimmedConfirm = this.confirmPassword;

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      this.errorMessage = msg('Please fill in all fields.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      this.errorMessage = msg('Passwords do not match.');
      return;
    }

    this.view = 'register-loading';
    this.errorMessage = '';

    try {
      const result = await authService.registerWithPassword(trimmedEmail, trimmedPassword);

      if (result.requiresVerification) {
        this.registrationEmailSent = result.emailSent;
        this.view = 'register-success';
      } else {
        this.close();
        window.dispatchEvent(
          new CustomEvent('notification-add', {
            detail: {
              id: `register-success-${Date.now()}`,
              message: msg('Account created and signed in successfully.'),
              type: 'success' as const,
              duration: 4000,
            },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.code) {
          case AuthErrorCode.EMAIL_TAKEN:
            this.errorMessage = msg('This email is already registered. Please sign in instead.');
            break;
          case AuthErrorCode.WEAK_PASSWORD:
            this.errorMessage = msg('Password does not meet requirements. Please choose a stronger password.');
            break;
          case AuthErrorCode.REGISTRATION_DISABLED:
            this.errorMessage = msg('Registration is currently disabled. Please contact an administrator.');
            break;
          case AuthErrorCode.NETWORK_ERROR:
            this.errorMessage = msg(
              'Unable to connect. Please check your internet connection and try again.'
            );
            break;
          default:
            this.errorMessage = msg('Registration failed. Please try again.');
        }
      } else {
        this.errorMessage = msg('Registration failed. Please try again.');
      }
      this.view = 'register';
    }
  }

  private handleEmailInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.email = target.value;
    if (this.errorMessage) this.errorMessage = '';
  }

  private handlePasswordInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.password = target.value;
    if (this.errorMessage) this.errorMessage = '';
  }

  private handleConfirmPasswordInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.confirmPassword = target.value;
    if (this.errorMessage) this.errorMessage = '';
  }

  private get modalTitle(): string {
    if (
      this.view === 'register' ||
      this.view === 'register-loading' ||
      this.view === 'register-success'
    ) {
      return msg('Create account');
    }
    return msg('Sign in');
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-overlay" @click=${this.handleOverlayClick}>
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
            ${this.view === 'choice'
              ? this.renderChoiceView()
              : this.view === 'register' || this.view === 'register-loading'
                ? this.renderRegisterView()
                : this.view === 'register-success'
                  ? this.renderRegisterSuccessView()
                  : this.renderPasswordView()}
          </div>
        </div>
      </div>
    `;
  }

  private renderChoiceView() {
    return html`
      <div class="choice-view">
        ${OIDC_PROVIDERS.map(
          (p) => html`
            <button class="btn btn-primary" @click=${() => this.handleOIDC(p)}>
              ${msg(str`Continue with ${p.label}`)}
            </button>
          `
        )}

        <button class="btn btn-primary" @click=${this.handlePasswordChoice}>
          ${msg('Sign in with email and password')}
        </button>

        <div class="divider"></div>

        <button class="btn btn-secondary" @click=${this.handleRegisterChoice}>
          ${msg('Create an account')}
        </button>
      </div>
    `;
  }

  private renderPasswordView() {
    const isLoading = this.view === 'loading';

    return html`
      <form class="password-form" @submit=${this.handlePasswordSubmit}>
        <div class="form-field">
          <label for="auth-email">${msg('Email address')}</label>
          <input
            id="auth-email"
            type="email"
            autocomplete="email"
            .value=${this.email}
            @input=${this.handleEmailInput}
            ?disabled=${isLoading}
            required
          />
        </div>

        <div class="form-field password-field">
          <label for="auth-password">${msg('Password')}</label>
          <div class="password-input-wrapper">
            <input
              id="auth-password"
              type=${this.showPassword ? 'text' : 'password'}
              autocomplete="current-password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${isLoading}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${this.togglePasswordVisibility}
              aria-label=${this.showPassword ? msg('Hide password') : msg('Show password')}
              ?disabled=${isLoading}
            >
              ${this.showPassword ? this.eyeSlashIcon() : this.eyeIcon()}
            </button>
          </div>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button type="submit" class="btn btn-primary" ?disabled=${isLoading}>
          ${isLoading ? msg('Signing in...') : msg('Sign in')}
        </button>
      </form>

      <button class="back-link" @click=${this.handleBack} ?disabled=${isLoading}>
        ${msg('Back to sign in options')}
      </button>
    `;
  }

  private renderRegisterView() {
    const isLoading = this.view === 'register-loading';

    return html`
      <form class="password-form" @submit=${this.handleRegisterSubmit}>
        <div class="form-field">
          <label for="reg-email">${msg('Email address')}</label>
          <input
            id="reg-email"
            type="email"
            autocomplete="email"
            .value=${this.email}
            @input=${this.handleEmailInput}
            ?disabled=${isLoading}
            required
          />
        </div>

        <div class="form-field password-field">
          <label for="reg-password">${msg('Password')}</label>
          <div class="password-input-wrapper">
            <input
              id="reg-password"
              type=${this.showPassword ? 'text' : 'password'}
              autocomplete="new-password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${isLoading}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${this.togglePasswordVisibility}
              aria-label=${this.showPassword ? msg('Hide password') : msg('Show password')}
              ?disabled=${isLoading}
            >
              ${this.showPassword ? this.eyeSlashIcon() : this.eyeIcon()}
            </button>
          </div>
        </div>

        <div class="form-field password-field">
          <label for="reg-confirm-password">${msg('Confirm password')}</label>
          <div class="password-input-wrapper">
            <input
              id="reg-confirm-password"
              type=${this.showConfirmPassword ? 'text' : 'password'}
              autocomplete="new-password"
              .value=${this.confirmPassword}
              @input=${this.handleConfirmPasswordInput}
              ?disabled=${isLoading}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${this.toggleConfirmPasswordVisibility}
              aria-label=${this.showConfirmPassword ? msg('Hide password') : msg('Show password')}
              ?disabled=${isLoading}
            >
              ${this.showConfirmPassword ? this.eyeSlashIcon() : this.eyeIcon()}
            </button>
          </div>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button type="submit" class="btn btn-primary" ?disabled=${isLoading}>
          ${isLoading ? msg('Creating account...') : msg('Create account')}
        </button>
      </form>

      <button class="back-link" @click=${this.handleBack} ?disabled=${isLoading}>
        ${msg('Back to sign in options')}
      </button>
    `;
  }

  private renderRegisterSuccessView() {
    return html`
      <div class="success-view">
        <div class="success-icon" aria-hidden="true">✓</div>
        ${this.registrationEmailSent
          ? html`
              <p class="success-title">${msg('Check your inbox')}</p>
              <p class="success-message">
                ${msg(
                  "If this email isn't registered yet, a verification link has been sent. Please check your inbox and click the link to complete sign in."
                )}
              </p>

              ${this.resendState === 'sent'
                ? html`<p class="resend-confirmation">${msg('Verification email resent.')}</p>`
                : this.resendState === 'rate-limited'
                  ? html`<p class="resend-rate-limited">
                      ${msg('You can request a new link in a few hours.')}
                    </p>`
                  : this.resendState === 'smtp-error'
                    ? html`<p class="resend-smtp-error">
                        ${msg('Could not send the email. Please contact support.')}
                      </p>`
                    : ''}

              <button
                class="btn btn-secondary"
                @click=${this.handleResend}
                ?disabled=${this.resendState === 'loading' || this.resendState === 'sent' || this.resendState === 'rate-limited' || this.resendState === 'smtp-error'}
              >
                ${this.resendState === 'loading'
                  ? msg('Sending...')
                  : msg('Resend verification email')}
              </button>

              <button class="btn btn-primary" @click=${this.handleSignInInstead}>
                ${msg('Sign in instead')}
              </button>
            `
          : html`
              <p class="success-title">${msg('Account created')}</p>
              <p class="success-message">
                ${msg('Your account has been created, but we could not send a verification email.')}
              </p>
              <p class="success-message">
                ${msg('Please contact support to verify your account and complete sign in.')}
              </p>
              <button class="btn btn-primary" @click=${this.close.bind(this)}>
                ${msg('Close')}
              </button>
            `}
      </div>
    `;
  }

  private eyeIcon() {
    return html`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    `;
  }

  private eyeSlashIcon() {
    return html`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
      pointer-events: auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: var(--theme-color-surface-elevated);
      border-radius: 8px;
      box-shadow: var(--theme-shadow-lg);
      max-width: 420px;
      width: 100%;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease-out;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--theme-color-border);
      transition: border-color 0.2s ease;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      transition: color 0.2s ease;
    }

    .modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--theme-color-text-secondary);
      font-size: 20px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .modal-close:hover {
      background: var(--theme-color-background);
      color: var(--theme-color-text-primary);
    }

    .modal-close:focus {
      outline: 2px solid var(--theme-color-primary);
      outline-offset: 2px;
    }

    .modal-content {
      padding: 1.25rem;
      overflow-y: auto;
    }

    .choice-view {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .divider {
      height: 1px;
      background: var(--theme-color-border);
      margin: 0.25rem 0;
      transition: background-color 0.2s ease;
    }

    .password-form {
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
      color: var(--theme-color-text-primary);
      transition: color 0.2s ease;
    }

    .form-field input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--theme-color-text-primary);
      background: var(--theme-color-surface);
      border: 1px solid var(--theme-color-border);
      border-radius: 6px;
      box-sizing: border-box;
      margin: 0;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-field input:focus {
      outline: none;
      border-color: var(--theme-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
    }

    .form-field input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .password-field .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-field input {
      padding-right: 2.5rem;
      box-sizing: border-box;
    }

    .password-toggle {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--theme-color-text-secondary);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
    }

    .password-toggle:hover:not(:disabled) {
      color: var(--theme-color-text-primary);
    }

    .password-toggle:focus {
      outline: 2px solid var(--theme-color-primary);
      outline-offset: 1px;
    }

    .password-toggle:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--theme-color-error);
      background: var(--theme-color-surface);
      border: 1px solid var(--theme-color-error);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
      transition: all 0.2s ease;
    }

    .back-link {
      display: block;
      width: 100%;
      margin-top: 1rem;
      padding: 0.5rem;
      font-size: 0.875rem;
      color: var(--theme-color-text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: center;
      transition: color 0.2s ease;
    }

    .back-link:hover:not(:disabled) {
      color: var(--theme-color-text-primary);
      text-decoration: underline;
    }

    .back-link:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      text-align: center;
    }

    .success-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--theme-color-success);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .success-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0;
    }

    .success-message {
      font-size: 0.875rem;
      color: var(--theme-color-text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .resend-confirmation {
      font-size: 0.875rem;
      color: var(--theme-color-success);
      margin: 0;
    }

    .resend-rate-limited {
      font-size: 0.875rem;
      color: var(--theme-color-text-muted);
      margin: 0;
    }

    .resend-smtp-error {
      font-size: 0.875rem;
      color: var(--theme-color-error);
      margin: 0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-family: inherit;
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--theme-color-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--theme-color-primary-hover);
    }

    .btn-primary:active:not(:disabled) {
      background: var(--theme-color-primary-active);
    }

    .btn-secondary {
      background: var(--theme-color-surface);
      color: var(--theme-color-text-primary);
      border: 1px solid var(--theme-color-border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--theme-color-background);
    }

    @media (max-width: 640px) {
      .modal-card { max-width: 100%; }
      .modal-header { padding: 0.875rem 1rem; }
      .modal-content { padding: 1rem; }
      .modal-title { font-size: 1rem; }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-modal': AuthModal;
  }
}
