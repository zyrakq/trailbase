import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import type { User } from '@/features/auth';

@customElement('profile-user-card')
@localized()
export class ProfileUserCard extends LitElement {
  @property({ attribute: false })
  user: User | null = null;

  render() {
    const initials = this.user?.email
      ? this.user.email.slice(0, 2).toUpperCase()
      : '??';

    return html`
      <div class="card">
        <h1 class="card-title">${msg('Profile')}</h1>
        <div class="user-info">
          <div class="avatar" aria-hidden="true">${initials}</div>
          <div class="user-details">
            ${this.user?.displayName
              ? html`<div class="detail-row">
                  <span class="label">${msg('Name')}</span>
                  <span class="value">${this.user.displayName}</span>
                </div>`
              : ''}
            ${this.user?.email
              ? html`<div class="detail-row">
                  <span class="label">${msg('Email')}</span>
                  <span class="value">${this.user.email}</span>
                </div>`
              : ''}
            ${this.user?.username
              ? html`<div class="detail-row">
                  <span class="label">${msg('Username')}</span>
                  <span class="value">${this.user.username}</span>
                </div>`
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--theme-color-surface);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: var(--theme-shadow-md);
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary);
      margin: 0 0 1.5rem 0;
      transition: color 0.2s ease;
    }

    .user-info {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--theme-color-primary);
      color: white;
      font-size: 1.125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--theme-color-border);
      transition: border-color 0.2s ease;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-color-text-secondary);
      transition: color 0.2s ease;
    }

    .value {
      font-size: 0.9375rem;
      color: var(--theme-color-text-primary);
      word-break: break-all;
      text-align: right;
      transition: color 0.2s ease;
    }

    @media (max-width: 640px) {
      .card {
        padding: 1.5rem;
      }

      .user-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .value {
        text-align: left;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-user-card': ProfileUserCard;
  }
}
