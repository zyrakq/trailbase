import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';

export type PasswordSubmitPayload = { password: string };

@customElement('reset-password-form')
@localized()
export class ResetPasswordForm extends LitElement {
  @state() private password = '';
  @state() private confirmPassword = '';
  @state() private showPassword = false;
  @state() private showConfirmPassword = false;
  @state() private errorMessage = '';

  // errorMessage can also be set from outside (e.g. server-side error from index.ts)
  // index.ts sets it via property after a failed service call
  set externalError(value: string) {
    this.errorMessage = value;
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

  private handleSubmit(e: Event) {
    e.preventDefault();

    if (!this.password) {
      this.errorMessage = msg('Please enter a new password.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = msg('Passwords do not match.');
      return;
    }

    this.dispatchEvent(
      new CustomEvent<PasswordSubmitPayload>('password-submit', {
        detail: { password: this.password },
        bubbles: true,
        composed: true,
      })
    );
  }

  private eyeIcon() {
    return html`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    `;
  }

  private eyeSlashIcon() {
    return html`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    `;
  }

  render() {
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
                required
              />
              <button
                type="button"
                class="password-toggle"
                @click=${this.togglePasswordVisibility}
                aria-label=${this.showPassword ? msg('Hide password') : msg('Show password')}
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
                required
              />
              <button
                type="button"
                class="password-toggle"
                @click=${this.toggleConfirmPasswordVisibility}
                aria-label=${this.showConfirmPassword ? msg('Hide password') : msg('Show password')}
              >
                ${this.showConfirmPassword ? this.eyeSlashIcon() : this.eyeIcon()}
              </button>
            </div>
          </div>

          ${this.errorMessage
            ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
            : ''}

          <button type="submit" class="btn btn-primary">
            ${msg('Set new password')}
          </button>
        </form>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
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
      transition: background-color 0.2s ease, border-color 0.2s ease,
        color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-field input:focus {
      outline: none;
      border-color: var(--theme-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
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

    .password-toggle:hover {
      color: var(--theme-color-text-primary);
    }

    .password-toggle:focus {
      outline: 2px solid var(--theme-color-primary);
      outline-offset: 1px;
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

    @media (max-width: 640px) {
      .reset-card {
        padding: 1.5rem 1rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'reset-password-form': ResetPasswordForm;
  }
}
