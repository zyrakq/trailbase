import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';
import { authService } from '@/features/auth';
import { localizationService } from '@/features/localization';
import '@/features/theme/services/favicon.service';

// Import components (they will be registered as custom elements)
import '@/pages/welcome-page';
import '@/pages/dashboard-page';
import '@/features/auth/components/oauth-callback';
import '@/features/notifications/components/toast-container';

@customElement('app-component')
export class AppComponent extends LitElement {
  constructor() {
    super();
    localizationService.init();
  }

  private _router = new Router(this, [
    {
      path: '/',
      render: () => html`<welcome-page></welcome-page>`,
      enter: async () => {
        await authService.init();
        return true;
      },
    },
    {
      // Landing page after TrailBase completes OAuth and redirects the browser.
      // TrailBase sets the session cookie before this redirect — oauth-callback
      // calls authService.refresh() to load auth state from the cookie.
      path: '/auth/callback',
      render: () => html`<oauth-callback></oauth-callback>`,
    },
    {
      path: '/dashboard',
      render: () => html`<dashboard-page></dashboard-page>`,
      enter: async () => {
        await authService.init();
        if (!authService.isAuthenticated()) {
          this._router.goto('/');
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
