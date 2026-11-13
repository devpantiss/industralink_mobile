import { Platform, ViewStyle } from 'react-native';

/**
 * Soft, neutral shadows (no coloured glow). Cards sit just above the page; raised items
 * (sticky bars, the selected segment) a little more. Android uses elevation.
 */
const make = (y: number, radius: number, opacity: number, elevation: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: { shadowColor: '#101828', shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius },
    default: { elevation },
  })!;

export const shadows = {
  none: {} as ViewStyle,
  /** Resting card. */
  card: make(2, 8, 0.05, 1),
  /** Selected segment, floating buttons. */
  raised: make(2, 6, 0.1, 2),
  /** Sticky bottom bars and sheets. */
  bar: make(-2, 12, 0.06, 6),
};
