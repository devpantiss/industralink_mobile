import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../store/uiStore';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Google's own "G" in its four colours. Google's rules say not to change it. */
export const GoogleLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <Path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </Svg>
);

interface Props {
  /** "signin" on the login screen, "signup" on the create-account screen. */
  mode: 'signin' | 'signup';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * "Sign in with Google" / "Sign up with Google".
 * Same height, corners and border as our fields, so it sits quietly above the form:
 * the Google "G" on its own white disc at the left (crisp in light and dark),
 * the words centred across the whole button.
 */
export const GoogleButton: React.FC<Props> = ({ mode, onPress, loading, disabled, style }) => {
  const colors = useUiStore((s) => s.colors);
  const [pressed, setPressed] = useState(false);
  const label = mode === 'signup' ? t('Sign up with Google') : t('Sign in with Google');
  const off = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={off}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={[
        styles.button,
        { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      <View style={styles.disc}>
        {loading ? <ActivityIndicator size="small" color="#4285F4" /> : <GoogleLogo size={18} />}
      </View>
      <Text numberOfLines={1} style={[styles.label, { color: colors.ink }]}>
        {loading ? t('Connecting to Google…') : label}
      </Text>
    </PressableScale>
  );
};

/** The thin line with a word in the middle, between the Google button and the form. */
export const OrDivider: React.FC<{ label: string; style?: StyleProp<ViewStyle> }> = ({ label, style }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.dividerRow, style]} accessibilityRole="text">
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerText, { color: colors.inkMuted }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 52,
  },
  disabled: { opacity: 0.5 },
  disc: {
    position: 'absolute',
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DADCE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  dividerText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
});
