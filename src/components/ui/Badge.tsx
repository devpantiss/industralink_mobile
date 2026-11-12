import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'interview'
  | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useUiStore();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primarySoft, fg: colors.primary };
      case 'success':
        return { bg: colors.successBg, fg: colors.successFg };
      case 'warning':
        return { bg: colors.warningBg, fg: colors.warningFg };
      case 'danger':
        return { bg: colors.dangerBg, fg: colors.dangerFg };
      case 'interview':
        return { bg: colors.interviewBg, fg: colors.interviewFg };
      case 'info':
        return { bg: colors.infoBg, fg: colors.infoFg };
      case 'neutral':
      default:
        return { bg: colors.neutralBg, fg: colors.neutralFg };
    }
  };

  const { bg, fg } = getColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.text, typography.caption, { color: fg }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});

