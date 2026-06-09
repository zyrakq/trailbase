import {
  Context,
  FC,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { I18nextProvider, useTranslation } from "react-i18next";

import { Locale, format, formatRelative as fnsFormatRelative } from "date-fns";
import enLocale from "date-fns/locale/en-US/index";

import { i18next, Language, langLocaleMap } from "./i18n";

const importLocale = async (language: string) => {
  const lazyLocale = await import(
    `date-fns/esm/locale/${langLocaleMap[language as Language]}/index`
  );

  return lazyLocale.default as Locale;
};

interface DateFnsLocaleService {
  locale: Locale;
  parseISOWithTimezone: (date: string) => Date;
  formatRelative: (date: Date, baseDate: Date) => string;
}

const useDateFnsLocaleService = (): DateFnsLocaleService => {
  const [locale, setLocale] = useState(enLocale);
  const { i18n } = useTranslation();

  const updateLocale = useCallback(async () => {
    if (i18n.language) {
      const newLocale = await importLocale(i18n.language);
      setLocale(newLocale);
    }
  }, [i18n.language]);

  const formatRelativeLocale = (
    token: any,
    date: any,
    baseDate: any,
    options: any
  ) => {
    if (token === "other") {
      const formattedTime = format(date, "PP p", { locale: locale });
      return `'${formattedTime}'`;
    }
    return (
      locale.formatRelative as (
        token: string,
        date: Date,
        baseDate: Date,
        options: object
      ) => string
    )(token, date, baseDate, options);
  };

  const formatRelative = (date: Date, baseDate: Date) => {
    return fnsFormatRelative(date, baseDate, {
      locale: { ...locale, formatRelative: formatRelativeLocale },
    });
  };

  useEffect(() => {
    updateLocale();
  }, [updateLocale]);

  /**
   * Парсит полученную строку с поправкой на текущий
   * часовой пояс браузера
   * @param date строка в формате ISO
   * @returns возращает объект даты
   */
  const parseISOWithTimezone = (date: string) => {
    return new Date(
      new Date(date).getTime() - new Date().getTimezoneOffset() * 60000
    );
  };

  return { locale, parseISOWithTimezone, formatRelative };
};

const DateFnsLocaleContext = createContext<DateFnsLocaleService | null>(null);

export const useDateFnsLocale = (): DateFnsLocaleService =>
  useContext(DateFnsLocaleContext as Context<DateFnsLocaleService>);

interface Props {
  children: React.ReactNode;
}

export const I18nProvider: FC<Props> = ({ children }) => {
  const dateFnsLocaleService = useDateFnsLocaleService();

  return (
    <I18nextProvider i18n={i18next}>
      <DateFnsLocaleContext.Provider value={dateFnsLocaleService}>
        {children}
      </DateFnsLocaleContext.Provider>
    </I18nextProvider>
  );
};
