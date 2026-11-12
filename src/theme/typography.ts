import { TextStyle } from 'react-native';
import { FONT } from './fonts';

const fontFamily = FONT;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily,
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
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  tiny: {
    fontFamily,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
};

