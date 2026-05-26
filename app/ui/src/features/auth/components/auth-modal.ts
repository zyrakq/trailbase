import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../services/auth.service';
import { configService } from '../services/config.service';
import { AuthError, AuthErrorCode } from '../types/auth-error';
import { OIDC_PROVIDERS, type OIDCProvider } from '../config/auth-providers';
import { authModalStyles } from './auth-modal.styles';
import { eyeIcon, eyeSlashIcon } from './auth-icons';

type ViewState = 'choice' | 'password' | 'loading' | 'register' | 'register-loading' | 'register-success' | 'mfa' | 'mfa-loading' | 'forgot-password' | 'forgot-password-loading' | 'forgot-password-sent';

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
  @state() private mfaToken = '';
  @state() private mfaCode = '';
  @state() private registrationEnabled = true;

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
    this.mfaToken = '';
    this.mfaCode = '';

    configService.fetchConfig().then((config) => {
      this.registrationEnabled = config.registrationEnabled;
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
    if (this.view === 'forgot-password' || this.view === 'forgot-password-loading') {
      this.view = 'password';
      this.errorMessage = '';
      // email is intentionally preserved so the user does not have to retype it
      return;
    }
    if (this.view === 'mfa' || this.view === 'mfa-loading') {
      this.view = 'password';
      this.errorMessage = '';
      this.mfaCode = '';
      return;
    }
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

  private handleForgotPasswordChoice() {
    this.view = 'forgot-password';
    this.errorMessage = '';
    // email is intentionally preserved from the password view
  }

  private handleBackToChoice() {
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

  private async handleForgotPasswordSubmit(e: Event) {
    e.preventDefault();
    if (this.view === 'forgot-password-loading') return;

    const trimmedEmail = this.email.trim();
    if (!trimmedEmail) {
      this.errorMessage = msg('Please enter your email address.');
      return;
    }

    this.view = 'forgot-password-loading';
    this.errorMessage = '';

    try {
      await authService.requestPasswordReset(trimmedEmail);
      this.view = 'forgot-password-sent';
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.code) {
          case AuthErrorCode.RATE_LIMITED:
            this.errorMessage = msg(
              'A reset link was already sent. Check your inbox or wait 1 hour before trying again.'
            );
            break;
          case AuthErrorCode.EMAIL_NOT_SENT:
            this.errorMessage = msg('Could not send the email. Please contact support.');
            break;
          case AuthErrorCode.NETWORK_ERROR:
            this.errorMessage = msg('Network error. Please check your connection.');
            break;
          default:
            this.errorMessage = error.message || msg('An error occurred. Please try again.');
        }
      } else {
        this.errorMessage = msg('An error occurred. Please try again.');
      }
      this.view = 'forgot-password';
    }
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
      const result = await authService.loginWithPassword(trimmedEmail, trimmedPassword);

      if (result && result.requiresMfa) {
        // Switch to MFA view — do NOT close the modal
        this.mfaToken = result.mfaToken;
        this.mfaCode = '';
        this.view = 'mfa';
        return;
      }

      // Direct login success
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

  private handleMfaCodeInput(e: Event) {
    const target = e.target as HTMLInputElement;
    // Allow only digits, max 6 characters
    this.mfaCode = target.value.replace(/\D/g, '').slice(0, 6);
    if (this.errorMessage) this.errorMessage = '';
  }

  private async handleMfaSubmit(e: Event) {
    e.preventDefault();
    if (this.view === 'mfa-loading') return;

    const code = this.mfaCode.trim();
    if (code.length !== 6) {
      this.errorMessage = msg('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    this.view = 'mfa-loading';
    this.errorMessage = '';

    try {
      await authService.loginWithMfa(this.mfaToken, code);
      this.close();
      window.dispatchEvent(
        new CustomEvent('notification-add', {
          detail: {
            id: `auth-mfa-success-${Date.now()}`,
            message: msg('Successfully signed in.'),
            type: 'success' as const,
            duration: 4000,
          },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.errorMessage = msg('Invalid code. Please try again.');
      } else if (error instanceof AuthError && error.code === AuthErrorCode.NETWORK_ERROR) {
        this.errorMessage = msg('Unable to connect. Please check your internet connection and try again.');
      } else {
        this.errorMessage = msg('Verification failed. Please try again.');
      }
      this.view = 'mfa';
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
    if (this.view === 'mfa' || this.view === 'mfa-loading') {
      return msg('Two-factor authentication');
    }
    if (
      this.view === 'forgot-password' ||
      this.view === 'forgot-password-loading' ||
      this.view === 'forgot-password-sent'
    ) {
      return msg('Reset password');
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
                  : this.view === 'forgot-password' || this.view === 'forgot-password-loading'
                    ? this.renderForgotPasswordView()
                    : this.view === 'forgot-password-sent'
                      ? this.renderForgotPasswordSentView()
                      : this.view === 'mfa' || this.view === 'mfa-loading'
                        ? this.renderMfaView()
                        : this.renderPasswordView()}
          </div>
        </div>
      </div>
    `;
  }

  private renderMfaView() {
    const isLoading = this.view === 'mfa-loading';

    return html`
      <form class="password-form" @submit=${this.handleMfaSubmit}>
        <p class="mfa-subtitle">
          ${msg('Enter the 6-digit code from your authenticator app.')}
        </p>

        <div class="form-field">
          <label for="mfa-code">${msg('Verification code')}</label>
          <input
            id="mfa-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            .value=${this.mfaCode}
            @input=${this.handleMfaCodeInput}
            ?disabled=${isLoading}
            required
          />
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button type="submit" class="btn btn-primary" ?disabled=${isLoading || this.mfaCode.length !== 6}>
          ${isLoading ? msg('Verifying...') : msg('Verify')}
        </button>
      </form>

      <button
        class="back-link"
        @click=${this.handleBack}
        ?disabled=${isLoading}
      >
        ${msg('Back to sign in')}
      </button>
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

        ${this.registrationEnabled
          ? html`
            <div class="divider"></div>
            <button class="btn btn-secondary" @click=${this.handleRegisterChoice}>
              ${msg('Create an account')}
            </button>
          `
          : ''}
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
              ${this.showPassword ? eyeSlashIcon() : eyeIcon()}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="forgot-password-link"
          @click=${this.handleForgotPasswordChoice}
          ?disabled=${isLoading}
        >
          ${msg('Forgot password?')}
        </button>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button type="submit" class="btn btn-primary" ?disabled=${isLoading}>
          ${isLoading ? msg('Signing in\u2026') : msg('Sign in')}
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
              ${this.showPassword ? eyeSlashIcon() : eyeIcon()}
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
              ${this.showConfirmPassword ? eyeSlashIcon() : eyeIcon()}
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

  private renderForgotPasswordView() {
    const isLoading = this.view === 'forgot-password-loading';

    return html`
      <form class="password-form" @submit=${this.handleForgotPasswordSubmit}>
        <p class="mfa-subtitle">
          ${msg("Enter your email address and we'll send you a reset link.")}
        </p>

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

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button type="submit" class="btn btn-primary" ?disabled=${isLoading}>
          ${isLoading ? msg('Sending\u2026') : msg('Send reset link')}
        </button>
      </form>

      <button
        class="back-link"
        @click=${this.handleBack}
        ?disabled=${isLoading}
      >
        ${msg('Back to sign in')}
      </button>
    `;
  }

  private renderForgotPasswordSentView() {
    return html`
      <div class="success-view">
        <p class="success-message">
          ${msg(
            "If this email address is registered, you'll receive a reset link shortly. Check your inbox."
          )}
        </p>
        <button class="btn btn-primary" @click=${this.handleBackToChoice}>
          ${msg('Back to sign in')}
        </button>
      </div>
    `;
  }

  static styles = authModalStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-modal': AuthModal;
  }
}
