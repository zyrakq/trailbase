import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { bundleErrorStyles } from './bundle-error.styles';

@customElement('bundle-error')
@localized()
export class BundleError extends LitElement {
  @property({ type: String }) message = '';

  @property({ type: String }) retryLabel = msg('Retry');

  /*
   * When true, the retry button becomes disabled and shows a spinner in place
   * of the error icon. Consumers set this while a retry is in-flight so the
   * block stays visible and gives immediate feedback instead of being swapped
   * out for a loading skeleton.
   */
  @property({ type: Boolean }) loading = false;

  private handleRetry = (): void => {
    if (this.loading) return;
    this.dispatchEvent(
      new CustomEvent('bundle-error-retry', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <div class="status-content">
        ${this.loading
          ? html`<div class="spinner" role="status" aria-live="polite"></div>`
          : html`<div class="status-icon error-icon">✕</div>`}
        <h2 class="status-title">${msg('Something went wrong')}</h2>
        <p class="status-message">${this.message}</p>
        <button
          class="btn btn-primary"
          ?disabled=${this.loading}
          @click=${this.handleRetry}
        >
          ${this.loading ? msg('Retrying...') : this.retryLabel}
        </button>
      </div>
    `;
  }

  static styles = bundleErrorStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'bundle-error': BundleError;
  }
}
