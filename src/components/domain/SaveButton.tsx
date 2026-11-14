import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Bookmark } from '../ui/icons';
import { useUiStore } from '../../store/uiStore';
import { motion } from '../../theme/effects';
import { t } from '../../lib/i18n';

interface Props {
  saved: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

/** Round save button: outline -> filled bookmark with a small pop and a haptic when saved. */
export const SaveButton: React.FC<Props> = ({ saved, onPress, disabled, size = 36 }) => {
  const colors = useUiStore((s) => s.colors);
  const scale = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (saved) {
      scale.set(withSequence(withTiming(1.25, { duration: 120 }), withSpring(1, motion.spring)));
    }
  }, [saved, scale]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(saved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? t('Remove from saved') : t('Save job')}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: saved ? colors.primarySoft : colors.surfaceMuted },
      ]}
    >
      <Animated.View style={pop}>
        <Bookmark size={size * 0.5} color={saved ? colors.primary : colors.inkSecondary} weight={saved ? 'fill' : 'regular'} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});
