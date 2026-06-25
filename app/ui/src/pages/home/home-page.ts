import { LitElement, html } from 'lit';
import type { TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import { homePageStyles } from './home-page.styles';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import './welcome/welcome-content';

@customElement('home-page')
@localized()
export class HomePage extends LitElement {
  @state() private _isAuthenticated = false;
  @state() private _dashboardReady = false;

  async connectedCallback() {
    super.connectedCallback();
    await authService.init();
    this._updateAuthState();
    window.addEventListener('auth-state-updated', this._handleAuth);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('auth-state-updated', this._handleAuth);
  }

  private _handleAuth = (): void => {
    this._updateAuthState();
  };

  private _updateAuthState(): void {
    const authState = authService.getAuthState();
    this._isAuthenticated = authState.isAuthenticated;
    if (authState.isAuthenticated && !this._dashboardReady) {
      this._loadDashboard();
    }
  }

  private _loadDashboard(): void {
    void import('./dashboard/dashboard-layout')
      .then(() => {
        this._dashboardReady = true;
      })
      .catch(() => {
        notificationService.error(msg('Failed to load the dashboard.'));
      });
  }

  private renderMain(): TemplateResult {
    if (this._isAuthenticated && this._dashboardReady) {
      return html`<dashboard-layout></dashboard-layout>`;
    }
    if (this._isAuthenticated) {
      return html`<div class="loading">${msg('Loading…')}</div>`;
    }
    return html`<welcome-content></welcome-content>`;
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

  static styles = homePageStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
