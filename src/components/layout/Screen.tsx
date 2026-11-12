import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  withPadding?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  contentContainerStyle,
  withPadding = false,
  edges = ['top', 'bottom'],
}) => {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useUiStore();

  const containerPadding: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }, style]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.content,
            containerPadding,
            withPadding && { paddingHorizontal: spacing.lg },
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
