import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authModalStyles } from './auth-modal.styles';
import { configService } from '@/features/auth/services/config.service';
import { authService } from '../services/auth.service';

// trail-auth bundle is loaded lazily on first open via a <script> tag.
// The bundle URL is served by the trail-auth-component WASM.
const TRAIL_AUTH_BUNDLE = '/_/auth/bundle.js';

let bundleLoaded = false;

function loadTrailAuthBundle(): Promise<void> {
  if (bundleLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${TRAIL_AUTH_BUNDLE}"]`
    );
    if (existing) {
      bundleLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = TRAIL_AUTH_BUNDLE;
    script.onload = () => {
      bundleLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

@customElement('auth-modal')
@localized()
export class AuthModal extends LitElement {
  @state() private isOpen = false;
  @state() private bundleReady = false;

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

    if (!this.bundleReady) {
      loadTrailAuthBundle()
        .then(() => customElements.whenDefined('trail-auth'))
        .then(() => {
          this.bundleReady = true;
          // Reset trail-auth state if already in DOM.
          const el = this.shadowRoot?.querySelector('trail-auth') as
            | (HTMLElement & { reset?: () => void })
            | null;
          el?.reset?.();
        })
        .catch(() => {
          // Bundle load failure is non-fatal — the component won't render but
          // the host app remains functional.
        });
    } else {
      // Bundle already loaded — reset view state.
      const el = this.shadowRoot?.querySelector('trail-auth') as
        | (HTMLElement & { reset?: () => void })
        | null;
      el?.reset?.();
    }
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

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';
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
        @trail-auth-success=${this.handleAuthSuccess}
        @trail-auth-close=${this.handleClose}
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
          <div class="modal-content">
            ${this.bundleReady
              ? html`<trail-auth
                  ?no-password-auth=${!this.passwordAuthEnabled}
                  ?no-registration=${!this.registrationEnabled}
                ></trail-auth>`
              : html`
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
                `}
          </div>
        </div>
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
