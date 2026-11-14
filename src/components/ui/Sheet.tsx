import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { KeyboardScrollView } from './KeyboardScrollView';
import { useKeyboardVisible } from '../../lib/keyboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from './icons';
import { Text } from './Text';
import { useUiStore } from '../../store/uiStore';
import { BlurView } from 'expo-blur';
import { canBlur } from '../../theme/effects';

const EASE = Easing.bezier(0.2, 0, 0, 1);
const OPEN_MS = 280;
const CLOSE_MS = 200;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Sticky area under the scrolling content, e.g. the main buttons. */
  footer?: React.ReactNode;
  /** Wrap children in a ScrollView (default true). */
  scroll?: boolean;
  /** Max height as a share of the screen (default 0.9). */
  maxHeight?: number;
  children: React.ReactNode;
}

/**
 * Bottom sheet: backdrop fades, panel slides up, drag the handle or panel down to close.
 * Replaces Modal animationType="slide" (which slid the backdrop up with the panel).
 */
export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  footer,
  scroll = true,
  maxHeight = 0.9,
  children,
}) => {
  const colors = useUiStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  // With the keyboard open the home-indicator space is under the keyboard, so drop it.
  const bottomInset = useKeyboardVisible() ? 0 : insets.bottom;
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0); // 0 hidden, 1 open
  const drag = useSharedValue(0);

  // Mount as soon as it opens (render-time update, React's pattern for state derived from props).
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      drag.set(0);
      progress.set(withTiming(1, { duration: OPEN_MS, easing: EASE }));
    } else {
      progress.set(
        withTiming(0, { duration: CLOSE_MS, easing: EASE }, (done) => {
          if (done) runOnJS(setMounted)(false);
        })
      );
    }
  }, [visible, drag, progress]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetX([-16, 16])
    .onUpdate((e) => {
      drag.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        runOnJS(onClose)();
      } else {
        drag.set(withTiming(0, { duration: 180, easing: EASE }));
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height + drag.get() }],
  }));

  if (!mounted) return null;

  const body = scroll ? (
    <KeyboardScrollView
      style={styles.flexShrink}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardScrollView>
  ) : (
    <View style={[styles.content, styles.flexShrink]}>{children}</View>
  );

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.flex}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          {/* Frosted backdrop on iOS; plain dim on Android (blur is costly there). */}
          {canBlur && <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />}
          <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <KeyboardAvoidingView
          behavior="padding"
          // Keep the panel below the status bar / notch; with the keyboard open it shrinks instead.
          style={[styles.anchor, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.panel,
              { backgroundColor: colors.surface, maxHeight: height * maxHeight },
              panelStyle,
            ]}
          >
            <GestureDetector gesture={pan}>
              <View>
                <View style={styles.handleWrap}>
                  <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
                </View>
                {(title || subtitle) && (
                  <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <View style={styles.flexShrink}>
                      {title ? (
                        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
                          {title}
                        </Text>
                      ) : null}
                      {subtitle ? <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>{subtitle}</Text> : null}
                    </View>
                    <Pressable
                      onPress={onClose}
                      hitSlop={8}
                      accessibilityLabel="Close"
                      style={[styles.close, { backgroundColor: colors.surfaceMuted }]}
                    >
                      <X size={18} color={colors.ink} />
                    </Pressable>
                  </View>
                )}
              </View>
            </GestureDetector>
            {body}
            {footer ? (
              <View
                style={[
                  styles.footer,
                  { borderTopColor: colors.border, paddingBottom: Math.max(bottomInset, 12) },
                ]}
              >
                {footer}
              </View>
            ) : (
              <View style={{ height: bottomInset }} />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  backdrop: { backgroundColor: 'rgba(11,18,32,0.42)' },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  panel: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', flexShrink: 1 },
  handleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 12 },
});
