import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../services/auth.service';
import { ThemeController } from '@/features/theme';
import { authStatusStyles } from './auth-status.styles';
import type { User } from '@/features/auth';
import logoLight from '@/assets/logo-light.svg';
import logoDark from '@/assets/logo-dark.svg';

@customElement('auth-status')
@localized()
export class AuthStatus extends LitElement {
  private theme = new ThemeController(this);

  @state()
  private isAuthenticated = false;

  @state()
  private user: User | null = null;

  async connectedCallback() {
    super.connectedCallback();
    await this.checkAuthStatus();
    window.addEventListener('auth-state-updated', this.handleAuthStateUpdated);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      'auth-state-updated',
      this.handleAuthStateUpdated
    );
  }

  private async checkAuthStatus() {
    await authService.init();
    const authState = authService.getAuthState();
    this.isAuthenticated = authState.isAuthenticated;
    this.user = authState.user;
  }

  private handleAuthStateUpdated = () => {
    const authState = authService.getAuthState();
    this.isAuthenticated = authState.isAuthenticated;
    this.user = authState.user;
    this.requestUpdate();
  };

  private handleSignIn() {
    authService.showLogin();
  }

  private handleProfileClick() {
    window.location.href = '/profile';
  }

  render() {
    const logo = this.theme.theme === 'dark' ? logoDark : logoLight;

    return html`
      <div class="auth-card">
        <img src=${logo} alt="argiago" class="logo" />

        <h1 class="title">${msg('Welcome to argiago')}</h1>
        <p class="subtitle">${msg('Sign in to continue')}</p>

        ${this.isAuthenticated
          ? html`
              <div class="user-info">
                <span class="user-name"
                  >${this.user?.displayName || this.user?.username}</span
                >
              </div>
            `
          : ''}

        <div class="actions">
          ${this.isAuthenticated
            ? html`
                <button
                  class="btn btn-primary"
                  @click=${this.handleProfileClick}
                >
                  ${msg('Go to Profile')}
                </button>
              `
            : html`
                <button class="btn btn-primary" @click=${this.handleSignIn}>
                  ${msg('Sign In')}
                </button>
              `}
        </div>
      </div>
    `;
  }

  static styles = authStatusStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-status': AuthStatus;
  }
}
