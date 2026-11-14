import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import type { TileColors } from '../../theme/colors';

export interface TileStyle {
  /** Background (and border on dark) for the tile itself. */
  box: ViewStyle;
  /** Colour of the big number. */
  value: string;
  /** Colour of the label / note and the icon. */
  label: string;
  dark: boolean;
}

/**
 * Stat tile look: the tile is filled with its colour (pastel on light, deep tint on dark), the
 * number and label use the tile's ink, and the icon sits in a small surface-coloured chip.
 */
export function useTileStyle(tone: TileColors): TileStyle {
  const dark = useUiStore((s) => s.theme) === 'dark';
  return {
    box: { backgroundColor: tone.bg, borderWidth: 0 },
    value: tone.text,
    label: tone.text,
    dark,
  };
}

/** Icon chip inside a coloured tile; icons default to the two-tone (duotone) weight. */
export const TileIcon: React.FC<{ tone: TileColors; children: React.ReactNode }> = ({ tone, children }) => {
  const colors = useUiStore((s) => s.colors);
  const dark = useUiStore((s) => s.theme) === 'dark';
  return (
    <View style={[styles.chip, { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.surface }]}>
      {React.isValidElement<{ weight?: string; duotoneOpacity?: number; color?: string }>(children)
        ? React.cloneElement(children, { weight: children.props.weight ?? 'duotone', duotoneOpacity: 0.3, color: tone.text })
        : children}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
