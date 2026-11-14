import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  ScrollViewInstance,
  TextInput,
} from 'react-native';
import { onInputFocus } from '../../lib/keyboard';

interface Props extends ScrollViewProps {
  /** Space kept between the focused field and the keyboard / bottom edge. */
  keyboardGap?: number;
}

/**
 * ScrollView for any screen or sheet with text fields. Drop-in replacement for ScrollView.
 *
 * The screen (Screen / Sheet) already shrinks above the keyboard with KeyboardAvoidingView;
 * this makes sure the field you are typing in is actually scrolled into view, on both
 * platforms and in Expo Go (no native keyboard library needed):
 * - when the keyboard opens, and when focus moves to another field while it is open;
 * - only fields inside this scroll view are handled (hidden tab screens stay put).
 * Also: taps on buttons work while the keyboard is open, and dragging the list hides it.
 */
export const KeyboardScrollView = forwardRef<ScrollViewInstance, Props>(function KeyboardScrollView(
  { keyboardGap = 24, onScroll, scrollEventThrottle, children, ...rest },
  ref
) {
  const scroll = useRef<ScrollViewInstance>(null);
  useImperativeHandle(ref, () => scroll.current as ScrollViewInstance);
  const offsetY = useRef(0);

  const reveal = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput() as unknown as {
      measureLayout?: (rel: unknown, ok: (x: number, y: number, w: number, h: number) => void, fail?: () => void) => void;
    } | null;
    const sv = scroll.current;
    const content = sv?.getInnerViewRef?.();
    if (!input?.measureLayout || !sv || !content) return;
    // y of the field inside this scroll view's content; fails (no-op) if the field is elsewhere.
    input.measureLayout(
      content,
      (_x, y, _w, h) => {
        (sv as unknown as { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void }).measureInWindow(
          (_sx, sy, _sw, sh) => {
            const kb = Keyboard.metrics();
            // Visible part of the scroll view: down to the keyboard top if it overlaps.
            const visibleH = kb && kb.screenY > sy ? Math.min(sh, kb.screenY - sy) : sh;
            const top = offsetY.current;
            if (y + h + keyboardGap > top + visibleH) {
              sv.scrollTo({ y: Math.max(0, y + h + keyboardGap - visibleH), animated: true });
            } else if (y - keyboardGap < top) {
              sv.scrollTo({ y: Math.max(0, y - keyboardGap), animated: true });
            }
          }
        );
      },
      () => {}
    );
  }, [keyboardGap]);

  useEffect(() => {
    // Wait a frame or two so KeyboardAvoidingView has finished resizing the screen.
    const later = () => setTimeout(reveal, Platform.OS === 'ios' ? 60 : 120);
    const show = Keyboard.addListener('keyboardDidShow', later);
    const focus = onInputFocus(() => {
      if (Keyboard.isVisible()) later();
    });
    return () => {
      show.remove();
      focus();
    };
  }, [reveal]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetY.current = e.nativeEvent.contentOffset.y;
      onScroll?.(e);
    },
    [onScroll]
  );

  return (
    <ScrollView
      ref={scroll}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      {...rest}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
    >
      {children}
    </ScrollView>
  );
});
