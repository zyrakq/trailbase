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

  private handleRetry = (): void => {
    this.dispatchEvent(
      new CustomEvent('bundle-error-retry', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <div class="status-card">
        <div class="status-icon error-icon">✕</div>
        <h2 class="status-title">${msg('Something went wrong')}</h2>
        <p class="status-message">${this.message}</p>
        <button class="btn btn-primary" @click=${this.handleRetry}>
          ${this.retryLabel}
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
