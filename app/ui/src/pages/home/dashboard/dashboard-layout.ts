import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
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
  @state() private _activeSection: Section = 'my-subscriptions';
  @state() private _selectedPeriod: FilterPeriod = 'all';
  @state() private _availablePeriods: SubscriptionPeriod[] = [];
  @state() private _ready = false;
  @state() private _periodDropdownOpen = false;
  @state() private _drawerOpen = false;

  async connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleKeyDown);
    const subs = await subscriptionsService.getUserSubscriptions();
    if (subs.length === 0) {
      this._activeSection = 'all-services';
    }
    this._ready = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    if (this._periodDropdownOpen) {
      this._periodDropdownOpen = false;
    } else {
      this._drawerOpen = false;
    }
  };

  private _toggleDrawer = (): void => {
    this._drawerOpen = !this._drawerOpen;
  };

  private _handleOverlayClick = (): void => {
    this._periodDropdownOpen = false;
  };

  private _handleSection(event: CustomEvent<Section>) {
    const next = event.detail;
    if (next === this._activeSection) return;
    this._activeSection = next;
    this._selectedPeriod = 'all';
    this._drawerOpen = false;
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

  render() {
    if (!this._ready) {
      return html`<p class="loading">${msg('Loading…')}</p>`;
    }
    const layoutClass = `layout${this._drawerOpen ? ' drawer-open' : ''}${
      this._barVisible ? ' bar-visible' : ''
    }`;
    return html`
      <div class="mobile-toolbar">
        <button
          class="menu-btn"
          @click=${this._toggleDrawer}
          aria-label=${this._drawerOpen ? msg('Close menu') : msg('Menu')}
        >
          ${this._drawerOpen
            ? html`<svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>`
            : html`<svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>`}
        </button>
        ${this._barVisible
          ? html`<button
              class="period-trigger"
              @click=${this._togglePeriodDropdown}
              aria-haspopup="listbox"
              aria-expanded=${this._periodDropdownOpen}
            >
              <span
                >${msg('Period')}:
                ${msg(PERIOD_LABELS[this._selectedPeriod])}</span
              >
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
            </button>`
          : null}
      </div>
      <div class=${layoutClass} @periods-loaded=${this._handlePeriodsLoaded}>
        <dashboard-sidebar
          .activeSection=${this._activeSection}
          .selectedPeriod=${this._selectedPeriod}
          .availablePeriods=${this._sidebarPeriods}
          @section-change=${this._handleSection}
          @period-change=${this._handlePeriodChange}
        ></dashboard-sidebar>
        <main class="content">${this._renderSection()}</main>
        ${this._barVisible
          ? html`
              <div
                class="period-overlay ${this._periodDropdownOpen
                  ? 'open'
                  : ''}"
                @click=${this._handleOverlayClick}
              ></div>
              <div
                class="period-sheet ${this._periodDropdownOpen ? 'open' : ''}"
                role="listbox"
              >
                ${(['all', ...this._availablePeriods] as FilterPeriod[]).map(
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
              </div>
            `
          : null}
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
