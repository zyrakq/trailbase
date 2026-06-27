import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { ThemeController } from '@/features/theme';
import { appHeaderStyles } from './app-header.styles';
import { configService } from '@/features/auth/services/config.service';
import { authService } from '@/features/auth';
import '@/features/localization/components/locale-switcher';
import './account-menu';

@customElement('app-header')
@localized()
export class AppHeader extends LitElement {
  private theme = new ThemeController(this);

  @state()
  private brandName = 'velora';

  @state()
  private _isAuthenticated = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.brandName = configService.getConfig().brandName;
    this._updateAuthState();
    window.addEventListener('auth-state-updated', this._handleAuthStateUpdated);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(
      'auth-state-updated',
      this._handleAuthStateUpdated
    );
  }

  private _handleAuthStateUpdated = (): void => {
    this._updateAuthState();
  };

  private _updateAuthState(): void {
    this._isAuthenticated = authService.isAuthenticated();
  }

  private _handleSignIn(): void {
    authService.showLogin();
  }

  render() {
    const logo = `/branding/logo-${this.theme.theme}.svg`;

    return html`
      <header>
        <div class="header-content">
          <a class="logo-link" href="/" aria-label=${msg('Go to home')}>
            <div class="logo-section">
              <img src=${logo} alt=${this.brandName} class="logo" />
              <span class="app-name">${this.brandName}</span>
            </div>
          </a>
          <div class="actions">
            ${this._isAuthenticated
              ? html`<account-menu></account-menu>`
              : html`
                  <button class="login-btn" @click=${this._handleSignIn}>
                    ${msg('Sign In')}
                  </button>
                `}
            <theme-toggler></theme-toggler>
            <locale-switcher></locale-switcher>
          </div>
        </div>
      </header>
    `;
  }

  static styles = appHeaderStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}
