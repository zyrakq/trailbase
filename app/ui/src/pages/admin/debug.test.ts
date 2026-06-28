import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    value: polyfill,
    writable: true,
    configurable: true,
  });
});

const mockAuth = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(undefined),
  isAdmin: vi.fn().mockReturnValue(true),
  isAuthenticated: vi.fn().mockReturnValue(false),
  getUser: vi.fn().mockReturnValue(null),
  onAuthStateChange: vi.fn().mockReturnValue(() => {}),
}));

const mockNotify = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

const mockSubs = vi.hoisted(() => ({
  getById: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue({ id: 'new-id' }),
  update: vi.fn().mockResolvedValue(undefined),
  uploadLogo: vi.fn().mockResolvedValue('/subscription-logos/test.png'),
}));

vi.mock('@/features/auth', () => ({ authService: mockAuth }));
vi.mock('@/features/notifications', () => ({ notificationService: mockNotify }));
vi.mock('@/features/subscriptions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/subscriptions')>();
  return { ...actual, subscriptionsService: mockSubs };
});

import './subscription-form-page';
import type { SubscriptionFormPage } from './subscription-form-page';
import { localizationService } from '@/features/localization';

async function flush(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe('debug', () => {
  it('checks image-cropper in isolation', async () => {
    localizationService.init();
    const cropper = document.createElement('image-cropper');
    document.body.appendChild(cropper);
    await flush();
    await (cropper as unknown as { updateComplete: Promise<void> }).updateComplete;
    console.log('image-cropper shadow:', cropper.shadowRoot?.innerHTML?.substring(0, 300));
    cropper.remove();
  });

  it('checks tab switching', async () => {
    localizationService.init();
    const element = document.createElement('subscription-form-page') as SubscriptionFormPage;
    document.body.appendChild(element);
    await flush();
    await element.updateComplete;

    (element as unknown as { _activeTab: string })._activeTab = 'logo';
    await element.updateComplete;
    await flush();
    await element.updateComplete;

    console.log('After direct set, activeTab:', (element as unknown as { _activeTab: string })._activeTab);
    console.log('Has image-cropper:', !!element.shadowRoot?.querySelector('image-cropper'));
    const form = element.shadowRoot?.querySelector('form.form');
    console.log('Form innerHTML:', form?.innerHTML);

    element.remove();
  });
});
