import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../../services/auth.service';
import { AuthError, AuthErrorCode } from '../../types/auth-error';
import { authSharedStyles } from '../auth-shared.styles';
import { eyeIcon, eyeSlashIcon } from '../auth-icons';

/**
 * Registration view — email + password + confirm form.
 *
 * Events dispatched:
 * - auth-success: () → parent closes modal + shows toast
 * - auth-navigate: { view: 'register-success', email: string, emailSent: boolean }
 * - auth-navigate: { view: 'choice' }
 */
@customElement('auth-register-view')
@localized()
export class AuthRegisterView extends LitElement {
  @state() private email = '';
  @state() private password = '';
  @state() private confirmPassword = '';
  @state() private showPassword = false;
  @state() private showConfirmPassword = false;
  @state() private isLoading = false;
  @state() private errorMessage = '';

  private handleEmailInput(e: Event) {
    this.email = (e.target as HTMLInputElement).value;
    if (this.errorMessage) this.errorMessage = '';
  }

  private handlePasswordInput(e: Event) {
    this.password = (e.target as HTMLInputElement).value;
    if (this.errorMessage) this.errorMessage = '';
  }

  private handleConfirmPasswordInput(e: Event) {
    this.confirmPassword = (e.target as HTMLInputElement).value;
    if (this.errorMessage) this.errorMessage = '';
  }

  private togglePasswordVisibility(e: Event) {
    e.preventDefault();
    this.showPassword = !this.showPassword;
  }

  private toggleConfirmPasswordVisibility(e: Event) {
    e.preventDefault();
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private handleBack() {
    this.dispatchEvent(
      new CustomEvent('auth-navigate', {
        detail: { view: 'choice' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLoading) return;

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

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await authService.registerWithPassword(trimmedEmail, trimmedPassword);

      if (result.requiresVerification) {
        this.dispatchEvent(
          new CustomEvent('auth-navigate', {
            detail: {
              view: 'register-success',
              email: trimmedEmail,
              emailSent: result.emailSent,
            },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        this.dispatchEvent(new CustomEvent('auth-success', { bubbles: true, composed: true }));
      }
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.code) {
          case AuthErrorCode.EMAIL_TAKEN:
            this.errorMessage = msg('This email is already registered. Please sign in instead.');
            break;
          case AuthErrorCode.WEAK_PASSWORD:
            this.errorMessage = msg(
              'Password does not meet requirements. Please choose a stronger password.'
            );
            break;
          case AuthErrorCode.REGISTRATION_DISABLED:
            this.errorMessage = msg(
              'Registration is currently disabled. Please contact an administrator.'
            );
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
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <form class="password-form" @submit=${this.handleSubmit}>
        <div class="form-field">
          <label for="reg-email">${msg('Email address')}</label>
          <input
            id="reg-email"
            type="email"
            autocomplete="email"
            .value=${this.email}
            @input=${this.handleEmailInput}
            ?disabled=${this.isLoading}
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
              ?disabled=${this.isLoading}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${this.togglePasswordVisibility}
              aria-label=${this.showPassword ? msg('Hide password') : msg('Show password')}
              ?disabled=${this.isLoading}
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
              ?disabled=${this.isLoading}
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click=${this.toggleConfirmPasswordVisibility}
              aria-label=${this.showConfirmPassword ? msg('Hide password') : msg('Show password')}
              ?disabled=${this.isLoading}
            >
              ${this.showConfirmPassword ? eyeSlashIcon() : eyeIcon()}
            </button>
          </div>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}

        <button type="submit" class="btn btn-primary" ?disabled=${this.isLoading}>
          ${this.isLoading ? msg('Creating account...') : msg('Create account')}
        </button>
      </form>

      <button class="back-link" @click=${this.handleBack} ?disabled=${this.isLoading}>
        ${msg('Back to sign in options')}
      </button>
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      .password-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-register-view': AuthRegisterView;
  }
}
