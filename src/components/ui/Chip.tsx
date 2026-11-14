import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { useUiStore } from '../../store/uiStore';
import { gradients } from '../../theme/effects';
import type { AppIcon } from './icons';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: AppIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Selectable chip (topics, trades, industries, sizes). Selected: brand gradient, white text and a
 * filled icon. Unselected: surface with a hairline border and a duotone icon.
 */
export const Chip: React.FC<ChipProps> = ({ label, selected, onPress, icon: Icon, disabled, style, accessibilityLabel }) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.on : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {selected && (
        <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      {Icon && (
        <Icon size={16} color={selected ? '#FFFFFF' : colors.primary} weight={selected ? 'fill' : 'duotone'} duotoneOpacity={0.25} />
      )}
      <Text style={[styles.label, { color: selected ? '#FFFFFF' : colors.ink, fontWeight: selected ? '700' : '600' }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    overflow: 'hidden',
  },
  on: { borderColor: 'transparent' },
  pressed: { transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.5 },
  label: { fontSize: 13.5 },
});
