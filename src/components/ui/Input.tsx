import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useUiStore } from '../../store/uiStore';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  ...props
}) => {
  const { colors } = useUiStore();
  const [isFocused, setIsFocused] = useState(false);
  const ringStyle = useAnimatedStyle(() => ({ opacity: withTiming(isFocused || error ? 1 : 0, { duration: 180 }) }));

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[typography.small, styles.label, { color: isFocused ? colors.primary : colors.inkSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          props.multiline && styles.multilineContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.dangerFg
              : isFocused
              ? colors.primary
              : colors.border,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {/* Soft focus ring that fades in around the field. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: error ? colors.dangerBg : colors.primarySoft }, ringStyle]}
        />
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            typography.bodyLg,
            styles.textInput,
            props.multiline && styles.multilineInput,
            { color: colors.ink },
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[typography.caption, styles.errorText, { color: colors.dangerFg }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs + 2,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
  },
  ring: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 18, borderWidth: 3 },
  textInput: {
    flex: 1,
    height: '100%',
    fontWeight: '500',
  },
  // Several lines: grow from 96pt, text starts at the top.
  multilineContainer: { height: undefined, minHeight: 96, alignItems: 'flex-start', paddingVertical: 10 },
  multilineInput: { height: undefined, minHeight: 76, textAlignVertical: 'top', paddingTop: 0 },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  errorText: {
    marginTop: 4,
  },
});

