import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tiny focus bus: the app's TextInput wrapper calls notifyInputFocus() whenever an input gets
 * focus, so KeyboardScrollView can scroll it above the keyboard even when the keyboard is
 * already open (moving from one field to the next fires no keyboard event).
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function onInputFocus(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyInputFocus() {
  listeners.forEach((fn) => fn());
}

/** True while the on-screen keyboard is open. iOS uses the "will" events so layout moves with it. */
export function useKeyboardVisible() {
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
