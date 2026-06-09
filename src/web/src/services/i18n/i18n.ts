import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import intervalPlural from 'i18next-intervalplural-postprocessor';

import flagUs from '@/assets/lang/united-states.svg';
import flagRu from '@/assets/lang/russian-federation.svg';

export const LANGUAGES_KEY = 'lang';

export type Language = 'en' | 'ru';

export enum Locales {
  EN = 'en-US',
  RU = 'ru',
}

export enum LanguageName {
  EN = 'English',
  RU = 'Русский',
}

export interface LanguageData {
  id: number;
  name: Language;
  title: string;
  flag: string;
}

export const langDataMaps: LanguageData[] = [
  {
    id: 1,
    title: 'ENG',
    name: 'en',
    flag: flagUs,
  },
  {
    id: 2,
    name: 'ru',
    title: 'RUS',
    flag: flagRu,
  },

];

export const langMap: Language[] = langDataMaps.map(
  (el) => el.name,
);

export const langNameMap: Record<Language, string> = {
  en: LanguageName.EN,
  ru: LanguageName.RU,
};

export const langLocaleMap: Record<Language, Locales> = {
  en: Locales.EN,
  ru: Locales.RU,
};

i18n
.use(Backend)
.use(LanguageDetector)
.use(intervalPlural)
.use(initReactI18next)
.init({
  returnNull: false,
  fallbackLng: 'ru',
  supportedLngs: langMap,
  backend: {
    loadPath: '/locales/{{lng}}.json',
  },
  detection: {
    order: ['localStorage'],
    lookupLocalStorage: LANGUAGES_KEY,
  },
  react: {
    useSuspense: false,
  },
});
export const i18next = i18n;
