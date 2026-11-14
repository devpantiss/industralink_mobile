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
import { gradients } from '../../theme/effects';

const EASE = Easing.bezier(0.2, 0, 0, 1);
const BAR_H = 64;
/** Selected-tab shape: a soft rounded rectangle that covers both the icon and the label. */
const PILL_X = 4;
const PILL_Y = 6;
const BAR_R = 24;
const PILL_R = BAR_R - PILL_Y;
/** Bar surface: white to a hint of cool grey on light; lifted slate on dark (lighter than cards). */
const BAR_FILL = {
  light: ['#FFFFFF', '#F5F7FB'] as const,
  dark: ['#2A2F3B', '#1F232C'] as const,
};

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
      {/* Page fades out under the bar, so scrolling content never clashes with it. */}
      <LinearGradient
        pointerEvents="none"
        colors={[colors.canvas + '00', colors.canvas + 'E6', colors.canvas]}
        locations={[0, 0.45, 1]}
        style={styles.fade}
      />
      {/* Android draws elevation only under a view with a background, so the shadow layer gets the bar colour. */}
      <View style={[styles.shadow, { backgroundColor: BAR_FILL[theme][1] }, dark ? styles.shadowDark : styles.shadowLight]}>
      <View style={[styles.bar, { borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)' }]}>
        {/* Raised surface: soft top-to-bottom fill plus a thin top highlight. */}
        <LinearGradient colors={BAR_FILL[theme]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[styles.highlight, { borderTopColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)' }]} />
      <View
        style={styles.row}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="tabbar"
      >
        {width > 0 && (
          <Animated.View pointerEvents="none" style={[styles.pill, { width: slot - PILL_X * 2 }, pill]}>
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
                {options.tabBarIcon?.({ focused, color, size: 20 })}
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
                maxFontSizeMultiplier={1}
                style={[styles.label, { color, fontWeight: focused ? '700' : '600' }]}
              >
                {t(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      </View>
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
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 26, paddingTop: 6 },
  shadow: { borderRadius: BAR_R },
  shadowLight: Platform.select({
    ios: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 22 },
    default: { elevation: 18, shadowColor: '#0B1220' },
  })!,
  shadowDark: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 22 },
    default: { elevation: 18, shadowColor: '#000' },
  })!,
  bar: { height: BAR_H, borderRadius: BAR_R, borderWidth: 1, overflow: 'hidden' },
  highlight: { ...StyleSheet.absoluteFill, borderRadius: BAR_R, borderTopWidth: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: -24 },
  row: { flex: 1, flexDirection: 'row' },
  pill: {
    position: 'absolute',
    top: PILL_Y,
    bottom: PILL_Y,
    left: PILL_X,
    borderRadius: PILL_R,
    overflow: 'hidden',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pressed: { transform: [{ scale: 0.94 }] },
  label: { fontSize: 10.5, letterSpacing: 0.1 },
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
