import { LitElement, html } from 'lit';
import type { TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { localized } from '@/features/localization';
import { resetPasswordPageStyles } from './index.styles.ts';
import { authService, AuthError } from '@/features/auth';
import type { PasswordSubmitPayload } from './blocks/password-form.ts';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import './blocks/password-form.ts';
import './blocks/success-state.ts';
import './blocks/invalid-token.ts';
import './blocks/error-state.ts';

type PageState = 'form' | 'success' | 'invalid-token' | 'error';

@customElement('reset-password-page')
@localized()
export class ResetPasswordPage extends LitElement {
  @state() private pageState: PageState = 'form';
  @state() private serverError = '';

  private token = '';

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

  private async handlePasswordSubmit(e: CustomEvent<PasswordSubmitPayload>) {
    const { password } = e.detail;
    this.serverError = '';

    try {
      await authService.resetPassword(this.token, password);
      this.pageState = 'success';
    } catch (error) {
      if (error instanceof AuthError && error.message === 'invalid-token') {
        this.pageState = 'invalid-token';
      } else if (error instanceof AuthError) {
        switch (error.code) {
          case 'NETWORK_ERROR':
            this.serverError = 'Network error. Please check your connection.';
            break;
          default:
            // Surface server message for password policy violations
            this.serverError =
              error.message || 'An unexpected error occurred. Please try again.';
        }
        this.pageState = 'form';
      } else {
        this.pageState = 'error';
      }
    }
  }

  private handleNavigate() {
    window.location.href = '/';
  }

  private renderMain(): TemplateResult {
    if (this.pageState === 'success') {
      return html`<reset-password-success
        @navigate=${this.handleNavigate}
      ></reset-password-success>`;
    }

    if (this.pageState === 'invalid-token') {
      return html`<reset-password-invalid-token
        @navigate=${this.handleNavigate}
      ></reset-password-invalid-token>`;
    }

    if (this.pageState === 'error') {
      return html`<reset-password-error
        @navigate=${this.handleNavigate}
      ></reset-password-error>`;
    }

    return html`<reset-password-form
      .externalError=${this.serverError}
      @password-submit=${this.handlePasswordSubmit}
    ></reset-password-form>`;
  }

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">${this.renderMain()}</main>
        <footer-info></footer-info>
      </div>
    `;
  }

  static styles = resetPasswordPageStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'reset-password-page': ResetPasswordPage;
  }
}
