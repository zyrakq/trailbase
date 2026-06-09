import 'styled-components';

interface Color {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

declare module 'styled-components' {
  export interface DefaultTheme {
    palette: {
      type: 'light' | 'dark';
      primary: Color;
      secondary: Color;
      error: Color;
      text: {
        primary: string;
        secondary: string;
        disabled: string;
      };
      actions: {
        active: string;
        hover: string;
        disabled: string;
      };
      background: {
        default: string;
        backdrop: string;
        paper: string;
      };
      gray: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
    };
    font: {
      fontFamily: string;
    };
    shadows: [string, string, string];
  }
}
