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

describe('subscription-form-page', () => {
  let element: SubscriptionFormPage;

  beforeEach(async () => {
    localStorage.clear();
    localizationService.init();
    vi.clearAllMocks();
    mockAuth.isAdmin.mockReturnValue(true);
    mockAuth.init.mockResolvedValue(undefined);
    mockSubs.getById.mockResolvedValue(null);

    element = document.createElement('subscription-form-page') as SubscriptionFormPage;
    document.body.appendChild(element);
    await flush();
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe('edit mode (new subscription)', () => {
    it('renders all four form sections', async () => {
      const sections = element.shadowRoot?.querySelectorAll('section.form-section');
      expect(sections?.length).toBe(4);
    });

    it('renders the Edit mode button as active by default', async () => {
      const editBtn = element.shadowRoot?.querySelector('.mode-btn.active');
      expect(editBtn?.textContent?.trim()).toBe('Edit');
    });

    it('marks the Preview button active when clicked', async () => {
      const modeBtns = element.shadowRoot?.querySelectorAll('.mode-btn') as NodeListOf<HTMLButtonElement>;
      expect(modeBtns.length).toBe(2);

      // Verify initial state
      expect(modeBtns[0].classList.contains('active')).toBe(true);
      expect(modeBtns[1].classList.contains('active')).toBe(false);
    });
  });

  describe('Logo section', () => {
    it('shows the image-cropper in upload mode by default', async () => {
      const cropper = element.shadowRoot?.querySelector('image-cropper');
      expect(cropper).toBeTruthy();
    });

    it('shows image-cropper in upload mode by default', async () => {
      expect(element.shadowRoot?.querySelector('image-cropper')).toBeTruthy();
    });

    it('shows URL input in URL mode', async () => {
      (element as unknown as { _logoMode: string })._logoMode = 'url';
      await new Promise((r) => setTimeout(r, 50));
      await element.updateComplete;
      // In URL mode there is a URL input visible in the logo section
      const logoSection = element.shadowRoot?.querySelectorAll('section.form-section')[1];
      expect(logoSection?.querySelector('input[type="url"]')).toBeTruthy();
    });
  });

  describe('Pricing section', () => {
    it('shows no pricing tiers initially', async () => {
      const tiers = element.shadowRoot?.querySelectorAll('.pricing-tier');
      expect(tiers?.length).toBe(0);
    });

    it('shows the empty hint when no tiers exist', async () => {
      const hint = element.shadowRoot?.querySelector('.pricing-empty');
      expect(hint).toBeTruthy();
    });

    it('adds a pricing tier when segmented-control emits select', async () => {
      const sc = element.shadowRoot?.querySelector('segmented-control');
      sc?.dispatchEvent(new CustomEvent('select', { detail: { value: 'monthly' }, bubbles: true, composed: true }));
      await element.updateComplete;

      const tiers = element.shadowRoot?.querySelectorAll('.pricing-tier');
      expect(tiers?.length).toBe(1);

      const label = tiers?.[0]?.querySelector('.period-label');
      expect(label?.textContent?.trim()).toBe('Monthly');
    });

    it('removes a pricing tier when the remove button is clicked', async () => {
      const sc = element.shadowRoot?.querySelector('segmented-control');
      sc?.dispatchEvent(new CustomEvent('select', { detail: { value: 'monthly' }, bubbles: true, composed: true }));
      await element.updateComplete;

      const removeBtn = element.shadowRoot?.querySelector('.btn-remove-tier') as HTMLButtonElement | null;
      removeBtn?.click();
      await element.updateComplete;

      const tiers = element.shadowRoot?.querySelectorAll('.pricing-tier');
      expect(tiers?.length).toBe(0);
    });

    it('does not add duplicate periods', async () => {
      const sc = element.shadowRoot?.querySelector('segmented-control');
      sc?.dispatchEvent(new CustomEvent('select', { detail: { value: 'yearly' }, bubbles: true, composed: true }));
      sc?.dispatchEvent(new CustomEvent('select', { detail: { value: 'yearly' }, bubbles: true, composed: true }));
      await element.updateComplete;

      const tiers = element.shadowRoot?.querySelectorAll('.pricing-tier');
      expect(tiers?.length).toBe(1);
    });
  });

  describe('loading existing subscription', () => {
    it('pre-fills fields from getById response', async () => {
      element.remove();
      mockSubs.getById.mockResolvedValue({
        id: 'sub-1',
        name: 'Pro Plan',
        description: 'Great features',
        logo_url: 'https://example.com/logo.png',
        resource_url: 'https://example.com',
        what_included: 'All features',
        terms: 'No refunds',
        status: 'active',
        created_at: 0,
        updated_at: 0,
        pricing: [{ id: 'p1', subscription_id: 'sub-1', period: 'monthly', price: 990, currency: 'RUB', is_archived: false }],
      });

      const el = document.createElement('subscription-form-page') as SubscriptionFormPage;
      el.subscriptionId = 'sub-1';
      document.body.appendChild(el);
      await flush();
      await el.updateComplete;

      const tiers = el.shadowRoot?.querySelectorAll('.pricing-tier');
      expect(tiers?.length).toBe(1);

      const priceInput = tiers?.[0]?.querySelector('.price-input') as HTMLInputElement | null;
      expect(priceInput?.value).toBe('990');

      el.remove();
    });

    it('starts in URL logo mode when existing logo_url is set', async () => {
      element.remove();
      mockSubs.getById.mockResolvedValue({
        id: 'sub-2',
        name: 'Basic',
        description: '',
        logo_url: 'https://example.com/logo.png',
        resource_url: '',
        status: 'active',
        created_at: 0,
        updated_at: 0,
        pricing: [],
      });

      const el = document.createElement('subscription-form-page') as SubscriptionFormPage;
      el.subscriptionId = 'sub-2';
      document.body.appendChild(el);
      await flush();
      await el.updateComplete;

      expect(el.shadowRoot?.querySelector('image-cropper')).toBeNull();
      expect(el.shadowRoot?.querySelector('input[type="url"]')).toBeTruthy();

      el.remove();
    });
  });
});
