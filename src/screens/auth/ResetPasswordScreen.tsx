import { errorText } from '../../lib/errors';
import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Lock } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { authApi } from '../../api/authApi';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

/** Opened from the emailed link: industrialink://reset-password?token=... */
export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, showToast } = useUiStore();
  const token = route.params?.token ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setError(undefined);
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      showToast('Password changed. Log in with your new password.', 'success');
      navigation.navigate('Login');
    } catch (e: any) {
      setError(errorText(e, 'Could not change the password. Ask for a new link.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title="New password" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[typography.h1, { color: colors.ink }]}>Set a new password</Text>
        <Text style={[typography.body, styles.lead, { color: colors.inkSecondary }]}>
          Use at least 8 characters.
        </Text>
        <Input
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          leftIcon={<Lock size={17} color={colors.inkMuted} />}
        />
        <Input
          label="Repeat new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          error={error}
          leftIcon={<Lock size={17} color={colors.inkMuted} />}
        />
        <Button label="Save password" onPress={submit} loading={loading} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md },
  lead: { marginBottom: spacing.sm },
});
