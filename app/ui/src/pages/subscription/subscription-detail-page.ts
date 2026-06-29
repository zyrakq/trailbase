import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { subscriptionsService, logoSrc, type Subscription, type UserSubscription, type SubscriptionPeriod } from '@/features/subscriptions';
import { notificationService } from '@/features/notifications';
import '@/shared';
import '@/features/subscriptions';
import { subscriptionDetailPageStyles } from './subscription-detail-page.styles';

function formatPrice(price: number, currency: string, period: SubscriptionPeriod): string {
  const suffix: Record<SubscriptionPeriod, string> = {
    monthly: msg('/mo'),
    quarterly: msg('/qr'),
    yearly: msg('/yr'),
    onetime: '',
  };
  return `${price} ${currency}${suffix[period]}`;
}

function periodLabel(period: SubscriptionPeriod): string {
  switch (period) {
    case 'monthly': return msg('Monthly');
    case 'quarterly': return msg('Quarterly');
    case 'yearly': return msg('Yearly');
    case 'onetime': return msg('One-time');
  }
}

@customElement('subscription-detail-page')
@localized()
export class SubscriptionDetailPage extends LitElement {
  @property() subscriptionId = '';
  @state() private _subscription: Subscription | null = null;
  @state() private _userSubscription: UserSubscription | null = null;
  @state() private _isAdmin = false;
  @state() private _loading = true;
  @state() private _notFound = false;
  @state() private _cancelling = false;
  @state() private _selectedPeriod: SubscriptionPeriod | null = null;
  private _activatingPoll: ReturnType<typeof setInterval> | null = null;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await authService.init();
    // TODO: expose isAdmin() from auth feature when admin flag is available from backend
    this._isAdmin = authService.isAdmin();
    try {
      const [sub, userSubs] = await Promise.all([
        subscriptionsService.getById(this.subscriptionId),
        authService.isAuthenticated() ? subscriptionsService.getUserSubscriptions() : Promise.resolve([]),
      ]);
      if (!sub) {
        this._notFound = true;
      } else {
        this._subscription = sub;
        const active = sub.pricing.filter(p => !p.is_archived);
        this._selectedPeriod = active[0]?.period ?? null;
        this._userSubscription = userSubs.find(u => u.subscription_id === sub.id) ?? null;
      }
    } catch {
      this._notFound = true;
    } finally {
      this._loading = false;
    }

