import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const APressable = Animated.createAnimatedComponent(Pressable);
const EASE = Easing.bezier(0.2, 0, 0, 1);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held (default 0.98). */
  scaleTo?: number;
  children?: React.ReactNode;
}

/** Tappable surface that presses in slightly while held. For cards and tiles. */
export const PressableScale: React.FC<Props> = ({ style, scaleTo = 0.98, onPressIn, onPressOut, children, ...rest }) => {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <APressable
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => {
        s.set(withTiming(scaleTo, { duration: 120, easing: EASE }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withTiming(1, { duration: 180, easing: EASE }));
        onPressOut?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </APressable>
  );
};
