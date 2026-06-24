// Singleton service that lazily injects the wcauth bundle script and waits
// for the related custom elements to register. Exposes a status event so that
// UI components can react to loading, ready, and error transitions.

export type BundleStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface BundleStatusDetail {
  status: BundleStatus;
  error: Error | null;
}

export const BUNDLE_STATUS_CHANGED = 'bundle-status-changed';

export const WCAUTH_BUNDLE_URL = '/_/auth/bundle.js';
export const WCAUTH_ELEMENT = 'wcauth-section';
export const WCAUTH_PROFILE_ELEMENT = 'wcauth-profile';
export const REGISTRATION_TIMEOUT_MS = 10_000;

class BundleLoaderService {
  private static instance: BundleLoaderService;

  private constructor() {}

  static getInstance(): BundleLoaderService {
    if (!BundleLoaderService.instance) {
      BundleLoaderService.instance = new BundleLoaderService();
    }
    return BundleLoaderService.instance;
  }

  private status: BundleStatus = 'idle';
  private lastError: Error | null = null;
  private inFlight: Promise<void> | null = null;

  getStatus(): BundleStatus {
    return this.status;
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  loadWcAuth(): Promise<void> {
    if (this.status === 'ready') return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    return (this.inFlight = this._load());
  }

  retry(): Promise<void> {
    this.lastError = null;
    this._setStatus('idle');
    this.inFlight = null;
    document
      .querySelectorAll<HTMLScriptElement>(
        `script[src="${WCAUTH_BUNDLE_URL}"][data-bundle-failed]`
      )
      .forEach((s) => s.remove());
    return this.loadWcAuth();
  }

  private async _load(): Promise<void> {
    this.lastError = null;
    this._setStatus('loading');
    try {
      await this._injectScript();
      await this._waitForElements();
      this._setStatus('ready');
    } catch (err) {
      this.lastError = err instanceof Error ? err : new Error(String(err));
      this._setStatus('error');
      throw this.lastError;
    }
  }

  private _injectScript(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${WCAUTH_BUNDLE_URL}"]:not([data-bundle-failed])`
      );
      if (existing) {
        if (existing.dataset.bundleLoaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener(
          'load',
          () => {
            existing.dataset.bundleLoaded = 'true';
            resolve();
          },
          { once: true }
        );
        existing.addEventListener(
          'error',
          () => {
            existing.setAttribute('data-bundle-failed', 'true');
            reject(new Error('Bundle script failed to load'));
          },
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = WCAUTH_BUNDLE_URL;
      script.addEventListener(
        'load',
        () => {
          script.dataset.bundleLoaded = 'true';
          resolve();
        },
        { once: true }
      );
      script.addEventListener(
        'error',
        () => {
          script.setAttribute('data-bundle-failed', 'true');
          reject(new Error('Bundle script failed to load'));
        },
        { once: true }
      );
      document.head.appendChild(script);
    });
  }

  private async _waitForElements(): Promise<void> {
    const elementsReady = Promise.all([
      customElements.whenDefined(WCAUTH_ELEMENT),
      customElements.whenDefined(WCAUTH_PROFILE_ELEMENT),
    ]);
    await this._withTimeout(
      elementsReady,
      REGISTRATION_TIMEOUT_MS,
      'Trail auth elements failed to register within timeout'
    );
  }

  private _withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    message: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (reason) => {
          clearTimeout(timer);
          reject(reason);
        }
      );
    });
  }

  private _setStatus(next: BundleStatus): void {
    if (this.status === next) return;
    this.status = next;
    this._dispatch({ status: next, error: this.lastError });
  }

  private _dispatch(detail: BundleStatusDetail): void {
    window.dispatchEvent(
      new CustomEvent(BUNDLE_STATUS_CHANGED, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }
}

export { BundleLoaderService };

export const bundleLoader = BundleLoaderService.getInstance();
