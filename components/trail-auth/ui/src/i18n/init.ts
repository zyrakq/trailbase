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
}

export const localizationService = new LocalizationService();

// The host app persists the active locale under this localStorage key
// (see app/ui/src/features/localization/data/locale-metadata.ts).
// Reading it on bundle load lets trail-auth render in the user's
// chosen language without the host having to call init() explicitly.
const VELORA_LOCALE_STORAGE_KEY = 'velora-locale';

// Listen for locale changes dispatched by the host app's own
// @lit/localize instance. When the host switches locale, this listener
// mirrors the switch into trail-auth's independent @lit/localize instance
// by calling setLocale(), which triggers loadLocale → fetch locale module
// from WASM → lit-localize-status event → component re-render.
window.addEventListener(LOCALE_STATUS_EVENT, (event) => {
  const detail = (event as CustomEvent<LocaleStatusEventDetail>).detail;
  if (!detail) return;
  const locale =
    detail.status === 'loading' ? detail.loadingLocale : detail.readyLocale;
  if (locale && locale !== localizationService.getLocale()) {
    void localizationService.setLocale(locale);
  }
});

try {
  const stored = localStorage.getItem(VELORA_LOCALE_STORAGE_KEY);
  if (stored && stored !== sourceLocale) {
    void localizationService.setLocale(stored);
  }
} catch {
  // localStorage may be unavailable (privacy mode, SSR); ignore.
}

export { str, LOCALE_STATUS_EVENT };
export type { LocaleStatusEventDetail };
