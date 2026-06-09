import React, { createContext, useState, useContext, Context, FC } from "react";
import { DefaultTheme, ThemeProvider } from "styled-components";
import { GlobalStyle } from "@/GlobalStyle";
import { themes } from "@/theme";

interface ThemeService {
  theme: DefaultTheme;
  themeToggler: () => void;
}

const getTheme = () => {
  const themeName = `${window?.localStorage?.getItem("theme")}`;

  const theme: DefaultTheme | undefined = Object.values(themes).find(
    (e) => e.palette.type.toString() === themeName
  );

  if (theme) return theme;

  const userMedia = window.matchMedia("(prefers-color-scheme: dark)");
  if (userMedia.matches) return themes.dark;

  return themes.light;
};

const useThemeService = (): ThemeService => {
  const [theme, setTheme] = useState(getTheme());

  const themeToggler = () =>
    theme.palette.type === "light"
      ? setTheme(themes.dark)
      : setTheme(themes.light);

  return { theme, themeToggler };
};

// Declare ThemeContext namespace
const ThemeContext = createContext<ThemeService | null>(null);

export const useTheme = (): ThemeService =>
  useContext(ThemeContext as Context<ThemeService>);

interface Props {
  children: React.ReactNode;
}

export const ThemeSwitcherProvider: FC<Props> = ({ children }) => {
  const themeService = useThemeService();

  React.useEffect(() => {
    document.documentElement.dataset.theme =
      themeService.theme.palette.type.toString();
    localStorage.setItem("theme", themeService.theme.palette.type.toString());
  }, [themeService.theme]);

  return (
    <ThemeContext.Provider value={themeService}>
      <ThemeProvider theme={themeService.theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
