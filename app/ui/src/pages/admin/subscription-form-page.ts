import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import {
  subscriptionsService,
  type SubscriptionInput,
  type SubscriptionPeriod,
  type SubscriptionPricing,
} from '@/features/subscriptions';
import '@/shared';
import { subscriptionFormPageStyles } from './subscription-form-page.styles';

type ViewMode = 'edit' | 'preview';

const PERIODS: SubscriptionPeriod[] = ['monthly', 'quarterly', 'yearly', 'onetime'];

function periodLabel(period: SubscriptionPeriod): string {
  switch (period) {
    case 'monthly': return msg('Monthly');
    case 'quarterly': return msg('Quarterly');
    case 'yearly': return msg('Yearly');
    case 'onetime': return msg('One-time');
  }
}

interface PricingEntry {
  period: SubscriptionPeriod;
  price: number;
  currency: string;
  id?: string;
  is_archived?: boolean;
}

@customElement('subscription-form-page')
@localized()
export class SubscriptionFormPage extends LitElement {
  @property() subscriptionId = '';
  @state() private _viewMode: ViewMode = 'edit';
  @state() private _loading = true;
  @state() private _saving = false;

  @state() private _name = '';
  @state() private _description = '';
  @state() private _logoUrl = '';
  @state() private _resourceUrl = '';
  @state() private _whatIncluded = '';
  @state() private _terms = '';
  @state() private _pricing: PricingEntry[] = [];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await authService.init();
    if (!authService.isAdmin()) {
      window.location.href = '/';
      return;
    }
    if (this.subscriptionId) {
      try {
        const sub = await subscriptionsService.getById(this.subscriptionId);
        if (sub) {
          this._name = sub.name;
          this._description = sub.description;
          this._logoUrl = sub.logo_url;
          this._resourceUrl = sub.resource_url;
          this._whatIncluded = sub.what_included ?? '';
          this._terms = sub.terms ?? '';
          this._pricing = sub.pricing.filter(p => !p.is_archived).map(p => ({ ...p }));
        }
      } catch {
        notificationService.error(msg('Failed to load subscription.'));
      }
    }
    this._loading = false;
  }

  private _goBack(): void {
    window.location.href = '/admin';
  }

  private _addPricingTier(): void {
    const usedPeriods = new Set(this._pricing.map(p => p.period));
    const available = PERIODS.find(p => !usedPeriods.has(p));
    if (!available) return;
    this._pricing = [...this._pricing, { period: available, price: 0, currency: 'RUB' }];
  }

  private _removePricingTier(index: number): void {
    this._pricing = this._pricing.filter((_, i) => i !== index);
  }

  private _updatePricingTier(index: number, field: keyof PricingEntry, value: string | number): void {
    this._pricing = this._pricing.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
  }

  private async _save(): Promise<void> {
    if (!this._name.trim()) {
      notificationService.error(msg('Name is required.'));
      return;
    }
    this._saving = true;
    const input: SubscriptionInput = {
      name: this._name.trim(),
      description: this._description.trim(),
      logo_url: this._logoUrl.trim(),
      resource_url: this._resourceUrl.trim(),
      what_included: this._whatIncluded.trim() || undefined,
      terms: this._terms.trim() || undefined,
      pricing: this._pricing.filter(p => p.price > 0).map(p => ({
        period: p.period,
        price: p.price,
        currency: p.currency,
      })),
    };
    try {
      if (this.subscriptionId) {
        await subscriptionsService.update(this.subscriptionId, input);
        notificationService.success(msg('Subscription updated.'));
      } else {
        await subscriptionsService.create(input);
        notificationService.success(msg('Subscription created.'));
      }
      window.location.href = '/admin';
    } catch {
      notificationService.error(msg('Failed to save. Please try again.'));
    } finally {
      this._saving = false;
    }
  }

  render() {
    return html`
      <app-header></app-header>
      <main class="page-content">
        ${this._loading ? html`<p class="loading">${msg('Loading…')}</p>` : this._renderForm()}
      </main>
    `;
  }

  private _renderForm(): TemplateResult {
    const isEdit = Boolean(this.subscriptionId);
    return html`
      <div class="form-wrapper">
        <div class="top-bar">
          <button class="btn-back" @click=${this._goBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            ${msg('Back to Admin')}
          </button>
          <div class="mode-toggle">
            <button
              class="mode-btn ${this._viewMode === 'edit' ? 'active' : ''}"
              @click=${() => { this._viewMode = 'edit'; }}
            >${msg('Edit')}</button>
            <button
              class="mode-btn ${this._viewMode === 'preview' ? 'active' : ''}"
              @click=${() => { this._viewMode = 'preview'; }}
            >${msg('Preview')}</button>
          </div>
        </div>

        <h1 class="page-title">
          ${isEdit ? msg('Edit Subscription') : msg('New Subscription')}
        </h1>

        ${this._viewMode === 'edit' ? this._renderEditForm() : this._renderPreview()}
      </div>
    `;
  }

  private _renderEditForm(): TemplateResult {
    const usedPeriods = new Set(this._pricing.map(p => p.period));
    const canAddMore = usedPeriods.size < PERIODS.length;

    return html`
      <form class="form" @submit=${(e: Event) => { e.preventDefault(); void this._save(); }}>
        <div class="field">
          <label class="label" for="name">${msg('Name')} *</label>
          <input
            id="name"
            class="input"
            type="text"
            .value=${this._name}
            @input=${(e: InputEvent) => { this._name = (e.target as HTMLInputElement).value; }}
            required
          />
        </div>

        <div class="field">
          <label class="label" for="description">${msg('Description')}</label>
          <textarea
            id="description"
            class="input textarea"
            .value=${this._description}
            @input=${(e: InputEvent) => { this._description = (e.target as HTMLTextAreaElement).value; }}
            rows="3"
          ></textarea>
        </div>

        <div class="field">
          <label class="label" for="logo_url">${msg('Logo URL')}</label>
          <div class="logo-input-row">
            <input
              id="logo_url"
              class="input"
              type="url"
              .value=${this._logoUrl}
              @input=${(e: InputEvent) => { this._logoUrl = (e.target as HTMLInputElement).value; }}
              placeholder="https://..."
            />
            ${this._logoUrl ? html`<img class="logo-preview" src=${this._logoUrl} alt="Logo preview" />` : null}
          </div>
        </div>

        <div class="field">
          <label class="label" for="resource_url">${msg('Resource URL')}</label>
          <input
            id="resource_url"
            class="input"
            type="url"
            .value=${this._resourceUrl}
            @input=${(e: InputEvent) => { this._resourceUrl = (e.target as HTMLInputElement).value; }}
            placeholder="https://..."
          />
        </div>

        <div class="field">
          <label class="label" for="what_included">${msg("What's included")}</label>
          <textarea
            id="what_included"
            class="input textarea"
            .value=${this._whatIncluded}
            @input=${(e: InputEvent) => { this._whatIncluded = (e.target as HTMLTextAreaElement).value; }}
            rows="4"
          ></textarea>
        </div>

        <div class="field">
          <label class="label" for="terms">${msg('Terms')}</label>
          <textarea
            id="terms"
            class="input textarea"
            .value=${this._terms}
            @input=${(e: InputEvent) => { this._terms = (e.target as HTMLTextAreaElement).value; }}
            rows="3"
          ></textarea>
        </div>

        <div class="field">
          <div class="pricing-header">
            <span class="label">${msg('Pricing')}</span>
            ${canAddMore ? html`
              <button type="button" class="btn-add-tier" @click=${this._addPricingTier}>
                + ${msg('Add period')}
              </button>
            ` : null}
          </div>
          ${this._pricing.length === 0 ? html`
            <p class="pricing-empty">${msg('No pricing tiers. Add one above.')}</p>
          ` : null}
          ${this._pricing.map((p, i) => html`
            <div class="pricing-tier">
              <select
                class="select period-select"
                .value=${p.period}
                @change=${(e: Event) => {
                  this._updatePricingTier(i, 'period', (e.target as HTMLSelectElement).value as SubscriptionPeriod);
                }}
              >
                ${PERIODS.map(period => html`
                  <option
                    value=${period}
                    ?selected=${p.period === period}
                    ?disabled=${usedPeriods.has(period) && p.period !== period}
                  >${periodLabel(period)}</option>
                `)}
              </select>
              <input
                class="input price-input"
                type="number"
                min="0"
                .value=${String(p.price)}
                @input=${(e: InputEvent) => {
                  this._updatePricingTier(i, 'price', Number((e.target as HTMLInputElement).value));
                }}
              />
              <input
                class="input currency-input"
                type="text"
                maxlength="3"
                .value=${p.currency}
                @input=${(e: InputEvent) => {
                  this._updatePricingTier(i, 'currency', (e.target as HTMLInputElement).value.toUpperCase());
                }}
              />
              <button
                type="button"
                class="btn-remove-tier"
                title=${msg('Remove')}
                aria-label=${msg('Remove pricing tier')}
                @click=${() => this._removePricingTier(i)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                  <path d="M10 11v6M14 11v6"></path>
                </svg>
              </button>
            </div>
          `)}
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click=${this._goBack}>
            ${msg('Cancel')}
          </button>
          <button type="submit" class="btn-primary" ?disabled=${this._saving}>
            ${this._saving ? msg('Saving…') : msg('Save')}
          </button>
        </div>
      </form>
    `;
  }

  private _renderPreview(): TemplateResult {
    const activePricing: SubscriptionPricing[] = this._pricing
      .filter(p => p.price > 0)
      .map((p, i) => ({ id: p.id ?? `preview-${i}`, subscription_id: 'preview', period: p.period, price: p.price, currency: p.currency, is_archived: false }));

    return html`
      <div class="preview-wrapper">
        <div class="detail-card">
          <div class="logo-hero">
            ${this._logoUrl
              ? html`<img class="logo-img" src=${this._logoUrl} alt=${this._name || msg('Preview')} />`
              : html`<div class="logo-letter">${(this._name || '?').charAt(0).toUpperCase()}</div>`}
          </div>
          <div class="detail-body">
            <div class="title-row">
              <h1 class="title">${this._name || html`<em>${msg('Untitled')}</em>`}</h1>
            </div>
            <p class="description">${this._description || html`<em>${msg('No description')}</em>`}</p>

            ${activePricing.length > 0 ? html`
              <div class="section">
                <h2 class="section-heading">${msg('Pricing')}</h2>
                <div class="pricing-table">
                  ${activePricing.map(p => html`
                    <div class="pricing-row">
                      <span>${periodLabel(p.period)}</span>
                      <span>${p.price} ${p.currency}${p.period !== 'onetime' ? `/${p.period.slice(0, 2)}` : ''}</span>
                    </div>
                  `)}
                </div>
              </div>
            ` : null}

            ${this._whatIncluded ? html`
              <div class="section">
                <h2 class="section-heading">${msg("What's included")}</h2>
                <p class="section-text">${this._whatIncluded}</p>
              </div>
            ` : null}

            ${this._terms ? html`
              <div class="section">
                <h2 class="section-heading">${msg('Terms')}</h2>
                <p class="section-text">${this._terms}</p>
              </div>
            ` : null}
          </div>
        </div>
      </div>
    `;
  }

  static styles = subscriptionFormPageStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'subscription-form-page': SubscriptionFormPage;
  }
}
