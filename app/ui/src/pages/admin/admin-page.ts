import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import { subscriptionsService, logoSrc } from '@/features/subscriptions';
import type { Subscription } from '@/features/subscriptions';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import { adminPageStyles } from './admin-page.styles';

@customElement('admin-page')
@localized()
export class AdminPage extends LitElement {
  @state() private _items: Subscription[] = [];
  @state() private _counts: Record<string, number> = {};
  @state() private _loading = true;
  @state() private _authorized = false;

  async connectedCallback() {
    super.connectedCallback();
    await authService.init();
    this._authorized = authService.isAdmin();
    if (this._authorized) {
      await this._load();
    } else {
      this._loading = false;
    }
  }

  private async _load() {
    this._loading = true;
    try {
      const all = await subscriptionsService.getAllAdmin();
      const counts = await Promise.all(all.map(s => subscriptionsService.getSubscriberCount(s.id)));
      const next: Record<string, number> = {};
      all.forEach((s, i) => { next[s.id] = counts[i] ?? 0; });
      this._items = all;
      this._counts = next;
    } catch {
      notificationService.error(msg('Failed to load subscriptions.'));
    } finally {
      this._loading = false;
    }
  }

  private async _archive(sub: Subscription) {
    try {
      await subscriptionsService.archive(sub.id);
      notificationService.success(msg('Subscription archived.'));
      await this._load();
    } catch {
      notificationService.error(msg('Could not archive subscription.'));
    }
  }

  private async _restore(sub: Subscription) {
    try {
      await subscriptionsService.restore(sub.id);
      notificationService.success(msg('Subscription restored.'));
      await this._load();
    } catch {
      notificationService.error(msg('Could not restore subscription.'));
    }
  }

  private async _remove(sub: Subscription) {
    const count = this._counts[sub.id] ?? 0;
    if (count > 0) {
      notificationService.error(msg('Cannot delete: has active subscribers.'));
      return;
    }
    try {
      await subscriptionsService.remove(sub.id);
      notificationService.success(msg('Subscription deleted.'));
      await this._load();
    } catch {
      notificationService.error(msg('Could not delete subscription.'));
    }
  }

  private _renderLogo(sub: Subscription): TemplateResult {
    if (sub.logo_url) {
      return html`<img class="logo" src=${logoSrc(sub.logo_url, sub.updated_at)} alt=${sub.name} />`;
    }
    return html`<div class="logo-fallback" aria-hidden="true">${sub.name.charAt(0).toUpperCase()}</div>`;
  }

  private _renderRow(sub: Subscription): TemplateResult {
    const count = this._counts[sub.id] ?? 0;
    const isActive = sub.is_active;
    const isNoPricing = sub.status === 'active' && !sub.is_active;
    const hasSubscribers = count > 0;
    return html`
      <div class="row">
        ${this._renderLogo(sub)}
        <div class="name">
          <span>${sub.name}</span>
          <span class="badge ${isActive ? 'active' : isNoPricing ? 'no-pricing' : 'archived'}">
            ${isActive ? msg('Active') : isNoPricing ? msg('No pricing') : msg('Archived')}
          </span>
        </div>
        <div class="count">${msg(str`Subscribers: ${count}`)}</div>
        <div class="actions">
          <button
            class="btn btn-icon"
            title=${msg('Details')}
            aria-label=${msg('Details')}
            @click=${() => { window.location.href = `/subscription/${sub.id}`; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button
            class="btn btn-icon"
            title=${msg('Edit')}
            aria-label=${msg('Edit')}
            @click=${() => { window.location.href = `/admin/subscription/${sub.id}/edit`; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          ${sub.status === 'active'
            ? html`
              <button
                class="btn btn-icon"
                title=${msg('Archive')}
                aria-label=${msg('Archive')}
                @click=${() => this._archive(sub)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="21 8 21 21 3 21 3 8"/>
                  <rect x="1" y="3" width="22" height="5"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
              </button>`
            : html`
              <button
                class="btn btn-icon"
                title=${msg('Restore')}
                aria-label=${msg('Restore')}
                @click=${() => this._restore(sub)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.84"/>
                </svg>
              </button>`}
          <button
            class="btn btn-icon btn-danger"
            ?disabled=${hasSubscribers}
            title=${hasSubscribers ? msg('Has active subscribers') : msg('Delete')}
            aria-label=${msg('Delete')}
            @click=${() => this._remove(sub)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private _renderAccessDenied(): TemplateResult {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main">
          <div class="denied">
            <h2>${msg('Access denied')}</h2>
            <p>${msg('You need to be signed in to view this page.')}</p>
          </div>
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  render() {
    if (!this._authorized) {
      return this._renderAccessDenied();
    }

    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main">
          <div class="header">
            <h1>${msg('Subscription Catalog')}</h1>
            <div class="toolbar">
              <button class="btn btn-primary" @click=${() => { window.location.href = '/admin/subscription/new'; }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                ${msg('Add Subscription')}
              </button>
            </div>
          </div>
          ${this._loading
            ? html`<p class="loading">${msg('Loading…')}</p>`
            : this._items.length === 0
              ? html`<p class="empty">${msg('No subscriptions yet.')}</p>`
              : html`<div class="grid">${this._items.map(s => this._renderRow(s))}</div>`}
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  static styles = adminPageStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-page': AdminPage;
  }
}
