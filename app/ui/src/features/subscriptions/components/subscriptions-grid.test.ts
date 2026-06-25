import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  getAll: vi.fn(),
  getUserSubscriptions: vi.fn(),
  error: vi.fn(),
}));

vi.mock('./subscription-card', () => ({}));

vi.mock('../services/subscriptions.service', () => ({
  subscriptionsService: {
    getAll: mocks.getAll,
    getUserSubscriptions: mocks.getUserSubscriptions,
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

import './subscriptions-grid';
import type { SubscriptionsGrid } from './subscriptions-grid';
import type {
  Subscription,
  UserSubscription,
} from '../types/subscription.types.ts';
import { localizationService } from '@/features/localization';

const ACTIVE_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'Gitea',
    description: 'Self-hosted Git service.',
    logo_url: '',
    resource_url: '',
    status: 'active',
    created_at: 0,
    updated_at: 0,
    pricing: [],
  },
  {
    id: '2',
    name: 'Nextcloud',
    description: 'File hosting.',
    logo_url: '',
    resource_url: '',
    status: 'active',
    created_at: 0,
    updated_at: 0,
    pricing: [],
  },
  {
    id: '3',
    name: 'Vaultwarden',
    description: 'Password manager.',
    logo_url: '',
    resource_url: '',
    status: 'active',
    created_at: 0,
    updated_at: 0,
    pricing: [],
  },
];

const USER_SUBS: UserSubscription[] = [
  {
    id: 'us1',
    user_id: 'me',
    subscription_id: '1',
    status: 'active',
    subscribed_at: 0,
  },
];

function controllablePromise<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function settle(target: SubscriptionsGrid) {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
  await target.updateComplete;
}

describe('subscriptions-grid', () => {
  let element: SubscriptionsGrid;

  beforeEach(() => {
    mocks.getAll.mockReset();
    mocks.getUserSubscriptions.mockReset();
    mocks.error.mockReset();
    localizationService.init();
  });

  afterEach(() => {
    element?.remove();
  });

  it('renders three skeleton placeholders while loading', async () => {
    const all = controllablePromise<Subscription[]>();
    const userSubs = controllablePromise<UserSubscription[]>();
    mocks.getAll.mockReturnValue(all.promise);
    mocks.getUserSubscriptions.mockReturnValue(userSubs.promise);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await element.updateComplete;

    const skeletons = element.shadowRoot?.querySelectorAll('.skeleton');
    expect(skeletons?.length).toBe(3);

    all.resolve([]);
    userSubs.resolve([]);
    await settle(element);
  });

  it('renders a card per active subscription in mode="all"', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue(USER_SUBS);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await settle(element);

    const cards = element.shadowRoot?.querySelectorAll('subscription-card');
    expect(cards?.length).toBe(ACTIVE_SUBSCRIPTIONS.length);
  });

  it('filters items to user subscriptions in mode="user"', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue(USER_SUBS);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    element.mode = 'user';
    document.body.appendChild(element);
    await settle(element);

    const cards = element.shadowRoot?.querySelectorAll('subscription-card');
    expect(cards?.length).toBe(1);
  });

  it('shows empty state when mode="user" and the user has no subscriptions', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue([]);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    element.mode = 'user';
    document.body.appendChild(element);
    await settle(element);

    const empty = element.shadowRoot?.querySelector('.empty');
    expect(empty?.textContent).toContain('You have no active subscriptions');
    const cards = element.shadowRoot?.querySelectorAll('subscription-card');
    expect(cards?.length).toBe(0);
  });

  it('dispatches mode-change with detail "all" when the empty-state button is clicked', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue([]);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    element.mode = 'user';
    document.body.appendChild(element);
    await settle(element);

    const listener = vi.fn();
    element.addEventListener('mode-change', listener);

    const button = element.shadowRoot?.querySelector(
      '.link'
    ) as HTMLButtonElement | null;
    button?.click();

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0]![0] as CustomEvent;
    expect(event.detail).toBe('all');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('shows empty state and surfaces a notification when the load fails', async () => {
    mocks.getAll.mockRejectedValue(new Error('Network error'));
    mocks.getUserSubscriptions.mockResolvedValue([]);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await settle(element);

    expect(mocks.error).toHaveBeenCalledOnce();
    const empty = element.shadowRoot?.querySelector('.empty');
    expect(empty).toBeTruthy();
  });

  it('reloads when a bubbled subscription-subscribed event fires', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue(USER_SUBS);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await settle(element);

    expect(mocks.getAll).toHaveBeenCalledTimes(1);

    element.dispatchEvent(
      new CustomEvent('subscription-subscribed', {
        bubbles: true,
        composed: true,
      })
    );
    await settle(element);

    expect(mocks.getAll).toHaveBeenCalledTimes(2);
  });

  it('reloads when a bubbled subscription-cancelled event fires', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue(USER_SUBS);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await settle(element);

    expect(mocks.getAll).toHaveBeenCalledTimes(1);

    element.dispatchEvent(
      new CustomEvent('subscription-cancelled', {
        bubbles: true,
        composed: true,
      })
    );
    await settle(element);

    expect(mocks.getAll).toHaveBeenCalledTimes(2);
  });

  it('reloads when the mode property changes', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue(USER_SUBS);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await settle(element);

    expect(mocks.getAll).toHaveBeenCalledTimes(1);

    element.mode = 'user';
    await settle(element);

    expect(mocks.getAll).toHaveBeenCalledTimes(2);
  });

  it('removes the event listeners on disconnect', async () => {
    mocks.getAll.mockResolvedValue(ACTIVE_SUBSCRIPTIONS);
    mocks.getUserSubscriptions.mockResolvedValue(USER_SUBS);

    element = document.createElement('subscriptions-grid') as SubscriptionsGrid;
    document.body.appendChild(element);
    await settle(element);

    const callsBefore = mocks.getAll.mock.calls.length;
    element.remove();

    element.dispatchEvent(
      new CustomEvent('subscription-subscribed', {
        bubbles: true,
        composed: true,
      })
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(mocks.getAll.mock.calls.length).toBe(callsBefore);
  });
});
