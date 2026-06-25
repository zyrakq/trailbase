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

import './dashboard-sidebar';
import type { DashboardSidebar } from './dashboard-sidebar';
import { localizationService } from '@/features/localization';

describe('dashboard-sidebar', () => {
  let element: DashboardSidebar;

  beforeEach(() => {
    localStorage.clear();
    localizationService.init();
    element = document.createElement('dashboard-sidebar') as DashboardSidebar;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders three nav items with msg() labels', async () => {
    await element.updateComplete;

    const items = element.shadowRoot?.querySelectorAll('.nav-item');
    expect(items?.length).toBe(3);

    const labels = Array.from(
      element.shadowRoot?.querySelectorAll('.nav-item .label') ?? []
    ).map((node) => node.textContent?.trim());

    expect(labels).toEqual(['My Subscriptions', 'All Services', 'History']);
  });

  it('marks the first item active by default', async () => {
    await element.updateComplete;

    const items = element.shadowRoot?.querySelectorAll('.nav-item');
    expect(items?.[0]?.classList.contains('active')).toBe(true);
    expect(items?.[1]?.classList.contains('active')).toBe(false);
    expect(items?.[2]?.classList.contains('active')).toBe(false);
  });

  it('moves the active class when activeSection changes', async () => {
    element.activeSection = 'all-services';
    await element.updateComplete;

    const items = element.shadowRoot?.querySelectorAll('.nav-item');
    expect(items?.[0]?.classList.contains('active')).toBe(false);
    expect(items?.[1]?.classList.contains('active')).toBe(true);
    expect(items?.[2]?.classList.contains('active')).toBe(false);

    element.activeSection = 'history';
    await element.updateComplete;

    const itemsAfter = element.shadowRoot?.querySelectorAll('.nav-item');
    expect(itemsAfter?.[2]?.classList.contains('active')).toBe(true);
  });

  it('dispatches section-change with the clicked section id on click', async () => {
    await element.updateComplete;

    const events: CustomEvent<string>[] = [];
    const handler = (event: Event): void => {
      events.push(event as CustomEvent<string>);
    };
    element.addEventListener('section-change', handler);

    const items = element.shadowRoot?.querySelectorAll(
      '.nav-item'
    ) as NodeListOf<HTMLButtonElement>;
    items[1].click();

    expect(events).toHaveLength(1);
    expect(events[0].detail).toBe('all-services');
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
    expect(events[0].type).toBe('section-change');

    element.removeEventListener('section-change', handler);
  });

  it('lets the section-change event bubble past the sidebar boundary', async () => {
    await element.updateComplete;

    const handler = (event: Event): void => {
      expect(event.type).toBe('section-change');
      expect((event as CustomEvent<string>).detail).toBe('history');
    };
    document.addEventListener('section-change', handler);

    const items = element.shadowRoot?.querySelectorAll(
      '.nav-item'
    ) as NodeListOf<HTMLButtonElement>;
    items[2].click();

    document.removeEventListener('section-change', handler);
  });
});
