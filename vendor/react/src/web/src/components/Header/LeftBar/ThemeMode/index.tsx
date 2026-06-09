import { DarkMode, LightMode } from "@styled-icons/material-outlined";
import { FC, useMemo } from "react";
import { useTheme } from "@/services/theme";
import { IconButton } from "@/ui";

export const ThemeMode: FC = () => {
  const { theme, themeToggler } = useTheme();
  const isLight = useMemo(() => theme.palette.type === "light", [theme]);
  return (
    <IconButton onClick={themeToggler}>
      {isLight ? <LightMode size={24} /> : <DarkMode size={24} />}
    </IconButton>
  );
};
