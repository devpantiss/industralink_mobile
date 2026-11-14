import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/Text';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';
import { useKeyboardVisible } from '../../lib/keyboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '../ui/Glass';
import { gradients } from '../../theme/effects';

const EASE = Easing.bezier(0.2, 0, 0, 1);
const BAR_H = 64;
const PILL_INSET = 6;

/** Bottom space a tab screen's scroll content needs so its last item clears the floating bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return BAR_H + Math.max(insets.bottom - 6, 10) + 6 + 16;
}

/**
 * Floating bottom navigation: a rounded bar that sits above the page with a soft shadow.
 * The bar is frosted glass floating over the page (content scrolls underneath; tab screens add
 * useTabBarSpace() at the bottom). A cobalt gradient pill slides under the selected tab
 * (280ms ease-out); its icon switches to the filled weight and grows slightly. Supports `tabBarBadge` (number, or true for a dot).
 */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const dark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slot = width / count;

  const x = useSharedValue(0);
  useEffect(() => {
    if (slot > 0) x.set(withTiming(state.index * slot, { duration: 280, easing: EASE }));
  }, [state.index, slot, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  // Hide while typing: gives the form the room and stops the bar floating over the keyboard.
  if (keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 6, 10) }]}>
      <View style={[styles.shadow, !dark && styles.shadowLight]}>
      <Glass style={styles.bar} intensity={70}>
      <View
        style={styles.row}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="tabbar"
      >
        {width > 0 && (
          <Animated.View pointerEvents="none" style={[styles.pill, { width: slot - PILL_INSET * 2 }, pill]}>
            <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const focused = state.index === index;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
          const badge = options.tabBarBadge;
          const showBadge = badge !== undefined && badge !== 0;
          const color = focused ? '#FFFFFF' : colors.inkSecondary;

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
              <TabIcon focused={focused}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {showBadge && (
                  <View
                    style={[
                      typeof badge === 'boolean' ? styles.dot : styles.badge,
                      { backgroundColor: colors.dangerFg, borderColor: focused ? colors.primary : dark ? colors.surfaceMuted : colors.surface },
                    ]}
                  >
                    {typeof badge !== 'boolean' && (
                      <Text style={styles.badgeText}>{typeof badge === 'number' && badge > 99 ? '99+' : badge}</Text>
                    )}
                  </View>
                )}
              </TabIcon>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.15}
                style={[styles.label, { color, fontWeight: focused ? '700' : '600' }]}
              >
                {t(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      </Glass>
      </View>
    </View>
  );
};

/** Selected icon grows slightly (it also switches to the fill weight in the navigator). */
const TabIcon: React.FC<{ focused: boolean; children: React.ReactNode }> = ({ focused, children }) => {
  const s = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(focused ? 1.08 : 1, { duration: 200, easing: EASE }) }],
  }));
  return <Animated.View style={s}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 6 },
  shadow: { borderRadius: BAR_H / 2 },
  shadowLight: Platform.select({
    ios: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24 },
    default: { elevation: 10 },
  })!,
  bar: { height: BAR_H, borderRadius: BAR_H / 2 },
  row: { flex: 1, flexDirection: 'row' },
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: PILL_INSET,
    borderRadius: (BAR_H - PILL_INSET * 2) / 2,
    overflow: 'hidden',
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
