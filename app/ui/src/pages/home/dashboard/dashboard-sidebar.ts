import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import type { SubscriptionPeriod } from '@/features/subscriptions';
import { dashboardSidebarStyles } from './dashboard-sidebar.styles';

type DashboardSection = 'my-subscriptions' | 'all-services' | 'history';
type FilterPeriod = SubscriptionPeriod | 'all';

const PERIOD_LABELS: Record<FilterPeriod, string> = {
  all: 'All',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  onetime: 'One-time',
};

@customElement('dashboard-sidebar')
@localized()
export class DashboardSidebar extends LitElement {
  @property({ type: String })
  activeSection: DashboardSection = 'my-subscriptions';

  @property()
  selectedPeriod: FilterPeriod = 'all';

  // null hides the filter entirely (history section, loading, single period).
  @property({ attribute: false })
  availablePeriods: SubscriptionPeriod[] | null = null;

  private _handleSectionClick(section: DashboardSection): void {
    this.dispatchEvent(
      new CustomEvent<DashboardSection>('section-change', {
        detail: section,
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handlePeriodClick(period: FilterPeriod): void {
    this.dispatchEvent(
      new CustomEvent<FilterPeriod>('period-change', {
        detail: period,
        bubbles: true,
        composed: true,
      })
    );
  }

  private _renderIcon(section: DashboardSection) {
    if (section === 'my-subscriptions') {
      return html`
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 7l-8-4-8 4 8 4 8-4z"></path>
          <path d="M4 7v10l8 4 8-4V7"></path>
        </svg>
      `;
    }
    if (section === 'all-services') {
      return html`
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
        </svg>
      `;
    }
    return html`
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <polyline points="12 7 12 12 15 14"></polyline>
      </svg>
    `;
  }

  private _renderItem(section: DashboardSection, label: string) {
    const isActive = section === this.activeSection;
    return html`
      <button
        class=${isActive ? 'nav-item active' : 'nav-item'}
        aria-current=${isActive ? 'page' : 'false'}
        @click=${() => this._handleSectionClick(section)}
      >
        ${this._renderIcon(section)}
        <span class="label">${label}</span>
      </button>
    `;
  }

  private _renderPeriodFilter(): TemplateResult {
    if (!this.availablePeriods || this.availablePeriods.length < 2) {
      return html``;
    }
    const periods: FilterPeriod[] = ['all', ...this.availablePeriods];
    return html`
      <div class="period-filter">
        <span class="filter-label">${msg('Period')}</span>
        ${periods.map(p => html`
          <button
            class="period-btn ${this.selectedPeriod === p ? 'active' : ''}"
            @click=${() => this._handlePeriodClick(p)}
          >
            ${msg(PERIOD_LABELS[p])}
          </button>
        `)}
      </div>
    `;
  }

  render() {
    return html`
      <nav class="nav">
        ${this._renderItem('my-subscriptions', msg('My Subscriptions'))}
        ${this._renderItem('all-services', msg('All Services'))}
        ${this._renderItem('history', msg('History'))}
      </nav>
      ${this._renderPeriodFilter()}
    `;
  }

  static styles = dashboardSidebarStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-sidebar': DashboardSidebar;
  }
}
