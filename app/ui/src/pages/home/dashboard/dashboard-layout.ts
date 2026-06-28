import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { subscriptionsService } from '@/features/subscriptions';
import type { SubscriptionPeriod } from '@/features/subscriptions';
import { dashboardLayoutStyles } from './dashboard-layout.styles';
import './dashboard-sidebar';
import './event-history';
import '@/features/subscriptions';

type Section = 'my-subscriptions' | 'all-services' | 'history';
type FilterPeriod = SubscriptionPeriod | 'all';

const PERIOD_LABELS: Record<FilterPeriod, string> = {
  all: 'All',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  onetime: 'One-time',
};

@customElement('dashboard-layout')
@localized()
export class DashboardLayout extends LitElement {
  @property({ type: Boolean })
  drawerOpen = false;

  @state() private _activeSection: Section = 'my-subscriptions';
  @state() private _selectedPeriod: FilterPeriod = 'all';
  @state() private _availablePeriods: SubscriptionPeriod[] = [];
  @state() private _ready = false;
  @state() private _periodDropdownOpen = false;

  async connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleKeyDown);
    const subs = await subscriptionsService.getUserSubscriptions();
    if (subs.length === 0) {
      this._activeSection = 'all-services';
    }
    this._ready = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  private _handleOutsideClick = (): void => {
    if (this._periodDropdownOpen) this._periodDropdownOpen = false;
  };

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    if (this._periodDropdownOpen) {
      this._periodDropdownOpen = false;
    } else if (this.drawerOpen) {
      this._emitDrawerClose();
    }
  };

  private _emitDrawerClose(): void {
    this.dispatchEvent(
      new CustomEvent('drawer-close', { bubbles: true, composed: true })
    );
  }

  private _handleBackdropClick = (): void => {
    this._emitDrawerClose();
  };

  private _handleSection(event: CustomEvent<Section>) {
    const next = event.detail;
    if (next === this._activeSection) return;
    this._activeSection = next;
    this._selectedPeriod = 'all';
    this._emitDrawerClose();
  }

  private _setPeriod(period: FilterPeriod): void {
    this._selectedPeriod = period;
  }

  private _handlePeriodChange(event: CustomEvent<FilterPeriod>) {
    this._setPeriod(event.detail);
  }

  private _handlePeriodsLoaded = (
    event: CustomEvent<SubscriptionPeriod[]>
  ): void => {
    const periods = event.detail;
    this._availablePeriods = periods;
    if (
      this._selectedPeriod !== 'all' &&
      !periods.includes(this._selectedPeriod)
    ) {
      this._selectedPeriod = 'all';
    }
  };

  private get _sidebarPeriods(): SubscriptionPeriod[] | null {
    if (this._activeSection === 'history') return null;
    if (this._availablePeriods.length < 2) return null;
    return this._availablePeriods;
  }

  private get _barVisible(): boolean {
    return (
      this._activeSection !== 'history' && this._availablePeriods.length >= 2
    );
  }

  private _togglePeriodDropdown(e: Event): void {
    e.stopPropagation();
    this._periodDropdownOpen = !this._periodDropdownOpen;
  }

  private _selectPeriod(period: FilterPeriod): void {
    this._setPeriod(period);
    this._periodDropdownOpen = false;
  }

  private _renderSection(): TemplateResult {
    switch (this._activeSection) {
      case 'my-subscriptions':
        return html`<subscriptions-grid
          mode="user"
          .selectedPeriod=${this._selectedPeriod}
        ></subscriptions-grid>`;
      case 'all-services':
        return html`<subscriptions-grid
          mode="all"
          .selectedPeriod=${this._selectedPeriod}
        ></subscriptions-grid>`;
      case 'history':
        return html`<event-history></event-history>`;
    }
  }

  private _renderMobilePeriodBar(): TemplateResult | null {
    if (!this._barVisible) return null;
    const periods: FilterPeriod[] = ['all', ...this._availablePeriods];
    return html`
      <div class="mobile-period-bar" @click=${(e: Event) => e.stopPropagation()}>
        <button
          class="period-trigger"
          @click=${this._togglePeriodDropdown}
          aria-haspopup="listbox"
          aria-expanded=${this._periodDropdownOpen}
        >
          <span>${msg('Period')}: ${msg(PERIOD_LABELS[this._selectedPeriod])}</span>
          <svg
            class="chevron ${this._periodDropdownOpen ? 'open' : ''}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 15 12 9 18 15"></polyline>
          </svg>
        </button>
        ${this._periodDropdownOpen
          ? html`<div class="period-dropdown" role="listbox">
              ${periods.map(
                (p) => html`
                  <button
                    class="period-option ${this._selectedPeriod === p
                      ? 'active'
                      : ''}"
                    role="option"
                    aria-selected=${this._selectedPeriod === p}
                    @click=${() => this._selectPeriod(p)}
                  >
                    ${msg(PERIOD_LABELS[p])}
                  </button>
                `
              )}
            </div>`
          : null}
      </div>
    `;
  }

  render() {
    if (!this._ready) {
      return html`<p class="loading">${msg('Loading…')}</p>`;
    }
    const layoutClass = `layout${this.drawerOpen ? ' drawer-open' : ''}${
      this._barVisible ? ' bar-visible' : ''
    }`;
    return html`
      <div class=${layoutClass} @periods-loaded=${this._handlePeriodsLoaded}>
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <dashboard-sidebar
          .activeSection=${this._activeSection}
          .selectedPeriod=${this._selectedPeriod}
          .availablePeriods=${this._sidebarPeriods}
          @section-change=${this._handleSection}
          @period-change=${this._handlePeriodChange}
        ></dashboard-sidebar>
        <main class="content">${this._renderSection()}</main>
        ${this._renderMobilePeriodBar()}
      </div>
    `;
  }

  static styles = dashboardLayoutStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-layout': DashboardLayout;
  }
}
