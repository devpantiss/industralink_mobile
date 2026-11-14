import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, ReduceMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useUiStore } from '../../store/uiStore';
import { gradients, motion, type Gradient } from '../../theme/effects';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Gradient progress bar that fills in once when it appears. `value` is 0-100. */
export const ProgressBar: React.FC<{
  value: number;
  height?: number;
  gradient?: Gradient;
  style?: StyleProp<ViewStyle>;
}> = ({ value, height = 8, gradient, style }) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(100, value)), { duration: motion.slow * 2, easing: motion.ease, reduceMotion: ReduceMotion.System }));
  }, [value, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.get()}%` }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.surfaceStrong }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
    >
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fill]}>
        <LinearGradient colors={gradient ?? gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
};

/** Circular gradient progress ring; children sit in the middle (e.g. an avatar). */
export const ProgressRing: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}> = ({ value, size = 56, stroke = 4, children }) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const [from, to] = gradients[theme].brand;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(100, value)) / 100, { duration: motion.slow * 2, easing: motion.ease, reduceMotion: ReduceMotion.System }));
  }, [value, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.get()) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceStrong} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={props}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
});
