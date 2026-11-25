import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useUiStore } from '../../store/uiStore';

/** One full wave over the three dots. */
const CYCLE_MS = 1200;
/** How far apart the dots start their bounce, as a part of the cycle. */
const DOT_DELAY = 0.125;
/** The part of the cycle a dot spends moving; it rests for the rest. */
const BOUNCE = 0.3;

/** One dot. All three read the same clock, so the animation runs on the UI thread only. */
const Dot: React.FC<{ clock: SharedValue<number>; index: number; color: string }> = ({ clock, index, color }) => {
  const style = useAnimatedStyle(() => {
    const phase = (clock.value - index * DOT_DELAY + 1) % 1;
    const lift = phase < BOUNCE ? Math.sin((phase / BOUNCE) * Math.PI) : 0;
    return { opacity: 0.4 + 0.6 * lift, transform: [{ translateY: -3 * lift }] };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
};

/** The other side is typing: three bouncing dots in a chat bubble, like WhatsApp. */
export const TypingBubble: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const reduceMotion = useReducedMotion();
  const clock = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    clock.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1);
    return () => cancelAnimation(clock);
  }, [clock, reduceMotion]);

  return (
    <View
      style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {[0, 1, 2].map((index) => (
        <Dot key={index} clock={clock} index={index} color={colors.inkMuted} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
