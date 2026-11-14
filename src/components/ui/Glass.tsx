import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useUiStore } from '../../store/uiStore';
import { glass, canBlur } from '../../theme/effects';

interface GlassProps {
  style?: StyleProp<ViewStyle>;
  /** Blur strength on iOS (0-100). */
  intensity?: number;
  /** Draw the hairline border (default true). */
  bordered?: boolean;
  children?: React.ReactNode;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

/**
 * Frosted "glass" surface for chrome only (tab bar, toasts, floating bars), never for reading
 * surfaces. iOS: live blur + translucent tint. Android: near-solid fill (blur is too costly on
 * the low-end phones most workers use).
 */
export const Glass: React.FC<GlassProps> = ({ style, intensity = 50, bordered = true, children, pointerEvents }) => {
  const theme = useUiStore((s) => s.theme);
  const g = glass[theme];
  const flat = StyleSheet.flatten(style) ?? {};
  const radius = { borderRadius: flat.borderRadius } as ViewStyle;
  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        styles.base,
        { borderColor: g.border, borderWidth: bordered ? StyleSheet.hairlineWidth : 0 },
        style,
      ]}
    >
      {canBlur ? (
        <>
          <BlurView intensity={intensity} tint={g.tint} style={[StyleSheet.absoluteFill, radius]} />
          <View style={[StyleSheet.absoluteFill, radius, { backgroundColor: g.bg }]} />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, radius, { backgroundColor: g.solid }]} />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
