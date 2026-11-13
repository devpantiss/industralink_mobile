import { TextStyle } from 'react-native';
import { FONT, FONT_DISPLAY } from './fonts';

const fontFamily = FONT;
const display = FONT_DISPLAY;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: display,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: display,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: display,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: display,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  small: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption: {
    fontFamily,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  tiny: {
    fontFamily,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '600',
  },
};

