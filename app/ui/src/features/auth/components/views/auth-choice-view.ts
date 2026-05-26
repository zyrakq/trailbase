import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../../services/auth.service';
import { type OAuthProviderConfig } from '../../services/config.service';
import { authSharedStyles } from '../auth-shared.styles';

/**
 * Choice view — OAuth provider icon links, email/password sign-in, optional registration.
 *
 * Events dispatched:
 * - auth-navigate: { view: 'password' | 'register' }
 * - auth-close: (before OAuth redirect)
 */
@customElement('auth-choice-view')
@localized()
export class AuthChoiceView extends LitElement {
  @property({ type: Boolean }) registrationEnabled = true;
  @property({ type: Array }) oauthProviders: OAuthProviderConfig[] = [];

  private handleOAuthClick(provider: OAuthProviderConfig, e: Event) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('auth-close', { bubbles: true, composed: true }));
    authService.signIn(provider.key, '/auth/callback').catch(() => {
      window.dispatchEvent(
        new CustomEvent('notification-add', {
          detail: {
            id: `oidc-error-${Date.now()}`,
            message: msg(str`Failed to start ${provider.displayName} sign in. Please try again.`),
            type: 'error' as const,
          },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  private navigate(view: 'password' | 'register') {
    this.dispatchEvent(
      new CustomEvent('auth-navigate', { detail: { view }, bubbles: true, composed: true })
    );
  }

  render() {
    return html`
      <div class="choice-view">
        ${this.oauthProviders.map(
          (p) => html`
            <a
              class="btn btn-outline oauth-btn"
              href="/api/auth/v1/oauth/${p.key}/login?redirect_uri=/auth/callback"
              @click=${(e: Event) => this.handleOAuthClick(p, e)}
            >
              <img
                class="oauth-icon"
                src="/_/auth/oauth2/${p.imgName}"
                alt=${p.displayName}
              />
              <span>${p.displayName}</span>
            </a>
          `
        )}

        ${this.oauthProviders.length > 0
          ? html`<div class="divider"></div>`
          : ''}

        <button class="btn btn-primary" @click=${() => this.navigate('password')}>
          ${msg('Sign in with email and password')}
        </button>

        ${this.registrationEnabled
          ? html`
            <div class="divider"></div>
            <button class="btn btn-secondary" @click=${() => this.navigate('register')}>
              ${msg('Create an account')}
            </button>
          `
          : ''}
      </div>
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      .choice-view {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .divider {
        height: 1px;
        background: var(--theme-color-border);
        margin: 0.25rem 0;
        transition: background-color 0.2s ease;
      }

      .oauth-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        text-decoration: none;
        font-weight: 500;
      }

      .oauth-icon {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-choice-view': AuthChoiceView;
  }
}
