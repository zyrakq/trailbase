import { colord } from 'colord';

export const white = '#fff';

export const black = 'hsl(0, 0%, 0%)';

export const gray = {
  50: colord(white).darken(0.05).toHex(),
  100: colord(white).darken(0.1).toHex(),
  200: colord(white).darken(0.2).toHex(),
  300: colord(white).darken(0.3).toHex(),
  400: colord(white).darken(0.4).toHex(),
  500: colord(white).darken(0.5).toHex(),
  600: colord(white).darken(0.6).toHex(),
  700: colord(white).darken(0.7).toHex(),
  750: colord(white).darken(0.75).toHex(),
  800: colord(white).darken(0.8).toHex(),
  850: colord(white).darken(0.85).toHex(),
  900: colord(white).darken(0.9).toHex(),
};



export const orange = 'hsl(39, 98%, 50%)';
export const orangeLight = 'hsl(44, 100%, 50%)';
export const orangeDark = 'hsl(34, 100%, 50%)';




//export const green = '#1dac8d';
export const green = 'hsl(165, 60%, 40%)';
export const greenLight = 'hsl(165, 40%, 60%)';
export const greenDark = 'hsl(165, 70%, 30%)';


export const red = 'hsl(359, 78%, 57%)';
export const redLight = 'hsl(359, 87%, 65%)';
export const redDark = 'hsl(359, 87%, 49%)';


export const purple = 'hsl(282, 80%, 63%)';
export const purpleLight = 'hsl(282, 85%, 48%)';
export const purpleDark = 'hsl(282, 80%, 72%)';

