import { errorText } from '../../lib/errors';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MailCheck, Mail } from '../../components/ui/icons';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { authApi } from '../../api/authApi';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { t } from '../../lib/i18n';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

/**
 * Every account with a password. The backend sends the link once the email service is set up
 * (my-notes/STATUS.md); accounts made with Google don't need it.
 */
export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useUiStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('Enter a valid email address.'));
    setError(undefined);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(errorText(e, 'Could not send the email. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t('Forgot password?')} showBack />
      <KeyboardScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: colors.successBg }]}>
              <MailCheck size={28} color={colors.successFg} />
            </View>
            <Text style={[typography.h2, { color: colors.ink, textAlign: 'center' }]}>{t('Check your email')}</Text>
            <Text style={[typography.body, { color: colors.inkSecondary, textAlign: 'center' }]}>
              {t('If {email} has an account, we sent a link to set a new password.', { email: email.trim() })}
            </Text>
            <Button label={t('Back to log in')} variant="ghost" onPress={() => navigation.navigate('Login')} />
          </View>
        ) : (
          <>
            <Text style={[typography.h1, { color: colors.ink }]}>{t('Reset your password')}</Text>
            <Text style={[typography.body, styles.lead, { color: colors.inkSecondary }]}>
              {t('Enter the email you signed up with. We will send you a link to set a new password.')}
            </Text>
            <Input
              label={t('Email')}
              value={email}
              onChangeText={setEmail}
              placeholder="name@company.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={error}
              leftIcon={<Mail size={17} color={colors.inkMuted} />}
            />
            <Button label={t('Send reset link')} onPress={submit} loading={loading} />
          </>
        )}
      </KeyboardScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md },
  lead: { marginBottom: spacing.sm },
  center: { alignItems: 'center', gap: spacing.md, paddingTop: spacing['3xl'] },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
