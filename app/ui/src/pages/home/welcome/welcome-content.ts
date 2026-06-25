import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { welcomeContentStyles } from './welcome-content.styles';

@customElement('welcome-content')
@localized()
export class WelcomeContent extends LitElement {
  private _handleSignIn(): void {
    authService.showLogin();
  }

  render() {
    return html`
      <div class="welcome">
        <section class="hero">
          <h1>${msg('Manage all your subscriptions in one place')}</h1>
          <p class="subtitle">
            ${msg('Subscribe to, track, and manage access to the services you use.')}
          </p>
        </section>

        <section class="features">
          <article class="feature-card">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <h3>${msg('All your services in one place')}</h3>
            <p>${msg('See every active subscription from a single dashboard.')}</p>
          </article>

          <article class="feature-card">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <h3>${msg('Subscribe in one click')}</h3>
            <p>${msg('Activate new services instantly without leaving the app.')}</p>
          </article>

          <article class="feature-card">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <h3>${msg('Always know what is active')}</h3>
            <p>${msg('A full event history keeps you in control of your account.')}</p>
          </article>
        </section>

        <section class="cta">
          <button class="btn-primary" @click=${this._handleSignIn}>
            ${msg('Sign In to Get Started')}
          </button>
        </section>
      </div>
    `;
  }

  static styles = welcomeContentStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'welcome-content': WelcomeContent;
  }
}
