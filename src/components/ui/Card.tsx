import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { radii, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface CardProps {
  children: React.ReactNode;
  variant?: 'surface' | 'muted' | 'outline';
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  padding = spacing.lg,
  onPress,
  style,
}) => {
  const { colors } = useUiStore();
  const dark = useUiStore((s) => s.theme) === 'dark';

  const getBackgroundColor = () => {
    switch (variant) {
      case 'muted':
        return colors.surfaceMuted;
      case 'outline':
        return 'transparent';
      case 'surface':
      default:
        return colors.surface;
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding,
    // A soft shadow lifts white cards off the grey page; dark mode relies on the border.
    ...(variant === 'surface' && !dark ? shadows.card : null),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.base, containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {},
});
