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

vi.mock('@/features/subscriptions', () => ({
  subscriptionsService: {
    getUserSubscriptions: vi.fn().mockResolvedValue([{ id: '1' }]),
  },
}));

import './dashboard-layout';
import type { DashboardLayout } from './dashboard-layout';
import { localizationService } from '@/features/localization';

async function flushReady(element: DashboardLayout): Promise<void> {
  await element.updateComplete;
  await new Promise((r) => setTimeout(r));
  await element.updateComplete;
}

function feedPeriods(
  element: DashboardLayout,
  periods: string[]
): void {
  const layout = element.shadowRoot?.querySelector('.layout') as HTMLElement;
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
    localStorage.clear();
    localizationService.init();
    element = document.createElement('dashboard-layout') as DashboardLayout;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('applies the drawer-open class when drawerOpen is true', async () => {
    await flushReady(element);
    element.drawerOpen = true;
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(true);
  });

  it('does not apply the drawer-open class when drawerOpen is false', async () => {
    await flushReady(element);
    element.drawerOpen = false;
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(false);
  });

  it('dispatches drawer-close when the backdrop is clicked', async () => {
    await flushReady(element);

    const events: CustomEvent[] = [];
    const handler = (e: Event): void => {
      events.push(e as CustomEvent);
    };
    element.addEventListener('drawer-close', handler);

    const backdrop = element.shadowRoot?.querySelector(
      '.backdrop'
    ) as HTMLElement;
    backdrop.click();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('drawer-close');
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);

    element.removeEventListener('drawer-close', handler);
  });

  it('dispatches drawer-close when a new section is selected from the sidebar', async () => {
    await flushReady(element);

    const events: CustomEvent[] = [];
    const handler = (e: Event): void => {
      events.push(e as CustomEvent);
    };
    element.addEventListener('drawer-close', handler);

    const sidebar = element.shadowRoot?.querySelector(
      'dashboard-sidebar'
    ) as HTMLElement;
    sidebar.dispatchEvent(
      new CustomEvent('section-change', {
        detail: 'all-services',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('drawer-close');
    element.removeEventListener('drawer-close', handler);
  });

  it('does not dispatch drawer-close when the same section is re-selected', async () => {
    await flushReady(element);

    const events: CustomEvent[] = [];
    const handler = (e: Event): void => {
      events.push(e as CustomEvent);
    };
    element.addEventListener('drawer-close', handler);

    const sidebar = element.shadowRoot?.querySelector(
      'dashboard-sidebar'
    ) as HTMLElement;
    sidebar.dispatchEvent(
      new CustomEvent('section-change', {
        detail: 'my-subscriptions',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;

    expect(events).toHaveLength(0);
    element.removeEventListener('drawer-close', handler);
  });

  it('does not render the mobile period bar when fewer than 2 periods are available', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly']);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.mobile-period-bar')).toBeNull();
  });

  it('does not render the mobile period bar on the history section', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const sidebar = element.shadowRoot?.querySelector(
      'dashboard-sidebar'
    ) as HTMLElement;
    sidebar.dispatchEvent(
      new CustomEvent('section-change', {
        detail: 'history',
        bubbles: true,
        composed: true,
      })
    );
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.mobile-period-bar')).toBeNull();
  });

  it('renders the mobile period bar and applies bar-visible when 2+ periods are available', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('bar-visible')).toBe(true);
    expect(
      element.shadowRoot?.querySelector('.mobile-period-bar')
    ).not.toBeNull();
  });

  it('opens the period dropdown on trigger click and lists all + available periods', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;

    const dropdown = element.shadowRoot?.querySelector('.period-dropdown');
    expect(dropdown).not.toBeNull();

    const options = element.shadowRoot?.querySelectorAll('.period-option');
    expect(options?.length).toBe(3);

    const labels = Array.from(options ?? []).map(
      (o) => o.textContent?.trim()
    );
    expect(labels).toEqual(['All', 'Monthly', 'Yearly']);
  });

  it('closes the period dropdown on outside click without changing the selection', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('.period-dropdown')).not.toBeNull();

    document.body.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.period-dropdown')).toBeNull();
  });

  it('updates the selected period and closes the dropdown when an option is chosen', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;

    const options = element.shadowRoot?.querySelectorAll(
      '.period-option'
    ) as NodeListOf<HTMLButtonElement>;
    options[2].click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.period-dropdown')).toBeNull();
    const triggerLabel = trigger.textContent?.trim() ?? '';
    expect(triggerLabel).toContain('Yearly');
    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar');
    expect((sidebar as any).selectedPeriod).toBe('yearly');
  });

  it('closes the period dropdown on Escape without closing the drawer', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('.period-dropdown')).not.toBeNull();

    const events: CustomEvent[] = [];
    const handler = (e: Event): void => {
      events.push(e as CustomEvent);
    };
    element.addEventListener('drawer-close', handler);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.period-dropdown')).toBeNull();
    expect(events).toHaveLength(0);
    element.removeEventListener('drawer-close', handler);
  });

  it('dispatches drawer-close on Escape when the dropdown is closed but the drawer is open', async () => {
    await flushReady(element);
    element.drawerOpen = true;
    await element.updateComplete;

    const events: CustomEvent[] = [];
    const handler = (e: Event): void => {
      events.push(e as CustomEvent);
    };
    element.addEventListener('drawer-close', handler);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    expect(events).toHaveLength(1);
    element.removeEventListener('drawer-close', handler);
  });
});
