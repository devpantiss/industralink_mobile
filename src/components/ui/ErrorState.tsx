import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WifiOff } from './icons';
import { Text } from './Text';
import { Button } from './Button';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';

interface Props {
  /** Called when the person taps "Try again" (usually the query's refetch). */
  onRetry: () => void;
  message?: string;
}

/** Shown in place of a list or page when loading failed. */
export const ErrorState: React.FC<Props> = ({ onRetry, message }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.box, { backgroundColor: colors.surfaceMuted }]} accessibilityRole="alert">
      <View style={[styles.iconRing, { backgroundColor: colors.warningBg }]}>
        <WifiOff size={30} color={colors.warningFg} weight="duotone" duotoneOpacity={0.3} />
      </View>
      <Text style={[styles.title, { color: colors.ink }]}>{t('Could not load')}</Text>
      <Text style={[styles.body, { color: colors.inkSecondary }]}>
        {message ?? t('Check your internet connection and try again.')}
      </Text>
      <Button label={t('Try again')} variant="outline" onPress={onRetry} />
    </View>
  );
};

const styles = StyleSheet.create({
  box: { margin: 16, padding: 24, borderRadius: 20, alignItems: 'center', gap: 10 },
  iconRing: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 13.5, lineHeight: 19, textAlign: 'center', marginBottom: 4 },
});
