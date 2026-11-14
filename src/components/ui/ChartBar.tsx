import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, ReduceMotion } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useUiStore } from '../../store/uiStore';
import { gradients, motion } from '../../theme/effects';

/**
 * Chart column: grows to its height once (staggered by `index`), filled with a vertical brand
 * gradient when it has a value, a plain grey stub when empty.
 */
export const ChartBar: React.FC<{ height: number; filled: boolean; index?: number; style?: StyleProp<ViewStyle> }> = ({
  height,
  filled,
  index = 0,
  style,
}) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const h = useSharedValue(0);
  useEffect(() => {
    h.set(withDelay(index * 50, withTiming(height, { duration: motion.slow * 1.5, easing: motion.ease, reduceMotion: ReduceMotion.System })));
  }, [height, index, h]);
  const anim = useAnimatedStyle(() => ({ height: h.get() }));
  const [top, bottom] = gradients[theme].brand;
  return (
    <Animated.View style={[styles.bar, { backgroundColor: filled ? 'transparent' : colors.surfaceStrong }, style, anim]}>
      {filled && <LinearGradient colors={[top, bottom]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: { overflow: 'hidden' },
});
