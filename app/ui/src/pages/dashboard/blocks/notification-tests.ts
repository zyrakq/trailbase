import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';

export type NotificationTestPayload = {
  type: 'success' | 'error' | 'warning' | 'info';
  long: boolean;
};

@customElement('dashboard-notification-tests')
@localized()
export class DashboardNotificationTests extends LitElement {
  private emit(type: NotificationTestPayload['type'], long: boolean) {
    this.dispatchEvent(
      new CustomEvent<NotificationTestPayload>('test-notification', {
        detail: { type, long },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="test-section">
        <h2>${msg('Test Notifications')}</h2>
        <p class="test-description">
          ${msg('Click buttons below to test different notification types')}
        </p>
        <div class="test-buttons">
          <button class="btn btn-success" @click=${() => this.emit('success', false)}>
            ${msg('Success')}
          </button>
          <button class="btn btn-error" @click=${() => this.emit('error', false)}>
            ${msg('Error')}
          </button>
          <button class="btn btn-warning" @click=${() => this.emit('warning', false)}>
            ${msg('Warning')}
          </button>
          <button class="btn btn-info" @click=${() => this.emit('info', false)}>
            ${msg('Info')}
          </button>
        </div>
      </div>

      <div class="test-section">
        <h2>${msg('Test Long Notifications')}</h2>
        <p class="test-description">
          ${msg('Click to test notifications with long messages (clickable to see full text)')}
        </p>
        <div class="test-buttons">
          <button class="btn btn-success" @click=${() => this.emit('success', true)}>
            ${msg('Long Success')}
          </button>
          <button class="btn btn-error" @click=${() => this.emit('error', true)}>
            ${msg('Long Error')}
          </button>
          <button class="btn btn-warning" @click=${() => this.emit('warning', true)}>
            ${msg('Long Warning')}
          </button>
          <button class="btn btn-info" @click=${() => this.emit('info', true)}>
            ${msg('Very Long Info')}
          </button>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .test-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: var(--theme-color-background);
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .test-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0 0 0.5rem 0;
      transition: color 0.2s ease;
    }

    .test-description {
      font-size: 0.875rem;
      color: var(--theme-color-text-secondary);
      margin: 0 0 1rem 0;
      transition: color 0.2s ease;
    }

    .test-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.75rem 2rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-family: inherit;
    }

    .btn-success { background: var(--theme-color-success); color: white; }
    .btn-success:hover { background: color-mix(in srgb, var(--theme-color-success) 85%, black); }
    .btn-success:active { background: color-mix(in srgb, var(--theme-color-success) 70%, black); }

    .btn-error { background: var(--theme-color-error); color: white; }
    .btn-error:hover { background: color-mix(in srgb, var(--theme-color-error) 85%, black); }
    .btn-error:active { background: color-mix(in srgb, var(--theme-color-error) 70%, black); }

    .btn-warning { background: var(--theme-color-warning); color: white; }
    .btn-warning:hover { background: color-mix(in srgb, var(--theme-color-warning) 85%, black); }
    .btn-warning:active { background: color-mix(in srgb, var(--theme-color-warning) 70%, black); }

    .btn-info { background: var(--theme-color-info); color: white; }
    .btn-info:hover { background: color-mix(in srgb, var(--theme-color-info) 85%, black); }
    .btn-info:active { background: color-mix(in srgb, var(--theme-color-info) 70%, black); }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-notification-tests': DashboardNotificationTests;
  }
}
