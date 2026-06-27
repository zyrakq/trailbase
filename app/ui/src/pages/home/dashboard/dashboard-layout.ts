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

@customElement('dashboard-layout')
@localized()
export class DashboardLayout extends LitElement {
  @state() private _activeSection: Section = 'my-subscriptions';
  @state() private _selectedPeriod: SubscriptionPeriod | 'all' = 'all';
  @state() private _availablePeriods: SubscriptionPeriod[] = [];
  @state() private _ready = false;

  async connectedCallback() {
    super.connectedCallback();
    const subs = await subscriptionsService.getUserSubscriptions();
    if (subs.length === 0) {
      this._activeSection = 'all-services';
    }
    this._ready = true;
  }

  private _handleSection(event: CustomEvent<Section>) {
    const next = event.detail;
    if (next === this._activeSection) return;
    this._activeSection = next;
    this._selectedPeriod = 'all';
  }

  private _handlePeriodChange(event: CustomEvent<SubscriptionPeriod | 'all'>) {
    this._selectedPeriod = event.detail;
  }

  private _handlePeriodsLoaded = (event: CustomEvent<SubscriptionPeriod[]>): void => {
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

  private _renderSection(): TemplateResult {
    switch (this._activeSection) {
      case 'my-subscriptions':
        return html`<subscriptions-grid mode="user" .selectedPeriod=${this._selectedPeriod}></subscriptions-grid>`;
      case 'all-services':
        return html`<subscriptions-grid mode="all" .selectedPeriod=${this._selectedPeriod}></subscriptions-grid>`;
      case 'history':
        return html`<event-history></event-history>`;
    }
  }

  render() {
    if (!this._ready) {
      return html`<p class="loading">${msg('Loading…')}</p>`;
    }
    return html`
      <div class="layout"
        @periods-loaded=${this._handlePeriodsLoaded}
      >
        <dashboard-sidebar
          .activeSection=${this._activeSection}
          .selectedPeriod=${this._selectedPeriod}
          .availablePeriods=${this._sidebarPeriods}
          @section-change=${this._handleSection}
          @period-change=${this._handlePeriodChange}
        ></dashboard-sidebar>
        <main class="content">${this._renderSection()}</main>
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