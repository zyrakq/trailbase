import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized, localizationService } from '@/features/localization';
import { notificationService } from '@/features/notifications';
import {
  subscriptionsService,
  type SubscriptionEventType,
  type SubscriptionEventWithSub,
} from '@/features/subscriptions';
import { eventHistoryStyles } from './event-history.styles';

@customElement('event-history')
@localized()
export class EventHistory extends LitElement {
  @state() private _events: SubscriptionEventWithSub[] = [];
  @state() private _loading = true;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _load(): Promise<void> {
    this._loading = true;
    try {
      this._events = await subscriptionsService.getEventHistory();
    } catch {
      notificationService.error(msg('Failed to load event history.'));
    } finally {
      this._loading = false;
    }
  }

  private _label(type: SubscriptionEventType): string {
    switch (type) {
      case 'subscribed':
        return msg('Subscribed');
      case 'activated':
        return msg('Activated');
      case 'renewed':
        return msg('Renewed');
      case 'cancelled':
        return msg('Cancelled');
      case 'expired':
        return msg('Expired');
    }
  }

  private _icon(type: SubscriptionEventType): string {
    switch (type) {
      case 'subscribed':
        return '✓';
      case 'activated':
        return '✓';
      case 'renewed':
        return '↻';
      case 'cancelled':
        return '✕';
      case 'expired':
        return '⏱';
    }
  }

  private _formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(
      localizationService.getLocale()
    );
  }

  render(): TemplateResult {
    if (this._loading) {
      return html`<p class="loading">${msg('Loading…')}</p>`;
    }
    if (this._events.length === 0) {
      return html`<p class="empty">${msg('No subscription history yet.')}</p>`;
    }
    return html`
      <h3 class="title">${msg('Subscription History')}</h3>
      <ul class="list">
        ${this._events.map(
          (ev) => html`
            <li class="item">
              <span class="icon icon-${ev.event_type}"
                >${this._icon(ev.event_type)}</span
              >
              <span class="info">
                <span class="name">${ev.subscriptionName}</span>
                <span class="meta">${this._label(ev.event_type)}</span>
              </span>
              <time>${this._formatDate(ev.created_at)}</time>
            </li>
          `
        )}
      </ul>
    `;
  }

  static styles = eventHistoryStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'event-history': EventHistory;
  }
}
