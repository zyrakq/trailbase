import { DefaultTheme } from 'styled-components';

import * as colors from './colors';

const lightTheme: DefaultTheme = {
  palette: {
    type: 'light',
    primary: {
      main: colors.orange,
      light: colors.orangeLight,
      dark: colors.orangeDark,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.gray[300],
      light: colors.gray[100],
      dark: colors.black,
      contrastText: colors.white,
    },
    error: {
      main: colors.red,
      light: colors.redLight,
      dark: colors.redDark,
      contrastText: colors.white,
    },
    background: {
      default: '#EFF2F6',
      backdrop: 'rgba(0, 0, 0, 0.6)',
      paper: colors.white,
    },
    text: {
      primary: colors.orange,
      secondary: colors.gray[800],
      disabled: colors.gray[800],
    },
    actions: {
      active: 'rgba(0, 0, 0, 0.08)',
      hover: 'rgba(0, 0, 0, 0.02)',
      disabled: colors.gray[100],
    },
    gray: colors.gray,
  },
  font: {
    fontFamily: '"Open Sans", sans-serif',
  },
  shadows: [
    'none',
    '0px 0px 5px rgba(0, 0, 0, 0.05)',
    '0px 5px 10px rgba(0, 0, 0, 0.05)',
  ],
};


const darkTheme: DefaultTheme = {
  palette: {
    type: 'dark',
    primary: {
      main: colors.green,
      light: colors.greenLight,
      dark: colors.greenDark,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.gray[400],
      light: colors.gray[750],
      dark: colors.gray[50],
      contrastText: colors.gray[850],
    },
    error: {
      main: colors.red,
      light: colors.redLight,
      dark: colors.redDark,
      contrastText: colors.white,
    },
    background: {
      default: colors.black,
      backdrop: 'rgba(0, 0, 0, 0.6)',
      paper: colors.gray[900],
    },
    text: {
      primary: colors.green,
      secondary: colors.white,
      disabled: colors.gray[300],
    },
    actions: {
      active: 'rgba(0, 0, 0, 0.08)',
      hover: 'rgba(0, 0, 0, 0.02)',
      disabled: colors.gray[800],
    },
    gray: colors.gray,
  },
  font: {
    fontFamily: '"Open Sans", sans-serif',
  },
  shadows: [
    'none',
    '0px 0px 5px rgba(0, 0, 0, 0.05)',
    '0px 5px 10px rgba(0, 0, 0, 0.05)',
  ],
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};