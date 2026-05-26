import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '../../services/auth.service';
import { AuthError, AuthErrorCode } from '../../types/auth-error';
import { authSharedStyles } from '../auth-shared.styles';

type ResendState = 'idle' | 'loading' | 'sent' | 'rate-limited' | 'smtp-error';

/**
 * Post-registration success/verification screen.
 *
 * Events dispatched:
 * - auth-navigate: { view: 'password', email: string } — "Sign in instead"
 * - auth-close: () — close modal (SMTP broken case, no verification possible)
 */
@customElement('auth-register-success-view')
@localized()
export class AuthRegisterSuccessView extends LitElement {
  @property({ type: String }) email = '';
  @property({ type: Boolean }) emailSent = false;

  @state() private resendState: ResendState = 'idle';

  private handleSignInInstead() {
    this.dispatchEvent(
      new CustomEvent('auth-navigate', {
        detail: { view: 'password', email: this.email },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('auth-close', { bubbles: true, composed: true }));
  }

  private async handleResend() {
    if (this.resendState === 'loading' || this.resendState === 'sent') return;
    this.resendState = 'loading';
    try {
      await authService.resendVerificationEmail(this.email.trim());
      this.resendState = 'sent';
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === AuthErrorCode.RATE_LIMITED) {
          this.resendState = 'rate-limited';
        } else if (error.code === AuthErrorCode.EMAIL_NOT_SENT) {
          this.resendState = 'smtp-error';
        } else {
          this.resendState = 'idle';
        }
      } else {
        this.resendState = 'idle';
      }
    }
  }

  render() {
    return html`
      <div class="success-view">
        <div class="success-icon" aria-hidden="true">✓</div>
        ${this.emailSent
          ? html`
              <p class="success-title">${msg('Check your inbox')}</p>
              <p class="success-message">
                ${msg(
                  "If this email isn't registered yet, a verification link has been sent. Please check your inbox and click the link to complete sign in."
                )}
              </p>

              ${this.resendState === 'sent'
                ? html`<p class="resend-confirmation">${msg('Verification email resent.')}</p>`
                : this.resendState === 'rate-limited'
                  ? html`<p class="resend-rate-limited">
                      ${msg('You can request a new link in a few hours.')}
                    </p>`
                  : this.resendState === 'smtp-error'
                    ? html`<p class="resend-smtp-error">
                        ${msg('Could not send the email. Please contact support.')}
                      </p>`
                    : ''}

              <button
                class="btn btn-secondary"
                @click=${this.handleResend}
                ?disabled=${
                  this.resendState === 'loading' ||
                  this.resendState === 'sent' ||
                  this.resendState === 'rate-limited' ||
                  this.resendState === 'smtp-error'
                }
              >
                ${this.resendState === 'loading'
                  ? msg('Sending...')
                  : msg('Resend verification email')}
              </button>

              <button class="btn btn-primary" @click=${this.handleSignInInstead}>
                ${msg('Sign in instead')}
              </button>
            `
          : html`
              <p class="success-title">${msg('Account created')}</p>
              <p class="success-message">
                ${msg('Your account has been created, but we could not send a verification email.')}
              </p>
              <p class="success-message">
                ${msg('Please contact support to verify your account and complete sign in.')}
              </p>
              <button class="btn btn-primary" @click=${this.handleClose}>
                ${msg('Close')}
              </button>
            `}
      </div>
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      .success-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
        text-align: center;
      }

      .success-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--theme-color-success);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .success-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--theme-color-text-primary);
        margin: 0;
      }

      .success-message {
        font-size: 0.875rem;
        color: var(--theme-color-text-secondary);
        margin: 0;
        line-height: 1.5;
      }

      .resend-confirmation {
        font-size: 0.875rem;
        color: var(--theme-color-success);
        margin: 0;
      }

      .resend-rate-limited {
        font-size: 0.875rem;
        color: var(--theme-color-text-muted);
        margin: 0;
      }

      .resend-smtp-error {
        font-size: 0.875rem;
        color: var(--theme-color-error);
        margin: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-register-success-view': AuthRegisterSuccessView;
  }
}
