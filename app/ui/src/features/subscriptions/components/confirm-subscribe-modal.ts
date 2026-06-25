import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg, str } from '@lit/localize';
import { localized } from '@/features/localization';
import { notificationService } from '@/features/notifications';
import type { Subscription, SubscriptionPeriod, SubscriptionPricing } from '../types/subscription.types.ts';
import { subscriptionsService } from '../services/subscriptions.service.ts';
import { confirmSubscribeModalStyles } from './confirm-subscribe-modal.styles';

function periodLabel(period: SubscriptionPeriod): string {
  switch (period) {
    case 'monthly': return msg('Monthly');
    case 'quarterly': return msg('Quarterly');
    case 'yearly': return msg('Yearly');
    case 'onetime': return msg('One-time');
  }
}

function formatPrice(pricing: SubscriptionPricing): string {
  const suffixMap: Record<SubscriptionPeriod, string> = {
    monthly: msg('/mo'),
    quarterly: msg('/qr'),
    yearly: msg('/yr'),
    onetime: '',
  };
  return `${pricing.price} ${pricing.currency}${suffixMap[pricing.period]}`;
}

@customElement('confirm-subscribe-modal')
@localized()
export class ConfirmSubscribeModal extends LitElement {
  @state() private _open = false;
  @state() private _subscription: Subscription | null = null;
  @state() private _selectedPeriod: SubscriptionPeriod | null = null;
  @state() private _loading = false;

  show(subscription: Subscription, preselectedPeriod?: SubscriptionPeriod): void {
    this._subscription = subscription;
    const activePricing = subscription.pricing.filter(p => !p.is_archived);
    if (preselectedPeriod && activePricing.some(p => p.period === preselectedPeriod)) {
      this._selectedPeriod = preselectedPeriod;
    } else {
      this._selectedPeriod = activePricing[0]?.period ?? null;
    }
    this._open = true;
    this._loading = false;
  }

  private _close(): void {
    this._open = false;
  }

  private async _confirm(): Promise<void> {
    if (!this._subscription || !this._selectedPeriod) return;
    this._loading = true;
    try {
      await subscriptionsService.subscribe(this._subscription.id, this._selectedPeriod);
      notificationService.success(msg(str`Subscribed to ${this._subscription.name}`));
      this.dispatchEvent(new CustomEvent('subscription-subscribed', {
        detail: { subscriptionId: this._subscription.id, period: this._selectedPeriod },
        bubbles: true,
        composed: true,
      }));
      this._close();
    } catch {
      notificationService.error(msg('Could not subscribe. Please try again.'));
    } finally {
      this._loading = false;
    }
  }

  render() {
    if (!this._open || !this._subscription) return html``;
    const sub = this._subscription;
    const activePricing = sub.pricing.filter(p => !p.is_archived);
    const selectedPricing = activePricing.find(p => p.period === this._selectedPeriod);

    return html`
      <div class="overlay" @click=${this._close}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()} role="dialog" aria-modal="true">
          <h2 class="title">${msg('Subscribe')}</h2>
          <p class="sub-name">${sub.name}</p>

          ${activePricing.length > 1 ? html`
            <fieldset class="period-group">
              <legend class="period-label">${msg('Billing period')}</legend>
              ${activePricing.map(p => html`
                <label class="period-option ${this._selectedPeriod === p.period ? 'selected' : ''}">
                  <input
                    type="radio"
                    name="period"
                    .value=${p.period}
                    .checked=${this._selectedPeriod === p.period}
                    @change=${() => { this._selectedPeriod = p.period; }}
                  />
                  <span class="period-name">${periodLabel(p.period)}</span>
                  <span class="period-price">${formatPrice(p)}</span>
                </label>
              `)}
            </fieldset>
          ` : selectedPricing ? html`
            <p class="price-single">${formatPrice(selectedPricing)}</p>
          ` : null}

          <div class="actions">
            <button class="btn-cancel" @click=${this._close} ?disabled=${this._loading}>
              ${msg('Cancel')}
            </button>
            <button class="btn-confirm" @click=${this._confirm} ?disabled=${this._loading || !this._selectedPeriod}>
              ${this._loading ? msg('Subscribing…') : msg('Subscribe')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = confirmSubscribeModalStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'confirm-subscribe-modal': ConfirmSubscribeModal;
  }
}
