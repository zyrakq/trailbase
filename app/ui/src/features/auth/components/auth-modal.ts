import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { bundleLoader } from '@/shared';
import type { BundleStatus } from '@/shared';
import '@/shared/components/bundle-error';
import { configService } from '../services/config.service';
import { authModalStyles } from './auth-modal.styles';
import { authService } from '../services/auth.service';

@customElement('auth-modal')
@localized()
export class AuthModal extends LitElement {
  @state() private isOpen = false;
  @state() private bundleStatus: BundleStatus = bundleLoader.getStatus();
  /*
   * True while a retry is in-flight after an error. Keeps the error block
   * visible with a loading indicator instead of snapping back to the
   * first-load skeleton, which caused a jarring layout shift.
   */
  @state() private retryInFlight = false;

  @state() private passwordAuthEnabled = true;
  @state() private registrationEnabled = true;
  private configLoaded = false;

  open() {
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(
      new CustomEvent('modal-opened', { bubbles: true, composed: true })
    );

    if (!this.configLoaded) {
      configService.fetchConfig().then((config) => {
        this.configLoaded = true;
        this.passwordAuthEnabled = config.passwordAuthEnabled;
        this.registrationEnabled = config.registrationEnabled;
      });
    }

    void bundleLoader.loadWcAuth();
    if (bundleLoader.getStatus() === 'ready') {
      this.resetWcAuth();
    }
  }

  private resetWcAuth() {
    const el = this.shadowRoot?.querySelector('wcauth-section') as
      | (HTMLElement & { reset?: () => void })
      | null;
    el?.reset?.();
  }

  close() {
    this.isOpen = false;
    document.body.style.overflow = '';
    window.dispatchEvent(
      new CustomEvent('modal-closed', { bubbles: true, composed: true })
    );
  }

  private handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  private handleClose(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.close();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isOpen) this.close();
  };

  private handleBundleStatusChanged = (e: Event): void => {
    const detail = (e as CustomEvent<{ status: BundleStatus }>).detail;
    const next = detail.status;
    if (this.bundleStatus === 'error' && next === 'loading') {
      this.retryInFlight = true;
    } else if (next === 'ready' || next === 'error') {
      this.retryInFlight = false;
    }
    this.bundleStatus = next;
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleKeyDown);
    this.bundleStatus = bundleLoader.getStatus();
    window.addEventListener(
      'bundle-status-changed',
      this.handleBundleStatusChanged
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';
    window.removeEventListener(
      'bundle-status-changed',
      this.handleBundleStatusChanged
    );
  }

  private async handleAuthSuccess() {
    this.close();
    await authService.refresh();
    window.dispatchEvent(
      new CustomEvent('notification-add', {
        detail: {
          id: `auth-success-${Date.now()}`,
          message: msg('Successfully signed in.'),
          type: 'success' as const,
          duration: 4000,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div
        class="modal-overlay"
        @click=${this.handleOverlayClick}
        @wcauth-section-success=${this.handleAuthSuccess}
        @wcauth-section-close=${this.handleClose}
      >
        <div class="modal-card">
          <div class="modal-header">
            <button
              class="modal-close"
              @click=${(e: Event) => this.handleClose(e)}
              aria-label=${msg('Close dialog')}
            >
              ✕
            </button>
          </div>
          <div class="modal-content">${this.renderAuthContent()}</div>
        </div>
      </div>
    `;
  }

  private renderAuthContent(): TemplateResult {
    if (this.bundleStatus === 'ready') {
      return html`<wcauth-section
        ?no-password-auth=${!this.passwordAuthEnabled}
        ?no-registration=${!this.registrationEnabled}
        verify-email-redirect-url="/verify-email"
      ></wcauth-section>`;
    }
    if (this.bundleStatus === 'error' || this.retryInFlight) {
      return html`<bundle-error
        message=${msg('Failed to load authentication module')}
        ?loading=${this.retryInFlight}
        @bundle-error-retry=${() => bundleLoader.retry()}
      ></bundle-error>`;
    }
    return html`
      <div
        class="auth-skeleton"
        aria-busy="true"
        aria-label=${msg('Loading sign-in form')}
      >
        <div class="skeleton-title"></div>
        <div class="skeleton-field"></div>
        <div class="skeleton-field"></div>
        <div class="skeleton-btn"></div>
      </div>
    `;
  }

  static styles = authModalStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-modal': AuthModal;
  }
}
