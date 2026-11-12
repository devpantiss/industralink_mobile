import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Text } from './Text';
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
  const [mounted, setMounted] = useState(visible);
  const p = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      p.value = withTiming(1, { duration: 200, easing: EASE });
    } else if (mounted) {
      p.value = withTiming(0, { duration: 150, easing: EASE }, (d) => {
        if (d) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: p.value }));
  const box = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 8 }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
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
      </View>
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
