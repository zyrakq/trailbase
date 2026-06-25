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

vi.mock('@/features/auth', () => ({
  authService: {
    showLogin: vi.fn(),
  },
}));

import './welcome-content';
import type { WelcomeContent } from './welcome-content';
import { authService } from '@/features/auth';

describe('welcome-content', () => {
  let element: WelcomeContent;

  beforeEach(() => {
    vi.mocked(authService.showLogin).mockReset();
    element = document.createElement('welcome-content') as WelcomeContent;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders the hero title and subtitle', async () => {
    await element.updateComplete;

    const title = element.shadowRoot?.querySelector('.hero h1');
    const subtitle = element.shadowRoot?.querySelector('.hero .subtitle');

    expect(title?.textContent?.trim()).toBe(
      'Manage all your subscriptions in one place'
    );
    expect(subtitle?.textContent?.trim()).toBe(
      'Subscribe to, track, and manage access to the services you use.'
    );
  });

  it('renders three feature cards', async () => {
    await element.updateComplete;

    const cards = element.shadowRoot?.querySelectorAll('.feature-card');
    expect(cards?.length).toBe(3);

    const headings = Array.from(
      element.shadowRoot?.querySelectorAll('.feature-card h3') ?? []
    ).map((node) => node.textContent?.trim());

    expect(headings).toEqual([
      'All your services in one place',
      'Subscribe in one click',
      'Always know what is active',
    ]);
  });

  it('renders the Sign In to Get Started CTA label', async () => {
    await element.updateComplete;

    const cta = element.shadowRoot?.querySelector('button.btn-primary');
    expect(cta?.textContent?.trim()).toBe('Sign In to Get Started');
  });

  it('calls authService.showLogin when the CTA is clicked', async () => {
    await element.updateComplete;

    const cta = element.shadowRoot?.querySelector(
      'button.btn-primary'
    ) as HTMLButtonElement | null;
    expect(cta).toBeTruthy();
    cta?.click();

    expect(authService.showLogin).toHaveBeenCalledTimes(1);
  });
});
