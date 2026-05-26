import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import type { User } from '@/features/auth';

@customElement('dashboard-user-info')
@localized()
export class DashboardUserInfo extends LitElement {
  @property({ attribute: false })
  user: User | null = null;

  render() {
    if (!this.user) {
      return html`
        <div class="loading-message">
          <p>${msg('Loading user information...')}</p>
        </div>
      `;
    }

    return html`
      <div class="user-section">
        <h2>${msg('User Information')}</h2>
        <div class="user-details">
          <div class="detail-row">
            <span class="label">${msg('ID')}:</span>
            <span class="value">${this.user.id}</span>
          </div>
          ${this.user.email
            ? html`
                <div class="detail-row">
                  <span class="label">${msg('Email')}:</span>
                  <span class="value">${this.user.email}</span>
                </div>
              `
            : ''}
          ${this.user.username
            ? html`
                <div class="detail-row">
                  <span class="label">${msg('Username')}:</span>
                  <span class="value">${this.user.username}</span>
                </div>
              `
            : ''}
          ${this.user.displayName
            ? html`
                <div class="detail-row">
                  <span class="label">${msg('Display Name')}:</span>
                  <span class="value">${this.user.displayName}</span>
                </div>
              `
            : ''}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .loading-message {
      text-align: center;
      padding: 2rem;
      color: var(--theme-color-text-secondary);
      transition: color 0.2s ease;
    }

    .user-section {
      margin: 2rem 0;
    }

    .user-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0 0 1rem 0;
      transition: color 0.2s ease;
    }

    .user-details {
      background: var(--theme-color-background);
      border-radius: 6px;
      padding: 1.5rem;
      transition: background-color 0.2s ease;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--theme-color-border);
      transition: border-color 0.2s ease;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: var(--theme-color-text-secondary);
      transition: color 0.2s ease;
    }

    .value {
      color: var(--theme-color-text-primary);
      word-break: break-all;
      transition: color 0.2s ease;
    }

    @media (max-width: 640px) {
      .detail-row {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-user-info': DashboardUserInfo;
  }
}
