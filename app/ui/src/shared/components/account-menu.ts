import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import type { User } from '@/features/auth';
import { accountMenuStyles } from './account-menu.styles';

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

@customElement('account-menu')
@localized()
export class AccountMenu extends LitElement {
  @state() private _isOpen = false;
  @state() private _isAuthenticated = false;
  @state() private _isAdmin = false;
  @state() private _user: User | null = null;
  @state() private _avatarError = false;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
    window.addEventListener('auth-state-updated', this._handleAuthStateUpdated);
    await authService.init();
    this._isAuthenticated = authService.isAuthenticated();
    this._isAdmin = authService.isAdmin();
    this._user = authService.getUser();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    window.removeEventListener('auth-state-updated', this._handleAuthStateUpdated);
  }

  private _toggleMenu(e: Event): void {
    e.stopPropagation();
    this._isOpen = !this._isOpen;
  }

  private _handleOutsideClick = (): void => {
    if (this._isOpen) this._isOpen = false;
  };

  private _handleAuthStateUpdated = (): void => {
    this._isAuthenticated = authService.isAuthenticated();
    this._isAdmin = authService.isAdmin();
    this._user = authService.getUser();
    this._avatarError = false;
  };

  private _handleSignIn(e: Event): void {
    e.stopPropagation();
    this._isOpen = false;
    authService.showLogin();
  }

  private _handleProfile(e: Event): void {
    e.stopPropagation();
    this._isOpen = false;
    window.location.href = '/profile';
  }

  private async _handleSignOut(e: Event): Promise<void> {
    e.stopPropagation();
    this._isOpen = false;
    await authService.signOut();
    window.location.href = '/';
  }

  private _handleAvatarError = (): void => {
    this._avatarError = true;
  };

  private _renderAvatar() {
    const user = this._user;
    if (!user) {
      return html`<div class="avatar-placeholder"></div>`;
    }
    if (user.avatarUrl && !this._avatarError) {
      return html`<img
        class="avatar-img"
        src=${user.avatarUrl}
        alt=${getInitials(user)}
        @error=${this._handleAvatarError}
      />`;
    }
    const bg = getAvatarColor(user);
    return html`<div class="avatar-initials" style="background: ${bg}">${getInitials(user)}</div>`;
  }

  render() {
    return html`
      <button
        class="account-btn"
        @click=${this._toggleMenu}
        aria-label=${msg('Account')}
        aria-haspopup="menu"
        aria-expanded=${this._isOpen}
      >
        ${this._renderAvatar()}
        <svg
          class="chevron ${this._isOpen ? 'open' : ''}"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      ${this._isOpen ? this._renderMenu() : null}
    `;
  }

  private _renderMenu() {
    return html`
      <div class="dropdown" @click=${(e: Event) => e.stopPropagation()}>
        ${this._isAuthenticated
          ? html`
              <button class="dropdown-item" @click=${this._handleProfile}>
                <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${msg('Profile')}
              </button>
              ${this._isAdmin
                ? html`<a class="dropdown-item" href="/admin">
                    <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${msg('Manage subscriptions')}
                  </a>`
                : null}
              <button class="dropdown-item danger" @click=${this._handleSignOut}>
                <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${msg('Sign out')}
              </button>
            `
          : html`
              <button class="dropdown-item" @click=${this._handleSignIn}>
                <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="10 17 15 12 10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${msg('Sign in')}
              </button>
            `}
      </div>
    `;
  }

  static styles = accountMenuStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'account-menu': AccountMenu;
  }
}
