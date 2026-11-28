import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { errorText } from '../../lib/errors';
import { getGoogleIdToken } from '../../lib/googleSignIn';
import { t } from '../../lib/i18n';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Building2 } from '../ui/icons';
import { Button } from '../ui/Button';
import { GoogleButton } from '../ui/GoogleButton';
import { Input } from '../ui/Input';
import { Sheet } from '../ui/Sheet';

interface Props {
  mode: 'signin' | 'signup';
  /** The tab the person chose; the server refuses an account of the other kind. */
  role: 'worker' | 'employer';
  /** HR sign-up: the company name already typed in the form, so it isn't asked again. */
  companyName?: string;
  disabled?: boolean;
}

/**
 * "Sign in / Sign up with Google": Google's one-tap sheet, then our backend logs the person
 * in or creates the account (same button for both; Google accounts work on either screen).
 * A new HR account needs a company name: it is asked in a small sheet, and the same Google
 * token is sent again (it stays valid for an hour).
 */
export const GoogleAuthButton: React.FC<Props> = ({ mode, role, companyName, disabled }) => {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const showToast = useUiStore((s) => s.showToast);
  const colors = useUiStore((s) => s.colors);
  const [busy, setBusy] = useState(false);
  const [askCompany, setAskCompany] = useState(false);
  const [company, setCompany] = useState('');
  const [companyError, setCompanyError] = useState<string>();
  const pendingToken = useRef<string | null>(null);

  const finish = async (idToken: string, name?: string) => {
    const created = await loginWithGoogle(idToken, role, name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast(created ? t('Account created successfully!') : t('Welcome back!'), 'success');
  };

  const start = async () => {
    Haptics.selectionAsync().catch(() => {});
    setBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return; // closed Google's sheet: nothing to say
      try {
        await finish(idToken, role === 'employer' ? companyName?.trim() || undefined : undefined);
      } catch (error) {
        if ((error as { code?: string }).code !== 'COMPANY_NAME_NEEDED') throw error;
        pendingToken.current = idToken;
        setCompany(companyName ?? '');
        setAskCompany(true);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showToast(errorText(error, 'Google sign-in did not work. Please try again.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitCompany = async () => {
    const name = company.trim();
    if (name.length < 2) return setCompanyError('Enter your company or factory name.');
    if (!pendingToken.current) return setAskCompany(false);
    setCompanyError(undefined);
    setBusy(true);
    try {
      await finish(pendingToken.current, name);
      pendingToken.current = null;
      setAskCompany(false);
    } catch (error) {
      setCompanyError(errorText(error, 'Could not create the account. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <GoogleButton mode={mode} onPress={start} loading={busy && !askCompany} disabled={disabled || busy} />
      <Sheet
        visible={askCompany}
        onClose={() => {
          pendingToken.current = null;
          setAskCompany(false);
        }}
        title="One last step"
        subtitle="Your company name. We check every company before its jobs go live."
        scroll={false}
        footer={<Button label="Register company" onPress={submitCompany} loading={busy} />}
      >
        <View style={styles.body}>
          <Input
            label="Company or factory name"
            value={company}
            onChangeText={setCompany}
            autoCapitalize="words"
            autoComplete="organization"
            autoFocus
            returnKeyType="go"
            onSubmitEditing={submitCompany}
            error={companyError}
            leftIcon={<Building2 size={17} color={colors.inkMuted} />}
          />
        </View>
      </Sheet>
    </>
  );
};

const styles = StyleSheet.create({
  body: { paddingBottom: 4 },
});
