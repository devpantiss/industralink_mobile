import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/Text';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';

const EASE = Easing.bezier(0.2, 0, 0, 1);
const BAR_H = 64;
const PILL_INSET = 6;

/**
 * Floating bottom navigation: a rounded bar that sits above the page with a soft shadow.
 * A tinted pill slides under the selected tab (280ms ease-out, no bounce); the icon and label
 * of the selected tab turn cobalt. Supports `tabBarBadge` (number, or true for a dot).
 */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const colors = useUiStore((s) => s.colors);
  const dark = useUiStore((s) => s.theme) === 'dark';
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slot = width / count;

  const x = useSharedValue(0);
  useEffect(() => {
    if (slot > 0) x.set(withTiming(state.index * slot, { duration: 280, easing: EASE }));
  }, [state.index, slot, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View style={[styles.wrap, { backgroundColor: colors.canvas, paddingBottom: Math.max(insets.bottom - 6, 10) }]}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            backgroundColor: dark ? colors.surfaceMuted : colors.surface,
            borderColor: dark ? colors.borderStrong : colors.border,
          },
          !dark && styles.shadow,
        ]}
        accessibilityRole="tabbar"
      >
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              { width: slot - PILL_INSET * 2, backgroundColor: colors.primarySoft },
              pill,
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const focused = state.index === index;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
          const badge = options.tabBarBadge;
          const showBadge = badge !== undefined && badge !== 0;
          const color = focused ? colors.primary : colors.inkMuted;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {});
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={typeof badge === 'number' && badge > 0 ? `${t(label)}, ${badge} new` : t(label)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {showBadge && (
                  <View
                    style={[
                      typeof badge === 'boolean' ? styles.dot : styles.badge,
                      { backgroundColor: colors.dangerFg, borderColor: dark ? colors.surfaceMuted : colors.surface },
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
                maxFontSizeMultiplier={1.15}
                style={[styles.label, { color: focused ? colors.primary : colors.inkMuted, fontWeight: focused ? '700' : '500' }]}
              >
                {t(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 6 },
  bar: {
    flexDirection: 'row',
    height: BAR_H,
    borderRadius: BAR_H / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadow: Platform.select({
    ios: { shadowColor: '#101828', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16 },
    default: { elevation: 8 },
  })!,
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: PILL_INSET,
    borderRadius: (BAR_H - PILL_INSET * 2) / 2,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pressed: { transform: [{ scale: 0.94 }] },
  label: { fontSize: 11, letterSpacing: 0.1 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', lineHeight: 13 },
});
