import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useUiStore } from '../../store/uiStore';
import { gradients, motion } from '../../theme/effects';

const W = 52;
const H = 32;
const THUMB = 26;
const PAD = (H - THUMB) / 2;

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Accepted for drop-in use where Switch was used; the look comes from the theme. */
  trackColor?: unknown;
  thumbColor?: unknown;
}

/** On/off switch: gradient track fades in, thumb springs across, light haptic on change. */
export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, disabled, accessibilityLabel }) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(value ? W - THUMB - PAD * 2 : 0, motion.spring) }],
  }));
  const fill = useAnimatedStyle(() => ({ opacity: withTiming(value ? 1 : 0, { duration: motion.fast }) }));

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync().catch(() => {});
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View style={[styles.track, { backgroundColor: colors.borderStrong }]}>
        <Animated.View style={[StyleSheet.absoluteFill, fill]}>
          <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.thumb, thumb]} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, padding: PAD, overflow: 'hidden', justifyContent: 'center' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
