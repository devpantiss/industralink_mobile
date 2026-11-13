import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/Text';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';

const EASE = Easing.bezier(0.2, 0, 0, 1);

/**
 * Bottom navigation: the active tab gets a soft cobalt pill behind its icon that
 * fades and widens in (220ms); labels turn bold. Supports `tabBarBadge` (number or true for a dot).
 */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const colors = useUiStore((s) => s.colors);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      accessibilityRole="tabbar"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const focused = state.index === index;
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TabItem
            key={route.key}
            label={t(label)}
            focused={focused}
            badge={options.tabBarBadge}
            icon={options.tabBarIcon}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
};

interface ItemProps {
  label: string;
  focused: boolean;
  badge?: string | number | boolean;
  icon?: BottomTabBarProps['descriptors'][string]['options']['tabBarIcon'];
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem: React.FC<ItemProps> = ({ label, focused, badge, icon, onPress, onLongPress }) => {
  const colors = useUiStore((s) => s.colors);
  const p = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    p.set(withTiming(focused ? 1 : 0, { duration: 220, easing: EASE }));
  }, [focused, p]);

  const pill = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scaleX: 0.55 + 0.45 * p.get() }],
  }));

  const color = focused ? colors.primary : colors.inkMuted;
  const showBadge = badge !== undefined && badge !== false && badge !== 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={typeof badge === 'number' && badge > 0 ? `${label}, ${badge} new` : label}
      style={styles.item}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: colors.primarySoft }, pill]} />
        {icon?.({ focused, color, size: 22 })}
        {showBadge && (
          <View
            style={[
              typeof badge === 'number' || typeof badge === 'string' ? styles.badge : styles.dot,
              { backgroundColor: colors.dangerFg, borderColor: colors.surface },
            ]}
          >
            {typeof badge !== 'boolean' && (
              <Text style={styles.badgeText}>{typeof badge === 'number' && badge > 99 ? '99+' : badge}</Text>
            )}
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, { color: focused ? colors.ink : colors.inkMuted, fontWeight: focused ? '700' : '500' }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', gap: 4, minHeight: 52 },
  iconWrap: { width: 60, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 16 },
  label: { fontSize: 11.5, letterSpacing: 0.1 },
  badge: {
    position: 'absolute',
    top: -2,
    left: 34,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', top: 3, left: 36, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', lineHeight: 12 },
});
