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

vi.mock('@/shared/components/app-header', () => ({}));
vi.mock('@/shared/components/footer-info', () => ({}));
vi.mock('./welcome/welcome-content', () => ({}));
vi.mock('./dashboard/dashboard-layout', () => ({}));

vi.mock('@/features/auth', () => ({
  authService: {
    init: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockReturnValue(false),
    getAuthState: vi.fn().mockReturnValue({
      isAuthenticated: false,
      user: null,
      hasMfa: false,
    }),
    showLogin: vi.fn(),
  },
}));

vi.mock('@/features/notifications', () => ({
  notificationService: { error: vi.fn() },
}));

import './home-page';
import type { HomePage } from './home-page';
import { authService } from '@/features/auth';
import { localizationService } from '@/features/localization';

async function flushReady(element: HomePage): Promise<void> {
  await element.updateComplete;
  await new Promise((r) => setTimeout(r));
  await element.updateComplete;
}

describe('home-page', () => {
  let element: HomePage;

  beforeEach(() => {
    localStorage.clear();
    localizationService.init();
    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: false,
      user: null,
      hasMfa: false,
    });
    element = document.createElement('home-page') as HomePage;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders welcome-content (not dashboard-layout) when unauthenticated', async () => {
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('dashboard-layout')).toBeNull();
    expect(element.shadowRoot?.querySelector('welcome-content')).not.toBeNull();
  });

  it('renders dashboard-layout with drawerOpen=false when authenticated', async () => {
    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: true,
      user: null,
      hasMfa: false,
    });
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await flushReady(element);

    const layout = element.shadowRoot?.querySelector('dashboard-layout');
    expect(layout).not.toBeNull();
    expect((layout as any).drawerOpen).toBe(false);
  });

  it('flips drawerOpen to true when app-header dispatches menu-toggle', async () => {
    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: true,
      user: null,
      hasMfa: false,
    });
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await flushReady(element);

    const header = element.shadowRoot?.querySelector(
      'app-header'
    ) as HTMLElement;
    header.dispatchEvent(
      new CustomEvent('menu-toggle', { bubbles: true, composed: true })
    );
    await element.updateComplete;

    const layout = element.shadowRoot?.querySelector('dashboard-layout');
    expect((layout as any).drawerOpen).toBe(true);
  });

  it('sets drawerOpen back to false when dashboard-layout dispatches drawer-close', async () => {
    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: true,
      user: null,
      hasMfa: false,
    });
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await flushReady(element);

    const header = element.shadowRoot?.querySelector(
      'app-header'
    ) as HTMLElement;
    header.dispatchEvent(
      new CustomEvent('menu-toggle', { bubbles: true, composed: true })
    );
    await element.updateComplete;
    expect(
      (element.shadowRoot?.querySelector('dashboard-layout') as any).drawerOpen
    ).toBe(true);

    const layout = element.shadowRoot?.querySelector(
      'dashboard-layout'
    ) as HTMLElement;
    layout.dispatchEvent(
      new CustomEvent('drawer-close', { bubbles: true, composed: true })
    );
    await element.updateComplete;

    expect(
      (element.shadowRoot?.querySelector('dashboard-layout') as any).drawerOpen
    ).toBe(false);
  });

  it('resets drawerOpen to false on sign-out and stays closed on re-auth', async () => {
    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: true,
      user: null,
      hasMfa: false,
    });
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await flushReady(element);

    const header = element.shadowRoot?.querySelector(
      'app-header'
    ) as HTMLElement;
    header.dispatchEvent(
      new CustomEvent('menu-toggle', { bubbles: true, composed: true })
    );
    await element.updateComplete;
    expect(
      (element.shadowRoot?.querySelector('dashboard-layout') as any).drawerOpen
    ).toBe(true);

    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: false,
      user: null,
      hasMfa: false,
    });
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('dashboard-layout')).toBeNull();

    vi.mocked(authService.getAuthState).mockReturnValue({
      isAuthenticated: true,
      user: null,
      hasMfa: false,
    });
    window.dispatchEvent(new CustomEvent('auth-state-updated'));
    await flushReady(element);

    const layout = element.shadowRoot?.querySelector('dashboard-layout');
    expect(layout).not.toBeNull();
    expect((layout as any).drawerOpen).toBe(false);
  });
});
