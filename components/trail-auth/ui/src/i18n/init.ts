import {
  configureLocalization,
  str,
  LOCALE_STATUS_EVENT,
  type LocaleStatusEventDetail,
} from '@lit/localize';
import { sourceLocale, targetLocales } from '../generated/locale-codes.js';

// trail-auth's own @lit/localize instance — bundled into the IIFE,
// independent of any host app's instance.
const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale) => import(`/_/auth/locales/${locale}`),
});

class LocalizationService {
  private currentLocale: string = sourceLocale;

  init(locale?: string): void {
    if (locale && locale !== this.currentLocale) {
      void this.setLocale(locale);
    }
  }

  async setLocale(locale: string): Promise<void> {
    if (locale === this.currentLocale) return;
    this.currentLocale = locale;
    await setLocale(locale);
  }

  getLocale(): string {
    return getLocale();
  }

  // Mirror a lit-localize status event back into this service's
  // currentLocale so the setLocale() guard cannot desync from the
  // @lit/localize runtime — e.g. when a host changes locale through
  // its own localization instance and not through setLocale() here.
  syncFromStatusEvent(detail: LocaleStatusEventDetail): void {
    const next =
      detail.status === 'ready'
        ? detail.readyLocale
        : detail.status === 'loading'
          ? detail.loadingLocale
          : null;
    if (next) {
      this.currentLocale = next;
    }
  }
}

export const localizationService = new LocalizationService();

// The host app persists the active locale under this localStorage key
// (see app/ui/src/features/localization/data/locale-metadata.ts).
// Reading it on bundle load lets trail-auth render in the user's
// chosen language without the host having to call init() explicitly.
const ARGIAGO_LOCALE_STORAGE_KEY = 'argiago-locale';

window.addEventListener(LOCALE_STATUS_EVENT, (event) => {
  localizationService.syncFromStatusEvent(event.detail);
});

try {
  const stored = localStorage.getItem(ARGIAGO_LOCALE_STORAGE_KEY);
  if (stored && stored !== sourceLocale) {
    void localizationService.setLocale(stored);
  }
} catch {
  // localStorage may be unavailable (privacy mode, SSR); ignore.
}

export { str, LOCALE_STATUS_EVENT };
export type { LocaleStatusEventDetail };
