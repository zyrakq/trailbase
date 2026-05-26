import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService, totpService, AuthError, AuthErrorCode } from '@/features/auth';
import type { TotpSetupData } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import type { TotpSetupState, TotpActionPayload } from './blocks/security-card.ts';
import type { User } from '@/features/auth';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import './blocks/user-card.ts';
import './blocks/security-card.ts';

@customElement('profile-page')
@localized()
export class ProfilePage extends LitElement {
  @state() private user: User | null = null;
  @state() private totpState: TotpSetupState = 'idle';
  @state() private totpSetupData: TotpSetupData | null = null;
  @state() private verifyCode = '';
  @state() private disableCode = '';
  @state() private totpError = '';
  @state() private signOutLoading = false;

  async connectedCallback() {
    super.connectedCallback();
    const authState = authService.getAuthState();
    this.user = authState.user;
    this.totpState = authState.hasMfa ? 'enabled' : 'idle';
  }

  private async handleSignOut() {
    try {
      this.signOutLoading = true;
      await authService.signOut();
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch {
      notificationService.error(msg('Failed to sign out. Please try again.'));
    } finally {
      this.signOutLoading = false;
    }
  }

  private async handleTotpAction(e: CustomEvent<TotpActionPayload>) {
    const action = e.detail;

    switch (action.kind) {
      case 'enable':
        await this.enableTotp();
        break;
      case 'verify-code-input':
        this.verifyCode = action.value.replace(/\D/g, '').slice(0, 6);
        if (this.totpError) this.totpError = '';
        break;
      case 'confirm-setup':
        await this.confirmSetup(action.code);
        break;
      case 'start-disable':
        this.disableCode = '';
        this.totpError = '';
        this.totpState = 'disabling';
        break;
      case 'disable-code-input':
        this.disableCode = action.value.replace(/\D/g, '').slice(0, 6);
        if (this.totpError) this.totpError = '';
        break;
      case 'confirm-disable':
        await this.confirmDisable(action.code);
        break;
      case 'cancel-disable':
        this.totpState = 'enabled';
        this.disableCode = '';
        this.totpError = '';
        break;
    }
  }

  private async enableTotp() {
    this.totpError = '';
    this.totpState = 'loading-qr';
    try {
      const data = await totpService.startSetup();
      this.totpSetupData = data;
      this.verifyCode = '';
      this.totpState = 'qr-ready';
    } catch {
      this.totpState = 'idle';
      notificationService.error(msg('Failed to start TOTP setup. Please try again.'));
    }
  }

  private async confirmSetup(code: string) {
    if (this.totpState === 'confirming') return;
    if (!this.totpSetupData) return;

    if (code.length !== 6) {
      this.totpError = msg('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    this.totpState = 'confirming';
    this.totpError = '';

    try {
      await totpService.confirmSetup(this.totpSetupData.totpUrl, code);
      this.totpState = 'enabled';
      this.totpSetupData = null;
      this.verifyCode = '';
      notificationService.success(msg('Two-factor authentication enabled.'));
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.totpError = msg('Invalid code. Please try again.');
      } else {
        this.totpError = msg('Verification failed. Please try again.');
      }
      this.totpState = 'qr-ready';
    }
  }

  private async confirmDisable(code: string) {
    if (code.length !== 6) {
      this.totpError = msg('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    this.totpError = '';

    try {
      await totpService.disableTotp(code);
      this.totpState = 'idle';
      this.disableCode = '';
      notificationService.success(msg('Two-factor authentication disabled.'));
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        this.totpError = msg('Invalid code. Please try again.');
      } else {
        this.totpError = msg('Failed to disable two-factor authentication. Please try again.');
      }
    }
  }

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">
          <div class="profile-container">
            <profile-user-card .user=${this.user}></profile-user-card>

            <profile-security-card
              .totpState=${this.totpState}
              .totpData=${this.totpSetupData}
              .totpSecret=${this.totpSetupData ? totpService.extractSecret(this.totpSetupData.totpUrl) : null}
              .verifyCode=${this.verifyCode}
              .disableCode=${this.disableCode}
              .totpError=${this.totpError}
              @totp-action=${this.handleTotpAction}
            ></profile-security-card>

            <div class="actions">
              <button
                class="btn btn-danger"
                @click=${this.handleSignOut}
                ?disabled=${this.signOutLoading}
              >
                ${this.signOutLoading ? msg('Signing out...') : msg('Sign Out')}
              </button>
            </div>
          </div>
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--theme-color-background);
      transition: background-color 0.2s ease;
    }

    .main-content {
      flex: 1;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .profile-container {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .actions {
      display: flex;
      justify-content: center;
      padding-bottom: 1rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      transition: background-color 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      background: var(--theme-color-error);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      opacity: 0.9;
    }

    @media (max-width: 640px) {
      .main-content {
        padding: 1.5rem 1rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-page': ProfilePage;
  }
}
