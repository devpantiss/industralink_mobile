import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { useKeyboardVisible } from '../../lib/keyboard';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  withPadding?: boolean;
  /**
   * Which safe-area edges to pad. Tab screens use the default ['top'] (the tab bar pads the bottom).
   * Screens with no tab bar (stack, drawer) add 'bottom' so content clears the home indicator.
   */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Set false when the screen handles the keyboard itself. */
  keyboardAvoiding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  contentContainerStyle,
  withPadding = false,
  edges = ['top', 'bottom'],
  keyboardAvoiding = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useUiStore();
  const keyboardVisible = useKeyboardVisible();

  const containerPadding: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') && !keyboardVisible ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }, style]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        // Both platforms: Android is edge-to-edge, so the window no longer resizes for the
        // keyboard. 'padding' only adds the part of the keyboard that overlaps this view, so it
        // never doubles up if the system did resize. Forms inside use KeyboardScrollView.
        behavior={keyboardAvoiding ? 'padding' : undefined}
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
