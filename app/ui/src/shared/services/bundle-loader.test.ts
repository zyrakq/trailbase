import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BundleStatusDetail } from './bundle-loader';

describe('BundleLoaderService', () => {
  let appendedScripts: HTMLScriptElement[];

  beforeEach(() => {
    vi.resetModules();
    appendedScripts = [];
    document
      .querySelectorAll('script[src*="bundle.js"]')
      .forEach((s) => s.remove());

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string, options?: ElementCreationOptions) =>
        originalCreateElement(tagName, options)
    );

    vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
      if (node instanceof HTMLScriptElement) {
        appendedScripts.push(node);
      }
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  async function loadService() {
    return import('./bundle-loader');
  }

  function latestBundleScript(): HTMLScriptElement | null {
    return appendedScripts.at(-1) ?? null;
  }

  function mockWhenDefinedResolved() {
    return vi
      .spyOn(customElements, 'whenDefined')
      .mockImplementation(() =>
        Promise.resolve(class {} as CustomElementConstructor)
      );
  }

  function captureBundleEvents(): {
    events: BundleStatusDetail[];
    restore: () => void;
  } {
    const events: BundleStatusDetail[] = [];
    const spy = vi.spyOn(window, 'dispatchEvent');
    spy.mockImplementation((event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.type === 'bundle-status-changed'
      ) {
        events.push(event.detail as BundleStatusDetail);
      }
      return true;
    });
    return { events, restore: () => spy.mockRestore() };
  }

  it('happy path: injects module script, waits for elements, transitions to ready', async () => {
    const { bundleLoader } = await loadService();
    mockWhenDefinedResolved();

    const promise = bundleLoader.loadWcAuth();

    expect(bundleLoader.getStatus()).toBe('loading');
    expect(bundleLoader.getLastError()).toBeNull();
    expect(appendedScripts).toHaveLength(1);

    const script = latestBundleScript();
    expect(script).not.toBeNull();
    expect(script?.type).toBe('module');
    expect(script?.src).toContain('/_/auth/bundle.js');

    script?.dispatchEvent(new Event('load'));

    await promise;

    expect(bundleLoader.getStatus()).toBe('ready');
    expect(bundleLoader.getLastError()).toBeNull();
  });

  it('rejects when script.onerror fires and marks script as failed', async () => {
    const { bundleLoader } = await loadService();
    mockWhenDefinedResolved();

    const promise = bundleLoader.loadWcAuth();

    const script = latestBundleScript();
    script?.dispatchEvent(new Event('error'));

    await expect(promise).rejects.toBeInstanceOf(Error);
    expect(bundleLoader.getStatus()).toBe('error');
    expect(bundleLoader.getLastError()).toBeInstanceOf(Error);
    expect(script?.getAttribute('data-bundle-failed')).toBe('true');
  });

  it('returns immediately when already ready: no new script, no event', async () => {
    const { bundleLoader } = await loadService();
    mockWhenDefinedResolved();

    const first = bundleLoader.loadWcAuth();
    const script1 = latestBundleScript();
    script1?.dispatchEvent(new Event('load'));
    await first;
    expect(bundleLoader.getStatus()).toBe('ready');

    const { events, restore } = captureBundleEvents();

    await bundleLoader.loadWcAuth();

    expect(bundleLoader.getStatus()).toBe('ready');
    expect(appendedScripts).toHaveLength(1);
    expect(events).toHaveLength(0);

    restore();
  });

  it('concurrent calls share one script element and one in-flight promise', async () => {
    const { bundleLoader } = await loadService();
    mockWhenDefinedResolved();

    const p1 = bundleLoader.loadWcAuth();
    const p2 = bundleLoader.loadWcAuth();
    const p3 = bundleLoader.loadWcAuth();

    expect(p1).toBe(p2);
    expect(p2).toBe(p3);

    expect(appendedScripts).toHaveLength(1);

    appendedScripts[0]?.dispatchEvent(new Event('load'));

    await Promise.all([p1, p2, p3]);
    expect(bundleLoader.getStatus()).toBe('ready');
  });

  it('retry removes the failed script and reinjects a fresh one', async () => {
    const { bundleLoader } = await loadService();
    mockWhenDefinedResolved();

    const first = bundleLoader.loadWcAuth();
    const script1 = latestBundleScript();
    script1?.dispatchEvent(new Event('error'));
    await expect(first).rejects.toBeInstanceOf(Error);
    expect(bundleLoader.getStatus()).toBe('error');

    const removeSpy = vi.spyOn(script1!, 'remove');
    vi.spyOn(document, 'querySelectorAll').mockImplementation(
      (selector: string) =>
        selector === 'script[src="/_/auth/bundle.js"][data-bundle-failed]'
          ? ([script1] as unknown as NodeListOf<HTMLScriptElement>)
          : ([] as unknown as NodeListOf<HTMLScriptElement>)
    );

    const retryPromise = bundleLoader.retry();
    expect(bundleLoader.getStatus()).toBe('loading');
    expect(removeSpy).toHaveBeenCalledTimes(1);

    const script2 = latestBundleScript();
    expect(script2).not.toBeNull();
    expect(script2).not.toBe(script1);

    script2?.dispatchEvent(new Event('load'));

    await retryPromise;
    expect(bundleLoader.getStatus()).toBe('ready');
  });

  it('dispatches bundle-status-changed with the correct detail on every transition', async () => {
    const { bundleLoader } = await loadService();
    mockWhenDefinedResolved();
    const { events, restore } = captureBundleEvents();

    // First load: idle -> loading -> ready
    const first = bundleLoader.loadWcAuth();
    const script1 = latestBundleScript();
    script1?.dispatchEvent(new Event('load'));
    await first;

    expect(events).toEqual([
      { status: 'loading', error: null },
      { status: 'ready', error: null },
    ]);

    // Retry that fails: ready -> idle -> loading -> error
    events.length = 0;
    const retried = bundleLoader.retry();
    const script2 = latestBundleScript();
    script2?.dispatchEvent(new Event('error'));
    await expect(retried).rejects.toBeInstanceOf(Error);

    expect(events).toEqual([
      { status: 'idle', error: null },
      { status: 'loading', error: null },
      { status: 'error', error: expect.any(Error) },
    ]);

    restore();
  });

  it('rejects with a timeout error when custom elements never register', async () => {
    vi.useFakeTimers();

    const { bundleLoader } = await loadService();
    vi.spyOn(customElements, 'whenDefined').mockImplementation(
      () => new Promise(() => {})
    );

    const promise = bundleLoader.loadWcAuth();
    promise.catch(() => undefined);

    const script = latestBundleScript();
    script?.dispatchEvent(new Event('load'));

    // Flush microtasks so the script load resolves and _waitForElements starts.
    await vi.advanceTimersByTimeAsync(0);

    // Advance past the registration timeout (10_000ms).
    await vi.advanceTimersByTimeAsync(11_000);

    await expect(promise).rejects.toThrow(/timeout/i);
    expect(bundleLoader.getStatus()).toBe('error');
    expect(bundleLoader.getLastError()).toBeInstanceOf(Error);
  });
});
