import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import type { TileColors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

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
 * Stat tile look: a card with a tinted icon chip, a bold ink number and a coloured label.
 * Large tinted fills read as washed-out on light and muddy on dark, so colour is kept to the
 * chip and the label. Light cards get the soft card shadow; dark relies on the lighter surface.
 */
export function useTileStyle(tone: TileColors): TileStyle {
  const colors = useUiStore((s) => s.colors);
  const dark = useUiStore((s) => s.theme) === 'dark';
  return {
    box: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, ...(dark ? null : shadows.card) },
    value: colors.ink,
    label: tone.text,
    dark,
  };
}

/** Wraps a tile icon in a tinted rounded square. */
export const TileIcon: React.FC<{ tone: TileColors; children: React.ReactNode }> = ({ tone, children }) => (
  <View style={[styles.chip, { backgroundColor: tone.bg }]}>{children}</View>
);

const styles = StyleSheet.create({
  chip: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
