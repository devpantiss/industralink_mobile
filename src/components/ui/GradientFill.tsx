import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUiStore } from '../../store/uiStore';
import { gradients, type Gradient } from '../../theme/effects';

/**
 * Drop as the first child of a button to fill it with the brand gradient (the button needs
 * overflow: 'hidden' and a transparent background). Keeps hand-built buttons on-brand.
 */
export const GradientFill: React.FC<{ colors?: Gradient }> = ({ colors }) => {
  const theme = useUiStore((s) => s.theme);
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors ?? gradients[theme].brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
};
