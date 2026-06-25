import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// happy-dom 15.x does not expose localStorage until a window URL is set.
// ThemeService.init() reads localStorage at module load, so we must install a
// minimal in-memory polyfill BEFORE the static `import` statements are resolved.
// `vi.hoisted` is hoisted above imports by vitest's transformer.
vi.hoisted(() => {
  if (typeof localStorage !== 'undefined') return;
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill,
    writable: true,
    configurable: true,
  });
});

const mocks = vi.hoisted(() => ({
  getEventHistory: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/features/subscriptions', () => ({
  subscriptionsService: {
    getEventHistory: mocks.getEventHistory,
  },
}));

vi.mock('@/features/notifications', () => ({
  notificationService: {
    error: mocks.error,
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import './event-history';
import type { EventHistory } from './event-history';
import type { SubscriptionEventWithSub } from '@/features/subscriptions';
import { localizationService } from '@/features/localization';

function controllablePromise<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function settle(target: EventHistory) {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
  await target.updateComplete;
}

const SAMPLE_EVENTS: SubscriptionEventWithSub[] = [
  {
    id: 'e1',
    user_subscription_id: 'us1',
    event_type: 'subscribed',
    created_at: Date.UTC(2024, 0, 15),
    subscriptionName: 'Gitea',
  },
  {
    id: 'e2',
    user_subscription_id: 'us1',
    event_type: 'renewed',
    created_at: Date.UTC(2024, 1, 1),
    subscriptionName: 'Gitea',
  },
  {
    id: 'e3',
    user_subscription_id: 'us-old',
    event_type: 'cancelled',
    created_at: Date.UTC(2024, 0, 20),
    subscriptionName: 'Gitea',
  },
  {
    id: 'e4',
    user_subscription_id: 'us-old2',
    event_type: 'expired',
    created_at: Date.UTC(2023, 11, 1),
    subscriptionName: 'Gitea',
  },
];

describe('event-history', () => {
  let element: EventHistory;

  beforeEach(() => {
    mocks.getEventHistory.mockReset();
    mocks.error.mockReset();
    localStorage.clear();
    localizationService.init();
  });

  afterEach(() => {
    element?.remove();
  });

  it('renders a loading state until the history resolves', async () => {
    const pending = controllablePromise<SubscriptionEventWithSub[]>();
    mocks.getEventHistory.mockReturnValue(pending.promise);

    element = document.createElement('event-history') as EventHistory;
    document.body.appendChild(element);
    await element.updateComplete;

    const loading = element.shadowRoot?.querySelector('.loading');
    expect(loading).toBeTruthy();
    expect(loading?.textContent).toContain('Loading');

    const list = element.shadowRoot?.querySelector('.list');
    expect(list).toBeNull();

    pending.resolve([]);
    await settle(element);
  });

  it('renders an empty state when the history has no events', async () => {
    mocks.getEventHistory.mockResolvedValue([]);

    element = document.createElement('event-history') as EventHistory;
    document.body.appendChild(element);
    await settle(element);

    const empty = element.shadowRoot?.querySelector('.empty');
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toContain('No subscription history yet');

    const loading = element.shadowRoot?.querySelector('.loading');
    expect(loading).toBeNull();
    const list = element.shadowRoot?.querySelector('.list');
    expect(list).toBeNull();
  });

  it('renders a row per event with the correct icon, name, label, and date', async () => {
    mocks.getEventHistory.mockResolvedValue(SAMPLE_EVENTS);

    element = document.createElement('event-history') as EventHistory;
    document.body.appendChild(element);
    await settle(element);

    const title = element.shadowRoot?.querySelector('.title');
    expect(title).toBeTruthy();

    const items = element.shadowRoot?.querySelectorAll('.item');
    expect(items?.length).toBe(SAMPLE_EVENTS.length);

    const firstIcon = element.shadowRoot?.querySelector(
      '.item .icon.icon-subscribed'
    );
    expect(firstIcon).toBeTruthy();

    expect(
      element.shadowRoot?.querySelector('.item .icon.icon-renewed')
    ).toBeTruthy();
    expect(
      element.shadowRoot?.querySelector('.item .icon.icon-cancelled')
    ).toBeTruthy();
    expect(
      element.shadowRoot?.querySelector('.item .icon.icon-expired')
    ).toBeTruthy();

    const firstName = element.shadowRoot?.querySelector('.item .name');
    expect(firstName?.textContent).toContain('Gitea');

    const firstMeta = element.shadowRoot?.querySelector('.item .meta');
    expect(firstMeta?.textContent).toContain('Subscribed');

    const infoWrappers = element.shadowRoot?.querySelectorAll('.item .info');
    expect(infoWrappers?.length).toBe(SAMPLE_EVENTS.length);

    const timeEl = element.shadowRoot?.querySelector('.item time');
    expect(timeEl).toBeTruthy();
    expect(timeEl?.textContent).toMatch(/\d/);

    const empty = element.shadowRoot?.querySelector('.empty');
    expect(empty).toBeNull();
    const loading = element.shadowRoot?.querySelector('.loading');
    expect(loading).toBeNull();
  });

  it('shows the empty state and surfaces a notification when the load fails', async () => {
    mocks.getEventHistory.mockRejectedValue(new Error('Network error'));

    element = document.createElement('event-history') as EventHistory;
    document.body.appendChild(element);
    await settle(element);

    expect(mocks.error).toHaveBeenCalledOnce();
    expect(mocks.error.mock.calls[0]?.[0]).toContain('Failed to load event history');

    const empty = element.shadowRoot?.querySelector('.empty');
    expect(empty).toBeTruthy();

    const list = element.shadowRoot?.querySelector('.list');
    expect(list).toBeNull();
  });
});
