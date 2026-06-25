import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import { subscriptionsService } from '@/features/subscriptions';
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
    this._authorized = authService.isAuthenticated();
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
      return html`<img class="logo" src=${sub.logo_url} alt=${sub.name} />`;
    }
    return html`<div class="logo-fallback" aria-hidden="true">${sub.name.charAt(0).toUpperCase()}</div>`;
  }

  private _renderRow(sub: Subscription): TemplateResult {
    const count = this._counts[sub.id] ?? 0;
    const isActive = sub.status === 'active';
    const hasSubscribers = count > 0;
    return html`
      <div class="row">
        ${this._renderLogo(sub)}
        <div class="name">
          <span>${sub.name}</span>
          <span class="badge ${sub.status}">
            ${isActive ? msg('Active') : msg('Archived')}
          </span>
        </div>
        <div class="count">${msg(str`Subscribers: ${count}`)}</div>
        <div class="actions">
          <button class="btn" @click=${() => { window.location.href = `/subscription/${sub.id}`; }}>
            ${msg('Details')}
          </button>
          <button class="btn" @click=${() => { window.location.href = `/admin/subscription/${sub.id}/edit`; }}>
            ${msg('Edit')}
          </button>
          ${isActive
            ? html`<button class="btn" @click=${() => this._archive(sub)}>${msg('Archive')}</button>`
            : html`<button class="btn" @click=${() => this._restore(sub)}>${msg('Restore')}</button>`}
          <button
            class="btn btn-danger"
            ?disabled=${hasSubscribers}
            title=${hasSubscribers ? msg('Has active subscribers') : ''}
            @click=${() => this._remove(sub)}
          >
            ${msg('Delete')}
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
