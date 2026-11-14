import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from '../ui/Text';
import { useUiStore } from '../../store/uiStore';
import type { AppIcon } from '../ui/icons';
import type { TileColors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

export interface QuickLink {
  label: string;
  icon: AppIcon;
  tone: keyof ReturnType<typeof useUiStore.getState>['colors']['tiles'];
  onPress: () => void;
}

/** A row of shortcut tiles for screens that are not on the bottom bar (Saved, Companies, Help...). */
export const QuickLinks: React.FC<{ items: QuickLink[]; style?: StyleProp<ViewStyle> }> = ({ items, style }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {items.map(({ label, icon: Icon, tone, onPress }) => {
        const c: TileColors = colors.tiles[tone];
        return (
          <Pressable
            key={label}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: c.bg }]}>
              <Icon size={20} color={c.text} weight="duotone" duotoneOpacity={0.3} />
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: colors.ink }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 4, ...shadows.card },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  pressed: { opacity: 0.7 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600' },
});