    this._maybeStartActivatingPoll();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._activatingPoll !== null) {
      clearInterval(this._activatingPoll);
      this._activatingPoll = null;
    }
  }

  private _maybeStartActivatingPoll(): void {
    if (this._userSubscription?.status !== 'activating') return;
    if (this._activatingPoll !== null) return;

    this._activatingPoll = setInterval(async () => {
      if (!this._subscription) return;
      try {
        const subs = await subscriptionsService.getUserSubscriptions();
        const match = subs.find(u => u.subscription_id === this._subscription!.id);
        if (match) {
          this._userSubscription = match;
        }
        if (match?.status !== 'activating') {
          clearInterval(this._activatingPoll!);
          this._activatingPoll = null;
        }
      } catch {
        // Ignore transient errors.
      }
    }, 5000);
  }

  private _goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }

  private async _cancel(): Promise<void> {
    if (!this._userSubscription) return;
    this._cancelling = true;
    try {
      await subscriptionsService.cancel(this._userSubscription.id);
      notificationService.success(msg('Subscription cancelled.'));
      this._userSubscription = { ...this._userSubscription, status: 'cancelled' };
    } catch {
      notificationService.error(msg('Could not cancel. Please try again.'));
    } finally {
      this._cancelling = false;
    }
  }

  private _openSubscribeModal(): void {
    const modal = this.shadowRoot?.querySelector('confirm-subscribe-modal') as HTMLElement & { show: (s: Subscription, p?: SubscriptionPeriod) => void } | null;
    if (modal && this._subscription) {
      modal.show(this._subscription, this._selectedPeriod ?? undefined);
    }
  }

  private _handleSubscribed(): void {
    void subscriptionsService.getUserSubscriptions().then(subs => {
      if (this._subscription) {
        this._userSubscription = subs.find(u => u.subscription_id === this._subscription!.id) ?? null;
      }
      this._maybeStartActivatingPoll();
    });
  }

  render() {
    return html`
      <app-header></app-header>
      <main class="page-content">
        ${this._loading
          ? html`<p class="loading">${msg('Loading…')}</p>`
          : this._notFound
            ? this._renderNotFound()
            : this._renderDetail()}
      </main>
    `;
  }

  private _renderNotFound() {
    return html`
      <div class="not-found">
        <p>${msg('Subscription not found.')}</p>
        <button class="btn-back" @click=${this._goBack}>${msg('Go back')}</button>
      </div>
    `;
  }

  private _renderDetail() {
    const sub = this._subscription!;
    const hasActive = this._userSubscription?.status === 'active';
    const hasCancelled = this._userSubscription?.status === 'cancelled';
    const hasActivating = this._userSubscription?.status === 'activating';
    const hasFailed = this._userSubscription?.status === 'activation_failed';
    const activePricing = sub.pricing.filter(p => !p.is_archived);
    const isAuthenticated = authService.isAuthenticated();

    return html`
      <div class="detail-wrapper">
        <div class="back-row">
          <button class="btn-back" @click=${this._goBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            ${msg('Back')}
          </button>
          ${this._isAdmin ? html`
            <a class="btn-edit" href=${`/admin/subscription/${sub.id}/edit`}>${msg('Edit')}</a>
          ` : null}
        </div>

        <div class="detail-card">
          <div class="logo-hero">
            ${sub.logo_url
              ? html`<img class="logo-img" src=${logoSrc(sub.logo_url, sub.updated_at)} alt=${sub.name} />`
              : html`<div class="logo-letter">${sub.name.charAt(0).toUpperCase()}</div>`}
          </div>

          <div class="detail-body">
            <div class="title-row">
              <h1 class="title">${sub.name}</h1>
              ${sub.status === 'archived' ? html`<span class="badge-archived">${msg('Archived')}</span>` : null}
              ${hasActive ? html`<span class="badge-active">${msg('Active')}</span>` : null}
              ${hasActivating ? html`
                <span class="badge-activating">
                  <span class="badge-spinner" aria-hidden="true"></span>
                  ${msg('Activating')}
                </span>
              ` : nothing}
              ${hasFailed ? html`<span class="badge-failed">${msg('Activation failed')}</span>` : nothing}
              ${hasCancelled ? html`<span class="badge-cancelled">${msg('Cancelled')}</span>` : nothing}
            </div>

            <p class="description">${sub.description}</p>

            ${activePricing.length > 0 ? html`
              <div class="pricing-section">
                <h2 class="section-heading">${msg('Pricing')}</h2>
                <div class="pricing-table">
                  ${activePricing.map(p => html`
                    <div
                      class="pricing-row ${this._selectedPeriod === p.period ? 'selected' : ''}"
                      @click=${() => { this._selectedPeriod = p.period; }}
                    >
                      <span class="period-name">${periodLabel(p.period)}</span>
                      <span class="price-value">${formatPrice(p.price, p.currency, p.period)}</span>
                    </div>
                  `)}
                </div>
              </div>
            ` : null}

            ${sub.what_included ? html`
              <div class="section">
                <h2 class="section-heading">${msg("What's included")}</h2>
                <p class="section-text">${sub.what_included}</p>
              </div>
            ` : null}

            ${sub.terms ? html`
              <div class="section">
                <h2 class="section-heading">${msg('Terms')}</h2>
                <p class="section-text">${sub.terms}</p>
              </div>
            ` : null}

            ${hasActive && sub.resource_url ? html`
              <div class="access-section">
                <a href=${sub.resource_url} target="_blank" rel="noopener" class="btn-access">
                  ${msg('Open')} ${sub.name} ↗
                </a>
              </div>
            ` : nothing}

            ${isAuthenticated && sub.status === 'active' ? html`
              <div class="cta-row">
                ${hasActive
                  ? html`
                    <button class="btn-cancel" @click=${this._cancel} ?disabled=${this._cancelling}>
                      ${this._cancelling ? msg('Cancelling…') : msg('Cancel subscription')}
                    </button>
                  `
                  : !hasActivating
                    ? html`
                      <button class="btn-subscribe" @click=${this._openSubscribeModal}>
                        ${msg('Subscribe')}
                      </button>
                    `
                    : nothing}
              </div>
              <confirm-subscribe-modal @subscription-subscribed=${this._handleSubscribed}></confirm-subscribe-modal>
            ` : null}

            ${!isAuthenticated ? html`<p class="sign-in-hint">${msg('Sign in to subscribe.')}</p>` : nothing}
            ${sub.status === 'archived' ? html`<p class="archived-notice">${msg('This subscription is no longer available.')}</p>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  static styles = subscriptionDetailPageStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'subscription-detail-page': SubscriptionDetailPage;
  }
}
