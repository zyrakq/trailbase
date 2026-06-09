import { useCallback } from "react";
import { Language, useTranslation } from "@/services/i18n";

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    async (language: Language) => {
      await i18n.changeLanguage(language);
    },
    [i18n]
  );

  return { changeLanguage };
};
