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
  getUserSubscriptions: vi.fn(),
}));

vi.mock('@/features/subscriptions', () => ({
  subscriptionsService: {
    getUserSubscriptions: mocks.getUserSubscriptions,
  },
}));

vi.mock('./dashboard-sidebar', () => ({}));
vi.mock('./event-history', () => ({}));

import './dashboard-layout';
import type { DashboardLayout } from './dashboard-layout';
import { localizationService } from '@/features/localization';

async function settle() {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

function createLayout(): DashboardLayout {
  const el = document.createElement('dashboard-layout') as DashboardLayout;
  document.body.appendChild(el);
  return el;
}

function dispatchPeriodsLoaded(
  element: DashboardLayout,
  periods: string[]
): void {
  const layout = element.shadowRoot?.querySelector('.layout');
  if (!layout) throw new Error('.layout not rendered — component still loading?');
  layout.dispatchEvent(
    new CustomEvent('periods-loaded', {
      detail: periods,
      bubbles: true,
      composed: true,
    })
  );
}

describe('dashboard-layout', () => {
  let element: DashboardLayout;

  beforeEach(() => {
    mocks.getUserSubscriptions.mockReset();
    mocks.getUserSubscriptions.mockResolvedValue([]);
    localStorage.clear();
    localizationService.init();
    element = createLayout();
  });

  afterEach(() => {
    element.remove();
  });

  it('passes null to the sidebar until periods-loaded arrives', async () => {
    await settle();
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    expect(sidebar?.availablePeriods).toBeNull();
  });

  it('stores periods and forwards them to the sidebar on periods-loaded', async () => {
    await settle();
    await element.updateComplete;

    dispatchPeriodsLoaded(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    expect(sidebar?.availablePeriods).toEqual(['monthly', 'yearly']);
  });

  it('resets selectedPeriod to all on section switch', async () => {
    await settle();
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    sidebar.dispatchEvent(
      new CustomEvent('period-change', {
        detail: 'yearly',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;
    expect(sidebar.selectedPeriod).toBe('yearly');

    // Default section is 'all-services' (empty subs), so switch to a different one.
    sidebar.dispatchEvent(
      new CustomEvent('section-change', {
        detail: 'my-subscriptions',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;
    expect(sidebar.selectedPeriod).toBe('all');
  });

  it('resets selectedPeriod when the chosen period leaves the new periods list', async () => {
    await settle();
    await element.updateComplete;

    dispatchPeriodsLoaded(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    sidebar.dispatchEvent(
      new CustomEvent('period-change', {
        detail: 'yearly',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;
    expect(sidebar.selectedPeriod).toBe('yearly');

    dispatchPeriodsLoaded(element, ['monthly']);
    await element.updateComplete;
    expect(sidebar.selectedPeriod).toBe('all');
  });

  it('forces null periods on the history section regardless of loaded periods', async () => {
    await settle();
    await element.updateComplete;

    dispatchPeriodsLoaded(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    sidebar.dispatchEvent(
      new CustomEvent('section-change', {
        detail: 'history',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;
    expect(sidebar.availablePeriods).toBeNull();
  });

  it('defaults to all-services when the user has no subscriptions', async () => {
    mocks.getUserSubscriptions.mockResolvedValue([]);
    element.remove();
    element = createLayout();
    await settle();
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    expect(sidebar?.activeSection).toBe('all-services');
  });

  it('keeps my-subscriptions as default when the user has subscriptions', async () => {
    mocks.getUserSubscriptions.mockResolvedValue([
      { id: 'us1', user_id: 'me', subscription_id: '1', status: 'active', subscribed_at: 0 },
    ]);
    element.remove();
    element = createLayout();
    await settle();
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar') as any;
    expect(sidebar?.activeSection).toBe('my-subscriptions');
  });
});