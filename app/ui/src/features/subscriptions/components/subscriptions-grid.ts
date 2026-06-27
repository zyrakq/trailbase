import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { notificationService } from '@/features/notifications';
import { subscriptionsService } from '../services/subscriptions.service.ts';
import type { SubscriptionPeriod, SubscriptionWithUserSub } from '../types/subscription.types.ts';
import { subscriptionsGridStyles } from './subscriptions-grid.styles';
import './subscription-card';

@customElement('subscriptions-grid')
@localized()
export class SubscriptionsGrid extends LitElement {
  @property() mode: 'user' | 'all' = 'all';
  @property() selectedPeriod: SubscriptionPeriod | 'all' = 'all';
  @state() private _loading = true;
  @state() private _items: SubscriptionWithUserSub[] = [];
  @state() private _error = false;

  private _hasLoaded = false;

  private _handleSubscribed = (): void => {
    void this._load();
  };

  private _handleCancelled = (): void => {
    void this._load();
  };

  async connectedCallback() {
    super.connectedCallback();
    await this._load();
    this._hasLoaded = true;
    this.addEventListener('subscription-subscribed', this._handleSubscribed);
    this.addEventListener('subscription-cancelled', this._handleCancelled);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('subscription-subscribed', this._handleSubscribed);
    this.removeEventListener('subscription-cancelled', this._handleCancelled);
  }

  willUpdate(changed: Map<string, unknown>) {
    if (this._hasLoaded && changed.has('mode') && !this._loading) {
      this._loading = true;
      this._error = false;
      void this._load();
    }
  }

  private async _load() {
    this._loading = true;
    this._error = false;
    try {
      const [userSubs, data] = await Promise.all([
        subscriptionsService.getUserSubscriptions(),
        this.mode === 'user'
          ? subscriptionsService.getMine()
          : subscriptionsService.getCatalog(),
      ]);
      this._items = data.subscriptions.map(s => ({
        ...s,
        userSubscription: userSubs.find(u => u.subscription_id === s.id),
      }));
      this.dispatchEvent(
        new CustomEvent<SubscriptionPeriod[]>('periods-loaded', {
          detail: data.availablePeriods,
          bubbles: true,
          composed: true,
        })
      );
    } catch {
      this._error = true;
      notificationService.error(msg('Failed to load subscriptions.'));
    } finally {
      this._loading = false;
    }
  }

  private get _visibleItems(): SubscriptionWithUserSub[] {
    if (this.selectedPeriod === 'all') return this._items;
    return this._items.filter(item =>
      item.pricing.some(p => p.period === this.selectedPeriod && !p.is_archived)
    );
  }

  private _onShowAll = (): void => {
    this.dispatchEvent(new CustomEvent('mode-change', { detail: 'all', bubbles: true, composed: true }));
  };

  render() {
    return this._renderBody();
  }

  private _renderBody(): TemplateResult {
    if (this._loading) {
      return html`
        <div class="grid">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
        </div>
      `;
    }
    if (this._error || (this.mode === 'user' && this._items.length === 0)) {
      return html`
        <p class="empty">
          ${msg('You have no active subscriptions.')}
          <button class="link" @click=${this._onShowAll}>
            ${msg('Browse available services.')}
          </button>
        </p>
      `;
    }
    const visible = this._visibleItems;
    if (visible.length === 0) {
      return html`<p class="empty">${msg('No subscriptions available for this period.')}</p>`;
    }
    return html`
      <div class="grid">
        ${visible.map(item => html`
          <subscription-card
            .subscription=${item}
            .userSubscription=${item.userSubscription}
            .selectedPeriod=${this.selectedPeriod}
            mode=${this.mode}
          ></subscription-card>
        `)}
      </div>
    `;
  }

  static styles = subscriptionsGridStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'subscriptions-grid': SubscriptionsGrid;
  }
}
