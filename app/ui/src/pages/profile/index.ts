import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import type { User } from '@/features/auth';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';

const TRAIL_AUTH_BUNDLE = '/_/auth/bundle.js';
let bundleLoaded = false;

function loadBundle(): Promise<void> {
  if (bundleLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TRAIL_AUTH_BUNDLE}"]`);
    if (existing) { bundleLoaded = true; resolve(); return; }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = TRAIL_AUTH_BUNDLE;
    script.onload = () => { bundleLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

@customElement('profile-page')
@localized()
export class ProfilePage extends LitElement {
  @state() private user: User | null = null;
  @state() private bundleReady = false;

  async connectedCallback() {
    super.connectedCallback();
    const authState = authService.getAuthState();
    this.user = authState.user;
    try {
      await loadBundle();
      await customElements.whenDefined('trail-profile');
      this.bundleReady = true;
    } catch {
      // Bundle failed to load — profile component stays hidden
    }
  }

  private async handleSignOut() {
    try {
      await authService.signOut();
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } catch {
      notificationService.error(msg('Failed to sign out. Please try again.'));
    }
  }

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">
          <div class="profile-container">
            ${this.bundleReady
              ? html`
                  <trail-profile
                    .email=${this.user?.email ?? ''}
                    ?has-mfa=${authService.getAuthState().hasMfa}
                    @trail-profile-sign-out=${this.handleSignOut}
                  ></trail-profile>
                `
              : html`<div class="skeleton"></div>`}
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
