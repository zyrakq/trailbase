import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';
import { authService, configService } from '@/features/auth';
import { localizationService } from '@/features/localization';
import '@/features/theme/services/favicon.service';

import '@/pages/home';
import '@/pages/dashboard/index.ts';
import '@/pages/profile/index.ts';
import '@/pages/admin/index.ts';
import '@/pages/subscription/index.ts';
import '@/features/auth/components/oauth-callback';
import '@/pages/reset-password/index.ts';
import '@/features/notifications/components/toast-container';

@customElement('app-component')
export class AppComponent extends LitElement {
  constructor() {
    super();
    localizationService.init();
    void configService.init();
  }

  private _router = new Router(this, [
    {
      path: '/',
      render: () => html`<home-page></home-page>`,
      enter: async () => {
        await authService.init();
        return true;
      },
    },
    {
      path: '/auth/callback',
      render: () => html`<oauth-callback></oauth-callback>`,
    },
    {
      path: '/reset-password',
      render: () => html`<reset-password-page></reset-password-page>`,
      enter: async () => {
        await authService.init();
        return true;
      },
    },
    {
      path: '/subscription/:id',
      render: (params: Record<string, string | undefined>) => html`<subscription-detail-page .subscriptionId=${params['id'] ?? ''}></subscription-detail-page>`,
      enter: async () => {
        await authService.init();
        return true;
      },
    },
    {
      path: '/dashboard',
      render: () => html``,
      enter: async () => {
        await authService.init();
        if (!authService.isAuthenticated()) {
          window.location.href = '/';
        } else {
          window.location.href = '/profile';
        }
        return false;
      },
    },
    {
      path: '/profile',
      render: () => html`<profile-page></profile-page>`,
      enter: async () => {
        await authService.init();
        if (!authService.isAuthenticated()) {
          window.location.href = '/';
          return false;
        }
        return true;
      },
    },
    {
      path: '/admin',
      render: () => html`<admin-page></admin-page>`,
      enter: async () => {
        await authService.init();
        if (!authService.isAuthenticated()) {
          window.location.href = '/';
          return false;
        }
        return true;
      },
    },
    {
      path: '/admin/subscription/new',
      render: () => html`<subscription-form-page></subscription-form-page>`,
      enter: async () => {
        await authService.init();
        if (!authService.isAuthenticated()) {
          window.location.href = '/';
          return false;
        }
        return true;
      },
    },
    {
      path: '/admin/subscription/:id/edit',
      render: (params: Record<string, string | undefined>) => html`<subscription-form-page .subscriptionId=${params['id'] ?? ''}></subscription-form-page>`,
      enter: async () => {
        await authService.init();
        if (!authService.isAuthenticated()) {
          window.location.href = '/';
          return false;
        }
        return true;
      },
    },
  ]);

  render() {
    return html`${this._router.outlet()}`;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'app-component': AppComponent;
  }
}
