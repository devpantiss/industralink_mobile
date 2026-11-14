/**
 * "Cobalt 2" effects: gradients, glass and motion.
 * Rule: colour effects go on actions, hero areas, brand marks and status, never behind body text.
 */
import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';
import type { ThemeMode } from './colors';

export type Gradient = readonly [string, string, ...string[]];

interface GradientSet {
  /** Primary actions, selected pills, progress. */
  brand: Gradient;
  /** Hero bands. */
  night: Gradient;
  /** Urgent / highlight CTA (safety yellow to orange). */
  sunrise: Gradient;
  success: Gradient;
  violet: Gradient;
  danger: Gradient;
}

export const gradients: Record<ThemeMode, GradientSet> = {
  light: {
    brand: ['#2F63F5', '#2048D6'],
    night: ['#E9EFFF', '#F7F9FF'],
    sunrise: ['#FFC72C', '#F59E0B'],
    success: ['#16A34A', '#0E7A3E'],
    violet: ['#7357F0', '#5B3FD0'],
    danger: ['#E5304F', '#C41E3E'],
  },
  dark: {
    brand: ['#5A86FF', '#3A63F0'],
    night: ['#14214A', '#0F1730'],
    sunrise: ['#FFD04D', '#F5A524'],
    success: ['#34D27B', '#16A34A'],
    violet: ['#9B85FF', '#6D4AFF'],
    danger: ['#FF6B86', '#E5304F'],
  },
};

/** Gradient pairs for initials avatars and company monograms (stable per name). */
export const identityGradients: Gradient[] = [
  ['#3B82F6', '#1D4ED8'],
  ['#14B8A6', '#0F766E'],
  ['#F59E0B', '#D97706'],
  ['#8B5CF6', '#6D28D9'],
  ['#EC4899', '#BE185D'],
  ['#22C55E', '#15803D'],
  ['#F97316', '#C2410C'],
  ['#06B6D4', '#0E7490'],
  ['#64748B', '#334155'],
];

export function identityGradient(name: string): Gradient {
  const sum = [...name].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  return identityGradients[sum % identityGradients.length]!;
}

/** Translucent "glass" chrome (tab bar, scrolled top bar, sheet handle). */
export const glass = {
  light: { bg: 'rgba(255,255,255,0.86)', border: 'rgba(15,23,42,0.08)', tint: 'light' as const, solid: 'rgba(255,255,255,0.96)' },
  dark: { bg: 'rgba(23,26,34,0.8)', border: 'rgba(255,255,255,0.08)', tint: 'dark' as const, solid: 'rgba(23,26,34,0.97)' },
};

/** Live blur is costly on low-end Android (most of our users); Android uses a near-solid fill instead. */
export const canBlur = Platform.OS === 'ios';

export const motion = {
  fast: 160,
  base: 240,
  slow: 360,
  ease: Easing.bezier(0.2, 0, 0, 1),
  /** Only for press, toggle and save. */
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
};
