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
  loadLocale: (locale) => import(`/_/auth/locales/${locale}.js`),
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
export { str, LOCALE_STATUS_EVENT };
export type { LocaleStatusEventDetail };
