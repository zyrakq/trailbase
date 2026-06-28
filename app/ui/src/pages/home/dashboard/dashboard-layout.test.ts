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

function selectSection(
  element: DashboardLayout,
  section: string
): void {
  const sidebar = element.shadowRoot?.querySelector(
    'dashboard-sidebar'
  ) as HTMLElement;
  sidebar.dispatchEvent(
    new CustomEvent('section-change', {
      detail: section,
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

  it('renders the mobile toolbar with burger when ready', async () => {
    await flushReady(element);
    expect(
      element.shadowRoot?.querySelector('.mobile-toolbar')
    ).not.toBeNull();
    expect(element.shadowRoot?.querySelector('.menu-btn')).not.toBeNull();
  });

  it('does not render the period trigger when fewer than 2 periods are available', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly']);
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('.period-trigger')).toBeNull();
  });

  it('does not render the period sheet on the history section', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;
    selectSection(element, 'history');
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('.period-sheet')).toBeNull();
  });

  it('renders the period trigger and sheet and applies bar-visible when 2+ periods are available', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;
    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('bar-visible')).toBe(true);
    expect(
      element.shadowRoot?.querySelector('.period-trigger')
    ).not.toBeNull();
    expect(element.shadowRoot?.querySelector('.period-sheet')).not.toBeNull();
  });

  it('opens the drawer and applies drawer-open class on burger click', async () => {
    await flushReady(element);
    const burger = element.shadowRoot?.querySelector(
      '.menu-btn'
    ) as HTMLButtonElement;
    burger.click();
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(true);
    expect(burger.getAttribute('aria-label')).toBe('Close menu');
  });

  it('closes the drawer by clicking the burger again', async () => {
    await flushReady(element);
    const burger = element.shadowRoot?.querySelector(
      '.menu-btn'
    ) as HTMLButtonElement;
    burger.click();
    await element.updateComplete;

    burger.click();
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(false);
    expect(burger.getAttribute('aria-label')).toBe('Menu');
  });

  it('closes the drawer internally when a new section is selected', async () => {
    await flushReady(element);
    const burger = element.shadowRoot?.querySelector(
      '.menu-btn'
    ) as HTMLButtonElement;
    burger.click();
    await element.updateComplete;

    selectSection(element, 'all-services');
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(false);
  });

  it('does not close the drawer when the same section is re-selected', async () => {
    await flushReady(element);
    const burger = element.shadowRoot?.querySelector(
      '.menu-btn'
    ) as HTMLButtonElement;
    burger.click();
    await element.updateComplete;

    selectSection(element, 'my-subscriptions');
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(true);
  });

  it('closes the drawer on Escape when the dropdown is closed', async () => {
    await flushReady(element);
    const burger = element.shadowRoot?.querySelector(
      '.menu-btn'
    ) as HTMLButtonElement;
    burger.click();
    await element.updateComplete;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(false);
  });

  it('opens the period sheet on trigger click and lists all + available periods', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector('.period-sheet');
    expect(sheet?.classList.contains('open')).toBe(true);
    const overlay = element.shadowRoot?.querySelector('.period-overlay');
    expect(overlay?.classList.contains('open')).toBe(true);

    const options = element.shadowRoot?.querySelectorAll('.period-option');
    expect(options?.length).toBe(3);
    const labels = Array.from(options ?? []).map(
      (o) => o.textContent?.trim()
    );
    expect(labels).toEqual(['All', 'Monthly', 'Yearly']);
  });

  it('closes the period sheet on overlay click without changing the selection', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;

    const overlay = element.shadowRoot?.querySelector(
      '.period-overlay'
    ) as HTMLElement;
    overlay.click();
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector('.period-sheet');
    expect(sheet?.classList.contains('open')).toBe(false);
  });

  it('updates the selected period and closes the sheet when an option is chosen', async () => {
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

    const sheet = element.shadowRoot?.querySelector('.period-sheet');
    expect(sheet?.classList.contains('open')).toBe(false);
    const triggerLabel = trigger.textContent?.trim() ?? '';
    expect(triggerLabel).toContain('Yearly');
    const sidebar = element.shadowRoot?.querySelector('dashboard-sidebar');
    expect((sidebar as any).selectedPeriod).toBe('yearly');
  });

  it('closes the period sheet on Escape without closing the drawer', async () => {
    await flushReady(element);
    feedPeriods(element, ['monthly', 'yearly']);
    await element.updateComplete;

    const burger = element.shadowRoot?.querySelector(
      '.menu-btn'
    ) as HTMLButtonElement;
    burger.click();
    await element.updateComplete;

    const trigger = element.shadowRoot?.querySelector(
      '.period-trigger'
    ) as HTMLButtonElement;
    trigger.click();
    await element.updateComplete;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector('.period-sheet');
    expect(sheet?.classList.contains('open')).toBe(false);
    const layout = element.shadowRoot?.querySelector('.layout');
    expect(layout?.classList.contains('drawer-open')).toBe(true);
  });
});
