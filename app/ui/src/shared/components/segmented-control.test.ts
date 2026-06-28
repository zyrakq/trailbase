import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  if (typeof localStorage !== 'undefined') return;
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key) { return store.has(key) ? (store.get(key) as string) : null; },
    key(index) { return Array.from(store.keys())[index] ?? null; },
    removeItem(key) { store.delete(key); },
    setItem(key, value) { store.set(key, value); },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill, writable: true, configurable: true,
  });
});

import './segmented-control';
import type { SegmentedControl } from './segmented-control';

describe('segmented-control', () => {
  let element: SegmentedControl;

  beforeEach(async () => {
    element = document.createElement('segmented-control') as SegmentedControl;
    element.values = ['monthly', 'quarterly', 'yearly', 'onetime'];
    element.labels = {
      monthly: 'Monthly', quarterly: 'Quarterly',
      yearly: 'Yearly', onetime: 'One-time',
    };
    element.value = '';
    element.disabledValues = [];
    document.body.appendChild(element);
    // happy-dom defers Lit's scheduled update via queueMicrotask; flush a
    // macrotask so the shadow DOM is populated before each test runs.
    await new Promise(r => setTimeout(r, 0));
    await element.updateComplete;
  });

  afterEach(() => {
    element?.remove();
  });

  it('renders one pill per value with the provided label', async () => {
    await element.updateComplete;
    const pills = element.shadowRoot!.querySelectorAll('button.pill');
    expect(pills.length).toBe(4);
    expect(pills[0].textContent?.trim()).toBe('Monthly');
    expect(pills[3].textContent?.trim()).toBe('One-time');
  });

  it('marks the value pill as active', async () => {
    element.value = 'yearly';
    await element.updateComplete;
    const active = element.shadowRoot!.querySelector('button.pill.active');
    expect(active?.textContent?.trim()).toBe('Yearly');
  });

  it('disables disabledValues pills and blocks their select event', async () => {
    element.disabledValues = ['monthly'];
    await element.updateComplete;
    const pills = element.shadowRoot!.querySelectorAll('button.pill');
    expect(pills[0].getAttribute('aria-disabled')).toBe('true');

    let fired = false;
    element.addEventListener('select', () => { fired = true; });
    (pills[0] as HTMLButtonElement).click();
    expect(fired).toBe(false);
  });

  it('emits select with the clicked value', async () => {
    await element.updateComplete;
    let received: string | null = null;
    element.addEventListener('select', (e: Event) => {
      received = (e as CustomEvent<{ value: string }>).detail.value;
    });
    const pills = element.shadowRoot!.querySelectorAll('button.pill');
    (pills[2] as HTMLButtonElement).click();
    expect(received).toBe('yearly');
  });
});
