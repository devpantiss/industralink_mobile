import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { FONT } from '../../theme/fonts';

interface State {
  failed: boolean;
}

/**
 * Last safety net: if a screen crashes while drawing, show a calm message and a restart button
 * instead of a blank white screen. Uses plain RN Text so it still works if our own components fail.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Screen crashed', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const colors = useUiStore.getState().colors;
    return (
      <View style={[styles.root, { backgroundColor: colors.canvas }]}>
        <Text style={[styles.title, { color: colors.ink, fontFamily: FONT }]}>Something went wrong</Text>
        <Text style={[styles.body, { color: colors.inkSecondary, fontFamily: FONT }]}>
          The app hit a problem. Your data is safe. Tap the button to try again.
        </Text>
        <Pressable
          onPress={() => this.setState({ failed: false })}
          accessibilityRole="button"
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.btnText, { fontFamily: FONT }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 8 },
  btn: { minHeight: 48, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
