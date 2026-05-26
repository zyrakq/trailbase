import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { AuthError } from '@/features/auth';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';

type PageState = 'form' | 'loading' | 'success' | 'invalid-token' | 'error';

@customElement('reset-password-page')
@localized()
export class ResetPasswordPage extends LitElement {
  private token = '';
  private pageState: PageState = 'form';
  private errorMessage = '';
  private password = '';
  private confirmPassword = '';
  private showPassword = false;
  private showConfirmPassword = false;

  connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    this.token = token;
  }

  private handlePasswordInput(e: Event) {
    this.password = (e.target as HTMLInputElement).value;
    if (this.errorMessage) {
      this.errorMessage = '';
      this.requestUpdate();
    }
  }

  private handleConfirmPasswordInput(e: Event) {
    this.confirmPassword = (e.target as HTMLInputElement).value;
    if (this.errorMessage) {
      this.errorMessage = '';
      this.requestUpdate();
    }
  }

  private togglePasswordVisibility(e: Event) {
    e.preventDefault();
    this.showPassword = !this.showPassword;
    this.requestUpdate();
  }

  private toggleConfirmPasswordVisibility(e: Event) {
    e.preventDefault();
    this.showConfirmPassword = !this.showConfirmPassword;
    this.requestUpdate();
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.pageState === 'loading') return;

    if (!this.password) {
      this.errorMessage = msg('Please enter a new password.');
      this.requestUpdate();
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = msg('Passwords do not match.');
      this.requestUpdate();
      return;
    }

    this.pageState = 'loading';
    this.errorMessage = '';
    this.requestUpdate();

    try {
      await authService.resetPassword(this.token, this.password);
      this.pageState = 'success';
    } catch (error) {
      if (error instanceof AuthError && error.message === 'invalid-token') {
        this.pageState = 'invalid-token';
      } else if (error instanceof AuthError) {
        switch (error.code) {
          case 'NETWORK_ERROR':
            this.errorMessage = msg('Network error. Please check your connection.');
            break;
          default:
            // Surface server message for password policy violations
            this.errorMessage =
              error.message || msg('An unexpected error occurred. Please try again.');
        }
        this.pageState = 'form';
      } else {
        this.errorMessage = msg('An unexpected error occurred. Please try again.');
        this.pageState = 'error';
      }
    }
    this.requestUpdate();
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

  private renderForm() {
    const isLoading = this.pageState === 'loading';

    return html`
      <div class="reset-card">
        <h1 class="card-title">${msg('Set new password')}</h1>

        <form class="reset-form" @submit=${this.handleSubmit}>
          <div class="form-field password-field">
            <label for="new-password">${msg('New password')}</label>
            <div class="password-input-wrapper">
              <input
                id="new-password"
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
            <label for="confirm-password">${msg('Confirm new password')}</label>
            <div class="password-input-wrapper">
              <input
                id="confirm-password"
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
            ${isLoading ? msg('Setting password\u2026') : msg('Set new password')}
          </button>
        </form>
      </div>
    `;
  }

  private renderSuccess() {
    return html`
      <div class="reset-card status-card">
        <div class="status-icon success-icon" aria-hidden="true">✓</div>
        <p class="status-title">${msg('Password updated')}</p>
        <p class="status-message">
          ${msg('Your password has been reset. You can now sign in with your new password.')}
        </p>
        <button
          class="btn btn-primary"
          @click=${() => { window.location.href = '/'; }}
        >
          ${msg('Sign in')}
        </button>
      </div>
    `;
  }

  private renderInvalidToken() {
    return html`
      <div class="reset-card status-card">
        <div class="status-icon error-icon" aria-hidden="true">✕</div>
        <p class="status-title">${msg('Link expired')}</p>
        <p class="status-message">
          ${msg('This link is invalid or has expired. Reset links are valid for 60 minutes.')}
        </p>
        <button
          class="btn btn-primary"
          @click=${() => { window.location.href = '/'; }}
        >
          ${msg('Request new link')}
        </button>
      </div>
    `;
  }

  private renderError() {
    return html`
      <div class="reset-card status-card">
        <p class="status-title">${msg('Something went wrong')}</p>
        <p class="status-message">
          ${msg('An unexpected error occurred. Please try again or contact support.')}
        </p>
        <button
          class="btn btn-primary"
          @click=${() => { window.location.href = '/'; }}
        >
          ${msg('Go to home')}
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">
          ${this.pageState === 'success'
            ? this.renderSuccess()
            : this.pageState === 'invalid-token'
              ? this.renderInvalidToken()
              : this.pageState === 'error'
                ? this.renderError()
                : this.renderForm()}
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--theme-color-background);
      transition: background-color 0.2s ease;
    }

    .main-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 1rem;
    }

    .reset-card {
      background: var(--theme-color-surface);
      border-radius: 8px;
      box-shadow: var(--theme-shadow-md);
      padding: 2rem;
      width: 100%;
      max-width: 420px;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0 0 1.5rem 0;
      transition: color 0.2s ease;
    }

    .reset-form {
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

    /* Status screens (success / invalid-token / error) */

    .status-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }

    .status-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .success-icon {
      background: var(--theme-color-success);
    }

    .error-icon {
      background: var(--theme-color-error);
    }

    .status-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0;
      transition: color 0.2s ease;
    }

    .status-message {
      font-size: 0.875rem;
      color: var(--theme-color-text-secondary);
      margin: 0;
      line-height: 1.5;
      transition: color 0.2s ease;
    }

    @media (max-width: 640px) {
      .main-content {
        padding: 1.5rem 1rem;
        align-items: flex-start;
      }

      .reset-card {
        padding: 1.5rem 1rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'reset-password-page': ResetPasswordPage;
  }
}
