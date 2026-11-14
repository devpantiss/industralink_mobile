import React, { useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { useUiStore } from '../../store/uiStore';
import { shadows } from '../../theme/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/effects';

export interface SegmentItem<K extends string> {
  key: K;
  label: string;
  count?: number;
  icon?: (color: string) => React.ReactNode;
}

interface Props<K extends string> {
  items: SegmentItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** "pill": dark sliding pill on grey (web tab style). "underline": blue line under the active tab. */
  variant?: 'pill' | 'underline';
  style?: ViewStyle;
}

const EASE = Easing.bezier(0.2, 0, 0, 1);

/** Equal-width tabs with an indicator that slides to the selected tab (web: useSlideIndicator). */
export function SegmentedTabs<K extends string>({ items, value, onChange, variant = 'pill', style }: Props<K>) {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const dark = theme === 'dark';
  const [width, setWidth] = useState(0);
  const index = Math.max(0, items.findIndex((i) => i.key === value));
  const segW = width / items.length;
  const isPill = variant === 'pill';
  const inset = isPill ? 4 : 0;

  const indicator = useAnimatedStyle(() => ({
    width: Math.max(0, segW - inset * 2),
    transform: [{ translateX: withTiming(index * segW + inset, { duration: 260, easing: EASE }) }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="tablist"
      style={[
        isPill ? styles.pillTrack : styles.lineTrack,
        isPill ? { backgroundColor: colors.surfaceStrong } : { borderBottomColor: colors.border },
        style,
      ]}
    >
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            isPill ? styles.pill : styles.line,
            isPill ? [{ backgroundColor: dark ? colors.borderStrong : colors.surface }, shadows.raised] : null,
            indicator,
          ]}
        >
          {!isPill && (
            <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          )}
        </Animated.View>
      )}
      {items.map((item) => {
        const active = item.key === value;
        const color = isPill
          ? active ? colors.ink : colors.inkSecondary
          : active ? colors.ink : colors.inkMuted;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(item.key);
            }}
            style={[styles.seg, isPill ? styles.pillSeg : styles.lineSeg]}
          >
            {item.icon?.(color)}
            <Text numberOfLines={1} style={[styles.label, { color, fontWeight: active ? '700' : '500' }]}>
              {item.label}
            </Text>
            {item.count !== undefined && (
              <View
                style={[
                  styles.count,
                  { backgroundColor: active ? colors.primarySoft : colors.surfaceStrong },
                ]}
              >
                <Text style={[styles.countText, { color: active ? colors.primary : color }]}>{item.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pillTrack: { flexDirection: 'row', borderRadius: 14, padding: 0, position: 'relative' },
  lineTrack: { flexDirection: 'row', borderBottomWidth: 1, position: 'relative' },
  pill: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 10 },
  line: { position: 'absolute', bottom: -1, left: 0, height: 3, borderRadius: 3, overflow: 'hidden' },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pillSeg: { minHeight: 40, paddingHorizontal: 8 },
  lineSeg: { minHeight: 44, paddingHorizontal: 4 },
  label: { fontSize: 12.5, letterSpacing: 0.1 },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, fontWeight: '700' },
});
