import { LitElement, css, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { bundleLoader } from '@/shared';
import type { BundleStatus } from '@/shared';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import '@/shared/components/bundle-error';

/**
 * Host app page for email verification success.
 *
 * Loads the wcauth bundle via the singleton bundle loader, then mounts
 * `<wcauth mode="verify-email">` which renders the success screen.
 * No token extraction — the backend already confirmed the email before
 * redirecting here.
 */
@customElement('verify-email-page')
@localized()
export class VerifyEmailPage extends LitElement {
  @state() private bundleStatus: BundleStatus = bundleLoader.getStatus();
  @state() private retryInFlight = false;

  private handleBundleStatusChanged = (event: Event): void => {
    const detail = (event as CustomEvent<{ status: BundleStatus }>).detail;
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
    this.bundleStatus = bundleLoader.getStatus();
    window.addEventListener(
      'bundle-status-changed',
      this.handleBundleStatusChanged
    );
    bundleLoader.loadWcAuth();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      'bundle-status-changed',
      this.handleBundleStatusChanged
    );
  }

  private renderContent(): TemplateResult {
    if (this.bundleStatus === 'ready') {
      return html`<wcauth-section mode="verify-email"></wcauth-section>`;
    }

    if (this.bundleStatus === 'error' || this.retryInFlight) {
      return html`
        <bundle-error
          message=${msg('Failed to load authentication module')}
          ?loading=${this.retryInFlight}
          @bundle-error-retry=${() => bundleLoader.retry()}
        ></bundle-error>
      `;
    }

    return html`<div class="skeleton"></div>`;
  }

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">
          <div class="container">${this.renderContent()}</div>
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: var(--full-vh, 100vh);
    }

    .page {
      display: flex;
      flex-direction: column;
      min-height: var(--full-vh, 100vh);
      background: var(--theme-color-background);
      transition: background-color 0.2s ease;
    }

    .main-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 1rem;
    }

    .container {
      width: 100%;
      max-width: 480px;
    }

    .skeleton {
      height: 200px;
      border-radius: 8px;
      background: color-mix(
        in srgb,
        var(--theme-color-text-primary) 8%,
        transparent
      );
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @media (max-width: 640px) {
      .main-content {
        padding: 1.5rem 1rem;
        align-items: flex-start;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'verify-email-page': VerifyEmailPage;
  }
}
