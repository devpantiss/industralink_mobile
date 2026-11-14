import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, StyleProp, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '../../components/ui/Text';
import { useUiStore } from '../../store/uiStore';
import { layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { gradients, motion } from '../../theme/effects';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Buttons. Primary and danger are filled with a soft two-stop gradient and a faint top
 * highlight; every variant gets a small spring press (0.97) and a light haptic.
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const height = size === 'sm' ? 38 : size === 'lg' ? 50 : layout.buttonHeight;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
  const radius = size === 'sm' ? 10 : 14;
  const filled = variant === 'primary' || variant === 'danger';

  let bg = 'transparent';
  let borderColor = 'transparent';
  let borderWidth = 0;
  let color = colors.ink;
  if (variant === 'secondary') bg = colors.surfaceStrong;
  if (variant === 'outline') {
    borderColor = colors.borderStrong;
    borderWidth = 1;
  }
  if (filled) color = '#FFFFFF';

  const fill = variant === 'danger' ? gradients[theme].danger : gradients[theme].brand;

  return (
    <Animated.View style={[pressStyle, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => scale.set(withSpring(0.97, motion.spring))}
        onPressOut={() => scale.set(withSpring(1, motion.spring))}
        disabled={disabled || loading}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityLabel={label}
        style={[styles.base, { height, paddingHorizontal, borderRadius: radius, backgroundColor: bg, borderColor, borderWidth }]}
      >
        {filled && (
          <>
            <LinearGradient
              colors={fill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
            />
            {/* Faint top highlight gives the fill a little depth. */}
            <View pointerEvents="none" style={[styles.highlight, { borderRadius: radius }]} />
          </>
        )}
        {loading ? (
          <ActivityIndicator color={filled ? '#FFFFFF' : colors.primary} />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text
              style={[
                size === 'sm' ? typography.small : typography.h3,
                { color, fontWeight: '700' },
                icon ? (iconPosition === 'left' ? styles.ml : styles.mr) : null,
                textStyle,
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  highlight: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  ml: { marginLeft: 8 },
  mr: { marginRight: 8 },
});
