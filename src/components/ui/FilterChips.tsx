import React from 'react';
import { ScrollView, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { useUiStore } from '../../store/uiStore';

export interface ChipOption<K extends string> {
  key: K;
  label: string;
  count?: number;
}

interface Props<K extends string> {
  options: ChipOption<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: ViewStyle;
}

/** One-choice filter row that scrolls sideways (status, role, trade). */
export function FilterChips<K extends string>({ options, value, onChange, style }: Props<K>) {
  const colors = useUiStore((s) => s.colors);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
      accessibilityRole="tablist"
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(o.key);
            }}
            style={[
              styles.chip,
              on
                ? { backgroundColor: colors.inkFill, borderColor: colors.inkFill }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.label, { color: on ? colors.onInk : colors.ink }]}>{o.label}</Text>
            {o.count !== undefined && (
              <Text style={[styles.count, { color: on ? colors.onInk : colors.inkMuted }]}>{o.count}</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 12, fontWeight: '700' },
});
