import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * List entrance: the first few items fade in and rise 8pt, 40ms apart. Items after the sixth
 * appear without animation so long lists stay fast. Follows the phone's reduce-motion setting.
 */
export const Stagger: React.FC<{ index: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({
  index,
  style,
  children,
}) => (
  <Animated.View
    style={style}
    entering={index < 6 ? FadeInDown.delay(index * 40).duration(260).withInitialValues({ transform: [{ translateY: 8 }] }) : undefined}
  >
    {children}
  </Animated.View>
);
