import { LitElement, css, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import type { User } from '@/features/auth';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import { bundleLoader } from '@/shared';
import type { BundleStatus } from '@/shared';
import '@/shared/components/bundle-error';

@customElement('profile-page')
@localized()
export class ProfilePage extends LitElement {
  @state() private user: User | null = null;
  @state() private bundleStatus: BundleStatus = bundleLoader.getStatus();
  /*
   * True while a retry is in-flight after an error. Keeps the error block
   * visible with a loading indicator instead of snapping back to the
   * first-load skeleton.
   */
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
    const authState = authService.getAuthState();
    this.user = authState.user;
    this.bundleStatus = bundleLoader.getStatus();
    window.addEventListener('bundle-status-changed', this.handleBundleStatusChanged);
    bundleLoader.loadTrailAuth();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('bundle-status-changed', this.handleBundleStatusChanged);
  }

  private async handleSignOut() {
    try {
      await authService.signOut();
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } catch {
      notificationService.error(msg('Failed to sign out. Please try again.'));
    }
  }

  private handleAccountDeleted() {
    // The delete endpoint invalidated the auth cookie server-side. Redirect to
    // the landing page; the normal unauthenticated flow takes over from there.
    window.location.href = '/';
  }

  private renderProfileContent(): TemplateResult {
    if (this.bundleStatus === 'ready') {
      return html`
        <trail-profile
          .email=${this.user?.email ?? ''}
          ?has-mfa=${authService.getAuthState().hasMfa}
          @trail-profile-sign-out=${this.handleSignOut}
          @trail-profile-account-deleted=${this.handleAccountDeleted}
        ></trail-profile>
      `;
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
          <div class="profile-container">
            ${this.renderProfileContent()}
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
    }

    .skeleton {
      height: 200px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--theme-color-text-primary) 8%, transparent);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 640px) {
      .main-content { padding: 1.5rem 1rem; }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-page': ProfilePage;
  }
}
