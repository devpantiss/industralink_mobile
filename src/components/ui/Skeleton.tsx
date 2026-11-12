import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  ReduceMotion,
} from 'react-native-reanimated';
import { useUiStore } from '../../store/uiStore';

/** Grey placeholder block with a slow, soft fade while data loads. Still if the phone asks for reduced motion. */
export const Skeleton: React.FC<{ width?: DimensionValue; height?: number; radius?: number; style?: ViewStyle }> = ({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}) => {
  const colors = useUiStore((s) => s.colors);
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }),
      -1,
      true
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceStrong }, anim, style]}
    />
  );
};

/** Placeholder shaped like a job / candidate card (logo, two lines, a pay line). */
export const CardSkeleton: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={10} />
        <View style={styles.lines}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      <Skeleton width="90%" height={12} style={styles.gap} />
      <Skeleton width="55%" height={16} style={styles.gap} />
    </View>
  );
};

/** A short list of card placeholders for list screens. */
export const ListSkeleton: React.FC<{ count?: number; style?: ViewStyle }> = ({ count = 3, style }) => (
  <View style={[styles.list, style]} accessibilityLabel="Loading" accessibilityRole="progressbar">
    {Array.from({ length: count }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: { gap: 12, paddingVertical: 4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { flex: 1, gap: 8 },
  gap: { marginTop: 14 },
});
