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
  card: make(4, 14, 0.07, 2),
  /** Selected segment, floating buttons. */
  raised: make(3, 10, 0.12, 3),
  /** Sticky bottom bars and sheets. */
  bar: make(-2, 12, 0.06, 6),
};
