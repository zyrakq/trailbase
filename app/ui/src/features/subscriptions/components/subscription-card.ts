import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { notificationService } from '@/features/notifications';
import type { Subscription, SubscriptionPeriod, SubscriptionPricing, UserSubscription } from '../types/subscription.types.ts';
import { subscriptionsService } from '../services/subscriptions.service.ts';
import { logoSrc } from '../utils/logo-src.ts';
import { subscriptionCardStyles } from './subscription-card.styles';
import type { ConfirmSubscribeModal } from './confirm-subscribe-modal';
import './confirm-subscribe-modal';

function getDisplayPricing(
  pricing: SubscriptionPricing[],
  period: SubscriptionPeriod | 'all'
): SubscriptionPricing | undefined {
  const active = pricing.filter(p => !p.is_archived);
  if (active.length === 0) return undefined;
  if (period === 'all') {
    return active.find(p => p.period === 'monthly') ?? [...active].sort((a, b) => a.price - b.price)[0];
  }
  return active.find(p => p.period === period);
}

function formatPrice(p: SubscriptionPricing): string {
  const suffix: Record<SubscriptionPeriod, string> = {
    monthly: '/mo',
    quarterly: '/qr',
    yearly: '/yr',
    onetime: '',
  };
  return `${p.price} ${p.currency}${suffix[p.period]}`;
}

@customElement('subscription-card')
@localized()
export class SubscriptionCard extends LitElement {
  @property({ attribute: false }) subscription!: Subscription;
  @property({ attribute: false }) userSubscription?: UserSubscription;
  @property() mode: 'user' | 'catalog' = 'catalog';
  @property() selectedPeriod: SubscriptionPeriod | 'all' = 'all';
  @state() private _loading = false;

  @query('confirm-subscribe-modal')
  private _confirmModal!: ConfirmSubscribeModal;

  private _openDetail(): void {
    window.location.href = `/subscription/${this.subscription.id}`;
  }

  private _openService(): void {
    const url = this.subscription.resource_url;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private _openSubscribeModal(): void {
    const period = this.selectedPeriod === 'all' ? undefined : this.selectedPeriod;
    this._confirmModal.show(this.subscription, period);
  }

  private async _cancel(): Promise<void> {
    const userSub = this.userSubscription;
    if (!userSub) return;
    this._loading = true;
    try {
      await subscriptionsService.cancel(userSub.id);
      notificationService.success(msg('Subscription cancelled.'));
      this.dispatchEvent(new CustomEvent('subscription-cancelled', {
        detail: { userSubscriptionId: userSub.id },
        bubbles: true,
        composed: true,
      }));
    } catch {
      notificationService.error(msg('Could not cancel. Please try again.'));
    } finally {
      this._loading = false;
    }
  }

  private _renderActions(): TemplateResult {
    const sub = this.subscription;
    const hasActive = this.userSubscription?.status === 'active';
    const isUserMode = this.mode === 'user';

    return html`
      <div class="actions">
        ${isUserMode && hasActive
          ? html`
            <button
              class="icon-btn danger"
              title=${msg('Cancel subscription')}
              aria-label=${msg('Cancel subscription')}
              ?disabled=${this._loading}
              @click=${this._cancel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </button>
          `
          : html`
            <button
              class="icon-btn primary"
              title=${msg('Subscribe')}
              aria-label=${msg('Subscribe')}
              ?disabled=${this._loading}
              @click=${this._openSubscribeModal}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
          `}
        ${sub.resource_url
          ? html`
            <button
              class="icon-btn"
              title=${msg('Open service')}
              aria-label=${msg('Open service')}
              @click=${this._openService}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
          `
          : null}
        <button
          class="icon-btn"
          title=${msg('Details')}
          aria-label=${msg('Details')}
          @click=${this._openDetail}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </button>
      </div>
      <confirm-subscribe-modal></confirm-subscribe-modal>
    `;
  }

  render() {
    const sub = this.subscription;
    if (!sub) return html``;
    const hasActive = this.userSubscription?.status === 'active';
    const displayPricing = getDisplayPricing(sub.pricing, this.selectedPeriod);

    return html`
      <div class="card">
        <div class="logo-hero">
${sub.logo_url
? html`<img class="logo-img" src=${logoSrc(sub.logo_url, sub.updated_at)} alt=${sub.name} />`
: html`<div class="logo-letter">${sub.name.charAt(0).toUpperCase()}</div>`}
        </div>
        <div class="card-footer">
          <div class="name-row">
            <span class="name">${sub.name}</span>
            ${hasActive ? html`<span class="badge-active">${msg('Active')}</span>` : null}
          </div>
          ${displayPricing
            ? html`<span class="price-chip">${formatPrice(displayPricing)}</span>`
            : null}
          ${this._renderActions()}
        </div>
      </div>
    `;
  }

  static styles = subscriptionCardStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'subscription-card': SubscriptionCard;
  }
}
