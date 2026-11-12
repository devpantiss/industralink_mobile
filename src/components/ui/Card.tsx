import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { radii, spacing } from '../../theme/spacing';

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
  base: {
    overflow: 'hidden',
  },
});
