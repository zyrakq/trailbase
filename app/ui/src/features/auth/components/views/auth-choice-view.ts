import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../../services/auth.service';
import { OIDC_PROVIDERS, type OIDCProvider } from '../../config/auth-providers';
import { authSharedStyles } from '../auth-shared.styles';

/**
 * Choice view — OIDC buttons, email/password sign-in, optional registration.
 *
 * Events dispatched:
 * - auth-navigate: { view: 'password' | 'register' }
 * - auth-close: (before OIDC redirect)
 */
@customElement('auth-choice-view')
@localized()
export class AuthChoiceView extends LitElement {
  @property({ type: Boolean }) registrationEnabled = true;

  private handleOIDC(provider: OIDCProvider) {
    this.dispatchEvent(new CustomEvent('auth-close', { bubbles: true, composed: true }));
    authService.signIn(provider.key, '/auth/callback').catch(() => {
      window.dispatchEvent(
        new CustomEvent('notification-add', {
          detail: {
            id: `oidc-error-${Date.now()}`,
            message: msg(str`Failed to start ${provider.label} sign in. Please try again.`),
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
        ${OIDC_PROVIDERS.map(
          (p) => html`
            <button class="btn btn-primary" @click=${() => this.handleOIDC(p)}>
              ${msg(str`Continue with ${p.label}`)}
            </button>
          `
        )}

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
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-choice-view': AuthChoiceView;
  }
}
