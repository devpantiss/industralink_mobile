import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUiStore } from '../../store/uiStore';
import { radii, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';

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
  const { colors } = useUiStore();

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let bg: string = colors.primary;
    let borderColor: string = 'transparent';
    let borderWidth: number = 0;

    switch (variant) {
      case 'primary':
        bg = colors.primary;
        break;
      case 'secondary':
        bg = colors.surfaceStrong;
        break;
      case 'outline':
        bg = 'transparent';
        borderColor = colors.border;
        borderWidth = 1.5;
        break;
      case 'danger':
        bg = colors.dangerFg;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
    }

    let height: number = layout.buttonHeight;
    let paddingHorizontal: number = 16;
    if (size === 'sm') {
      height = 34;
      paddingHorizontal = 12;
    } else if (size === 'lg') {
      height = 54;
      paddingHorizontal = 20;
    }

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth,
      height,
      paddingHorizontal,
      borderRadius: size === 'sm' ? radii.sm : radii.md,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color: string = colors.onInk;

    switch (variant) {
      case 'primary':
      case 'danger':
        color = '#FFFFFF';
        break;
      case 'secondary':
      case 'outline':
      case 'ghost':
        color = colors.ink;
        break;
    }

    return {
      color,
      ...(size === 'sm' ? typography.small : typography.h3),
      fontWeight: '600',
    };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.base, getContainerStyle(), style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyle(), icon ? (iconPosition === 'left' ? styles.ml : styles.mr) : null, textStyle]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ml: {
    marginLeft: 8,
  },
  mr: {
    marginRight: 8,
  },
});
