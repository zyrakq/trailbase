import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { LocaleController } from '@/features/localization/controllers/locale.controller';
import { LOCALE_METADATA } from '@/features/localization/data/locale-metadata';
import { themeService } from '@/features/theme/services/theme.service';
import { appHeaderStyles } from './app-header.styles';
import { configService } from '@/features/auth/services/config.service';
import { authService } from '@/features/auth';
import type { User } from '@/features/auth';
import type { Theme } from '@/features/theme/types/theme.types';
import '@/features/localization/components/locale-switcher';
import '@/features/localization/components/locale-bottom-sheet';
import '@/features/theme/components/theme-toggler';
import './account-menu';

function getInitials(user: User): string {
  const source = user.displayName || user.email || user.username;
  return source.charAt(0).toUpperCase();
}

function getAvatarColor(user: User): string {
  const source = user.username || user.id;
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

@customElement('app-header')
@localized()
export class AppHeader extends LitElement {
  private _localeCtrl = new LocaleController(this);

  @state() private brandName = 'velora';
  @state() private _isAuthenticated = false;
  @state() private _isAdmin = false;
  @state() private _user: User | null = null;
  @state() private _avatarError = false;
  @state() private _menuOpen = false;
  @state() private _localeSheetOpen = false;
  @state() private _theme: Theme = 'light';

  private _unsubTheme?: () => void;
  private _mq = window.matchMedia('(max-width: 768px)');

  connectedCallback(): void {
    super.connectedCallback();
    this.brandName = configService.getConfig().brandName;
    this._updateAuthState();
    this._theme = themeService.getTheme();
    this._unsubTheme = themeService.subscribe((t) => {
      this._theme = t;
    });
    window.addEventListener('auth-state-updated', this._handleAuthStateUpdated);
    document.addEventListener('keydown', this._handleKeyDown);
    this._mq.addEventListener('change', this._handleBreakpointChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubTheme?.();
    window.removeEventListener('auth-state-updated', this._handleAuthStateUpdated);
    document.removeEventListener('keydown', this._handleKeyDown);
    this._mq.removeEventListener('change', this._handleBreakpointChange);
    document.body.style.overflow = '';
  }

  private _handleBreakpointChange = (e: MediaQueryListEvent): void => {
    if (!e.matches) {
      this._closeMenu();
    }
  };

  private _handleAuthStateUpdated = (): void => {
    this._updateAuthState();
  };

  private _updateAuthState(): void {
    this._isAuthenticated = authService.isAuthenticated();
    this._isAdmin = authService.isAdmin();
    this._user = authService.getUser();
    this._avatarError = false;
  }

  private async _handleSignOut(): Promise<void> {
    this._closeMenu();
    await authService.signOut();
    window.location.href = '/';
  }

  private _handleSignIn(): void {
    authService.showLogin();
  }

  private _toggleMenu(): void {
    this._menuOpen = !this._menuOpen;
    document.body.style.overflow = this._menuOpen ? 'hidden' : '';
  }

  private _closeMenu(): void {
    this._menuOpen = false;
    this._localeSheetOpen = false;
    document.body.style.overflow = '';
  }

  private _toggleLocaleSheet(): void {
    this._localeSheetOpen = !this._localeSheetOpen;
  }

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    if (this._localeSheetOpen) {
      this._localeSheetOpen = false;
    } else if (this._menuOpen) {
      this._closeMenu();
    }
  };

  private _handleThemeToggle(): void {
    themeService.toggleTheme();
  }

  private _handleAvatarError = (): void => {
    this._avatarError = true;
  };

  private _renderDrawerAvatar() {
    const user = this._user;
    if (!user) return nothing;
    if (user.avatarUrl && !this._avatarError) {
      return html`<img
        class="drawer-avatar"
        src=${user.avatarUrl}
        alt=${getInitials(user)}
        @error=${this._handleAvatarError}
      />`;
    }
    const bg = getAvatarColor(user);
    return html`<div class="drawer-avatar-initials" style="background: ${bg}">
      ${getInitials(user)}
    </div>`;
  }

  private _renderDrawerProfile() {
    if (!this._isAuthenticated || !this._user) return nothing;
    const user = this._user;
    const displayName = user.displayName || user.username || user.email;
    const subtitle = user.displayName ? (user.email || user.username) : null;
    return html`
      <div class="drawer-profile">
        ${this._renderDrawerAvatar()}
        <span class="drawer-username">${displayName}</span>
        ${subtitle ? html`<span class="drawer-user-subtitle">${subtitle}</span>` : nothing}
      </div>
    `;
  }

  private _renderProfileMenuRows() {
    if (!this._isAuthenticated) {
      return html`
        <div
          class="drawer-row"
          role="button"
          tabindex="0"
          @click=${() => { this._closeMenu(); this._handleSignIn(); }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._closeMenu(); this._handleSignIn(); } }}
        >
          <svg class="drawer-row-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="10 17 15 12 10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="drawer-row-label">${msg('Sign In')}</span>
        </div>
      `;
    }
    return html`
      <div
        class="drawer-row"
        role="button"
        tabindex="0"
        @click=${() => { this._closeMenu(); window.location.href = '/profile'; }}
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._closeMenu(); window.location.href = '/profile'; } }}
      >
        <svg class="drawer-row-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="drawer-row-label">${msg('Profile')}</span>
      </div>
      ${this._isAdmin ? html`
        <div
          class="drawer-row"
          role="button"
          tabindex="0"
          @click=${() => { this._closeMenu(); window.location.href = '/admin'; }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._closeMenu(); window.location.href = '/admin'; } }}
        >
          <svg class="drawer-row-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="drawer-row-label">${msg('Manage subscriptions')}</span>
        </div>
      ` : nothing}
    `;
  }

  private _renderSignOutRow() {
    if (!this._isAuthenticated) return nothing;
    return html`
      <div
        class="drawer-row danger"
        role="button"
        tabindex="0"
        @click=${this._handleSignOut}
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleSignOut(); } }}
        aria-label=${msg('Sign out')}
      >
        <svg class="drawer-row-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="drawer-row-label">${msg('Sign out')}</span>
      </div>
    `;
  }

  private _renderBurgerIcon() {
    if (this._menuOpen) {
      return html`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
  }

  private _renderMoonIcon() {
    return html`
      <svg class="drawer-row-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private _renderChevronIcon() {
    return html`
      <svg class="drawer-row-chevron" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;
  }

  private _renderMobileDrawer() {
    const isDark = this._theme === 'dark';
    const currentLocale = LOCALE_METADATA[this._localeCtrl.locale];
    const drawerClass = `mobile-drawer${this._menuOpen ? ' open' : ''}`;

    return html`
      <div class=${drawerClass} role="dialog" aria-modal="true" aria-label=${msg('Menu')}>
        ${this._renderDrawerProfile()}
        ${this._renderProfileMenuRows()}

        <div
          class="drawer-row"
          role="button"
          tabindex="0"
          @click=${this._handleThemeToggle}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleThemeToggle(); } }}
          aria-label=${isDark ? msg('Switch to light theme') : msg('Switch to dark theme')}
        >
          ${this._renderMoonIcon()}
          <span class="drawer-row-label">${msg('Dark mode')}</span>
          <div class="theme-switch" aria-hidden="true">
            <div class="theme-track ${isDark ? 'active' : ''}">
              <div class="theme-thumb"></div>
            </div>
          </div>
        </div>

        <div
          class="drawer-row"
          role="button"
          tabindex="0"
          @click=${this._toggleLocaleSheet}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggleLocaleSheet(); } }}
          aria-label=${msg('Change language')}
        >
          <svg class="drawer-row-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="drawer-row-label">${msg('Language')}</span>
          <span class="drawer-row-value">${currentLocale.flag}</span>
          ${this._renderChevronIcon()}
        </div>

        ${this._renderSignOutRow()}
      </div>

      <locale-bottom-sheet
        ?open=${this._localeSheetOpen}
        @close=${() => { this._localeSheetOpen = false; }}
        @locale-selected=${() => { this._localeSheetOpen = false; }}
      ></locale-bottom-sheet>
    `;
  }

  render() {
    const mark = `/branding/mark-${this._theme}.svg`;

    return html`
      <header>
        <div class="header-content">
          <a class="logo-link" href="/" aria-label=${msg('Go to home')}>
            <img src=${mark} alt=${this.brandName} class="logo-mark" />
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
          <button
            class="burger-btn"
            @click=${this._toggleMenu}
            aria-label=${this._menuOpen ? msg('Close menu') : msg('Open menu')}
            aria-expanded=${this._menuOpen}
            aria-haspopup="dialog"
          >
            ${this._renderBurgerIcon()}
          </button>
        </div>
        ${this._renderMobileDrawer()}
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
