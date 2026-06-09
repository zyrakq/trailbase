export {
  i18next as i18n,
  LANGUAGES_KEY,
  langDataMaps,
  langMap,
  langNameMap,
  langLocaleMap,
} from './i18n';

export type { LanguageName, LanguageData, Locales, Language } from './i18n';

export {
  I18nProvider,
  useDateFnsLocale,
} from './i18n-context';

export { useTranslation, Trans } from 'react-i18next';

export { useLanguage } from './lang';