import { FC, useMemo } from 'react';
import { useTheme } from 'styled-components';

export const EmptySubscriptionTypeList: FC = () => {
  const theme = useTheme();
  const isLight = useMemo(() => theme.palette.type === "light", [theme]);

  const colors =  useMemo(() => {
    return isLight ? 
    {
      one: theme.palette.primary.main,
      two: theme.palette.gray[600],
    }
     : 
    {
      one: theme.palette.primary.main,
      two: theme.palette.secondary.dark,
    }
  }, [theme, isLight]);

  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path d="m28 38h-8a2 2 0 0 1 0-4h8a2 2 0 0 1 0 4z" fill={colors.one}/>
      <g fill={colors.two}>
        <path d="m18 22a1 1 0 0 1 -2 0 1 1 0 0 1 2 0z"/>
        <path d="m18 26a1 1 0 0 1 -2 0 1 1 0 0 1 2 0z"/>
        <path d="m18 30a1 1 0 0 1 -2 0 1 1 0 0 1 2 0z"/>
        <path d="m6 25a1 1 0 0 1 -2 0 1 1 0 0 1 2 0z"/>
        <path d="m6 29a1 1 0 0 1 -2 0 1 1 0 0 1 2 0z"/>
        <path d="m6 33a1 1 0 0 1 -2 0 1 1 0 0 1 2 0z"/>
        <path d="m31 23h-10a1 1 0 0 1 0-2h10a1 1 0 0 1 0 2z"/>
        <path d="m31 27h-10a1 1 0 0 1 0-2h10a1 1 0 0 1 0 2z"/>
        <path d="m31 31h-10a1 1 0 0 1 0-2h10a1 1 0 0 1 0 2z"/>
      </g>
      <rect fill={colors.one} height="8" rx="1" width="16" x="16" y="10"/>
      <rect fill={colors.one} height="8" rx="1" width="9" x="35" y="13"/>
      <rect fill={colors.one} height="8" rx="1" width="9" x="4" y="13"/>
      <path  fill={colors.two} d="m45 8h-8a3 3 0 0 0 -3-3h-20a3 3 0 0 0 -3 3h-8a3 3 0 0 0 -3 3v26a3 3 0 0 0 3 3h8a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3h8a3 3 0 0 0 3-3v-26a3 3 0 0 0 -3-3zm-42 30a1 1 0 0 1 -1-1v-26a1 1 0 0 1 1-1h8v14h-2a1 1 0 0 0 0 2h2v2h-2a1 1 0 0 0 0 2h2v2h-2a1 1 0 0 0 0 2h2v4zm32 2a1 1 0 0 1 -1 1h-20a1 1 0 0 1 -1-1v-32a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1zm11-3a1 1 0 0 1 -1 1h-8v-4h6a1 1 0 0 0 0-2h-6v-2h6a1 1 0 0 0 0-2h-6v-2h6a1 1 0 0 0 0-2h-6v-14h8a1 1 0 0 1 1 1z" />
  </svg>
  );
};
