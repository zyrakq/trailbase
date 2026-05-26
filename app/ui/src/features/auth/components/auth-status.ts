import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../services/auth.service';
import type { User } from '@/features/auth';
import { ThemeController } from '@/features/theme';
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
    window.removeEventListener('auth-state-updated', this.handleAuthStateUpdated);
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
                <button
                  class="btn btn-primary"
                  @click=${this.handleSignIn}
                >
                  ${msg('Sign In')}
                </button>
              `}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 420px;
    }

    .auth-card {
      background: var(--theme-color-surface);
      border-radius: 8px;
      padding: 3rem 2.5rem;
      box-shadow: var(--theme-shadow-md);
      text-align: center;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .logo {
      width: 120px;
      height: 120px;
      margin-bottom: 1.5rem;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0 0 0.5rem 0;
      transition: color 0.2s ease;
    }

    .subtitle {
      font-size: 0.9375rem;
      color: var(--theme-color-text-secondary);
      margin: 0 0 2rem 0;
      transition: color 0.2s ease;
    }

    .user-info {
      margin: 1.5rem 0;
      padding: 0.75rem 1rem;
      background: var(--theme-color-background);
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .user-name {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--theme-color-text-primary);
      transition: color 0.2s ease;
    }

    .actions {
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 2rem;
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
      .auth-card {
        padding: 2rem 1.5rem;
      }

      .logo {
        width: 100px;
        height: 100px;
      }

      .title {
        font-size: 1.375rem;
      }

      .subtitle {
        font-size: 0.875rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-status': AuthStatus;
  }
}
