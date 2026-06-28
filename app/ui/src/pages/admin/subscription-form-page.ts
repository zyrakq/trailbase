import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
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
import type { ImageCropperCroppedEventDetail, SegmentedSelectEventDetail } from '@/shared';
import '@/shared/components/segmented-control';
import '@/shared/components/image-cropper';
import '@/shared';
import { subscriptionFormPageStyles } from './subscription-form-page.styles';

const PERIODS: SubscriptionPeriod[] = ['monthly', 'quarterly', 'yearly', 'onetime'];

type FormTab = 'general' | 'logo' | 'pricing' | 'details';

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
  @state() private _loading = true;
  @state() private _saving = false;
  @state() private _activeTab: FormTab = 'general';

  @state() private _name = '';
  @state() private _description = '';
  @state() private _logoUrl = '';
  @state() private _resourceUrl = '';
  @state() private _whatIncluded = '';
  @state() private _terms = '';
  @state() private _pricing: PricingEntry[] = [];

  @state() private _logoMode: 'upload' | 'url' = 'upload';
  @state() private _uploading = false;
  @state() private _logoPreviewFailed = false;
  // Increments on every local-logo URL change to force a fresh fetch, bypassing
  // the immutable HTTP cache for files that may have been deleted server-side.
  private _logoUrlVersion = 0;

  private get _previewSrc(): string {
    if (!this._logoUrl) return '';
    return this._logoUrl.startsWith('/subscription-logos/')
      ? `${this._logoUrl}?_t=${this._logoUrlVersion}`
      : this._logoUrl;
  }

  private get _showPreview(): boolean {
    return Boolean(this._logoUrl) && !this._logoPreviewFailed;
  }

  private _setLogoUrl(url: string): void {
    if (url.startsWith('/subscription-logos/')) this._logoUrlVersion = Date.now();
    this._logoPreviewFailed = false;
    this._logoUrl = url;
  }

  private _onLogoError(): void {
    this._logoPreviewFailed = true;
  }

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
          this._logoUrlVersion = sub.updated_at;
          this._resourceUrl = sub.resource_url;
          this._whatIncluded = sub.what_included ?? '';
          this._terms = sub.terms ?? '';
          this._pricing = sub.pricing.filter(p => !p.is_archived).map(p => ({ ...p }));
          if (sub.logo_url) this._logoMode = 'url';
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

  private _addPricingTier(period: SubscriptionPeriod): void {
    if (this._pricing.some(p => p.period === period)) return;
    this._pricing = [...this._pricing, { period, price: 0, currency: 'RUB' }];
  }

  private _removePricingTier(index: number): void {
    this._pricing = this._pricing.filter((_, i) => i !== index);
  }

  private _updatePricingTier(index: number, field: keyof PricingEntry, value: string | number): void {
    this._pricing = this._pricing.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
  }

  private async _handleCropped(e: CustomEvent<ImageCropperCroppedEventDetail>): Promise<void> {
    if (this._uploading) return;
    this._uploading = true;
    try {
      const url = await subscriptionsService.uploadLogo(e.detail.blob);
      this._setLogoUrl(url);
    } catch (err) {
      notificationService.error(
        err instanceof Error ? err.message : msg('Logo upload failed.'),
      );
    } finally {
      this._uploading = false;
    }
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
    const tabLabels: Record<string, string> = {
      general: msg('General'),
      logo: msg('Logo'),
      pricing: msg('Pricing'),
      details: msg('Details'),
    };
    return html`
      <div class="form-wrapper">
        <div class="top-bar">
          <button class="btn-back" @click=${this._goBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            ${msg('Back to Admin')}
          </button>
        </div>

        <h1 class="page-title">
          ${isEdit ? msg('Edit Subscription') : msg('New Subscription')}
        </h1>

        <form class="form" novalidate @submit=${(e: Event) => { e.preventDefault(); void this._save(); }}>
          <div class="edit-layout">
            <div class="form-col">
              <segmented-control
                variant="tabs"
                .values=${(['general', 'logo', 'pricing', 'details'] as FormTab[])}
                .labels=${tabLabels}
                .value=${this._activeTab}
                @select=${(e: CustomEvent<SegmentedSelectEventDetail>) => {
                  this._activeTab = e.detail.value as FormTab;
                }}
              ></segmented-control>
              ${this._renderActiveTab()}
            </div>
            <div class="preview-col">
              ${this._renderPreview()}
            </div>
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
      </div>
    `;
  }

  private _renderActiveTab(): TemplateResult {
    switch (this._activeTab) {
      case 'general': return this._renderGeneralSection();
      case 'logo': return this._renderLogoSection();
      case 'pricing': return this._renderPricingSection();
      case 'details': return this._renderDetailsSection();
    }
  }

  private _renderGeneralSection(): TemplateResult {
    return html`
      <div class="field">
        <label class="label" for="name">${msg('Name')} *</label>
        <input
          id="name"
          class="input"
          type="text"
          .value=${this._name}
          @input=${(e: InputEvent) => { this._name = (e.target as HTMLInputElement).value; }}
        />
      </div>
      <div class="field">
        <label class="label" for="description">${msg('Description')}</label>
        <textarea
          id="description"
          class="input textarea"
          rows="3"
          .value=${this._description}
          @input=${(e: InputEvent) => { this._description = (e.target as HTMLTextAreaElement).value; }}
        ></textarea>
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
    `;
  }

  private _renderLogoSection(): TemplateResult {
    return html`
      <div class="logo-upload-block" ?hidden=${this._logoMode !== 'upload'}>
        <image-cropper
          .file=${null}
          ?uploading=${this._uploading}
          @cropped=${this._handleCropped}
        ></image-cropper>
        <img class="logo-preview" src=${this._previewSrc} alt=${msg('Logo preview')} ?hidden=${!this._showPreview} @error=${this._onLogoError} />
        <button
          type="button"
          class="btn-link"
          @click=${() => { this._logoMode = 'url'; }}
        >${msg('Use a URL instead')}</button>
      </div>
      <div class="logo-url-block" ?hidden=${this._logoMode !== 'url'}>
        <div class="logo-input-row">
          <div class="input-with-clear">
            <input
              class="input"
              type="url"
              .value=${this._logoUrl}
              @input=${(e: InputEvent) => { this._setLogoUrl((e.target as HTMLInputElement).value); }}
              placeholder="https://..."
            />
            ${this._logoUrl ? html`
              <button
                type="button"
                class="btn-clear-url"
                aria-label=${msg('Clear URL')}
                @click=${() => { this._setLogoUrl(''); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ` : null}
          </div>
          <img class="logo-preview" src=${this._previewSrc} alt=${msg('Logo preview')} ?hidden=${!this._showPreview} @error=${this._onLogoError} />
        </div>
        <button
          type="button"
          class="btn-link"
          @click=${() => { this._logoMode = 'upload'; }}
        >${msg('Upload an image instead')}</button>
      </div>
    `;
  }

  private _renderPricingSection(): TemplateResult {
    const usedPeriods = new Set(this._pricing.map(p => p.period));
    const periodLabels: Record<string, string> = {
      monthly: msg('Monthly'),
      quarterly: msg('Quarterly'),
      yearly: msg('Yearly'),
      onetime: msg('One-time'),
    };
    return html`
      <segmented-control
        .values=${PERIODS}
        .labels=${periodLabels}
        .value=${''}
        .disabledValues=${[...usedPeriods]}
        @select=${(e: CustomEvent<SegmentedSelectEventDetail>) => {
          this._addPricingTier(e.detail.value as SubscriptionPeriod);
        }}
      ></segmented-control>
      <p class="pricing-empty" ?hidden=${this._pricing.length > 0}>${msg('No pricing tiers. Pick a period above.')}</p>
      ${repeat(this._pricing, (p) => p.period, (p, i) => html`
        <div class="pricing-tier">
          <span class="period-label">${periodLabels[p.period]}</span>
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
    `;
  }

  private _renderDetailsSection(): TemplateResult {
    return html`
      <div class="field">
        <label class="label" for="what_included">${msg("What's included")}</label>
        <textarea
          id="what_included"
          class="input textarea"
          rows="4"
          .value=${this._whatIncluded}
          @input=${(e: InputEvent) => { this._whatIncluded = (e.target as HTMLTextAreaElement).value; }}
        ></textarea>
      </div>
      <div class="field">
        <label class="label" for="terms">${msg('Terms')}</label>
        <textarea
          id="terms"
          class="input textarea"
          rows="3"
          .value=${this._terms}
          @input=${(e: InputEvent) => { this._terms = (e.target as HTMLTextAreaElement).value; }}
        ></textarea>
      </div>
    `;
  }

  private _renderPreview(): TemplateResult {
    const activePricing: SubscriptionPricing[] = this._pricing
      .filter(p => p.price > 0)
      .map((p, i) => ({
        id: p.id ?? `preview-${i}`,
        subscription_id: 'preview',
        period: p.period,
        price: p.price,
        currency: p.currency,
        is_archived: false,
      }));

    return html`
      <div class="detail-card">
        <div class="logo-hero">
          <img
            class="logo-img"
            ?hidden=${!this._showPreview}
            src=${this._previewSrc}
            alt=${this._name || msg('Preview')}
            @error=${this._onLogoError}
          />
          <div class="logo-letter" ?hidden=${this._showPreview}>${(this._name || '?').charAt(0).toUpperCase()}</div>
        </div>
        <div class="detail-body">
          <div class="title-row">
            <h1 class="title">
              <span ?hidden=${!this._name}>${this._name}</span>
              <em ?hidden=${Boolean(this._name)}>${msg('Untitled')}</em>
            </h1>
          </div>
          <p class="description">
            <span ?hidden=${!this._description}>${this._description}</span>
            <em ?hidden=${Boolean(this._description)}>${msg('No description')}</em>
          </p>

          <div class="section" ?hidden=${activePricing.length === 0}>
            <h2 class="section-heading">${msg('Pricing')}</h2>
            <div class="pricing-table">
              ${repeat(activePricing, (p) => p.id, (p) => html`
                <div class="pricing-row">
                  <span>${periodLabel(p.period)}</span>
                  <span>${p.price} ${p.currency}${p.period !== 'onetime' ? `/${p.period.slice(0, 2)}` : ''}</span>
                </div>
              `)}
            </div>
          </div>

          <div class="section" ?hidden=${!this._whatIncluded}>
            <h2 class="section-heading">${msg("What's included")}</h2>
            <p class="section-text">${this._whatIncluded}</p>
          </div>

          <div class="section" ?hidden=${!this._terms}>
            <h2 class="section-heading">${msg('Terms')}</h2>
            <p class="section-text">${this._terms}</p>
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
