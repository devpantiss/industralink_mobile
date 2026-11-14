import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, KeyboardAvoidingView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../store/uiStore';

const EASE = Easing.bezier(0.2, 0, 0, 1);

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  /** Buttons, laid out in a row at the bottom. */
  actions: React.ReactNode;
  children?: React.ReactNode;
}

/** Small centred confirm box (withdraw, decline offer, reject). Fades in with a slight rise. */
export const Dialog: React.FC<DialogProps> = ({ visible, onClose, title, message, actions, children }) => {
  const colors = useUiStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const p = useSharedValue(0);

  // Mount as soon as it opens (render-time update, React's pattern for state derived from props).
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      p.set(withTiming(1, { duration: 200, easing: EASE }));
    } else {
      p.set(
        withTiming(0, { duration: 150, easing: EASE }, (d) => {
          if (d) runOnJS(setMounted)(false);
        })
      );
    }
  }, [visible, p]);

  const backdrop = useAnimatedStyle(() => ({ opacity: p.get() }));
  const box = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ translateY: (1 - p.get()) * 8 }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      {/* Some dialogs hold a text field (e.g. a reason): keep the box above the keyboard. */}
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.center, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        <Animated.View
          accessibilityViewIsModal
          style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }, box]}
        >
          <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={[styles.message, { color: colors.inkSecondary }]}>{message}</Text> : null}
          {children}
          <View style={styles.actions}>{actions}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(21,25,30,0.4)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 420, borderRadius: 16, borderWidth: 1, padding: 20 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
});
