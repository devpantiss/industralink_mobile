import React, { useEffect, useState } from 'react';
import {
  Keyboard,
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
  /**
   * Which safe-area edges to pad. Tab screens use the default ['top'] (the tab bar pads the bottom).
   * Screens with no tab bar (stack, drawer) add 'bottom' so content clears the home indicator.
   */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Set false when the screen handles the keyboard itself. */
  keyboardAvoiding?: boolean;
}

/** True while the on-screen keyboard is open (the bottom inset is not needed then). */
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
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
        behavior={keyboardAvoiding && Platform.OS === 'ios' ? 'padding' : undefined}
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
