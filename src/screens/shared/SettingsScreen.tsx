import { errorText, isValidPhone } from '../../lib/errors';
import { Toggle } from '../../components/ui/Toggle';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../../components/ui/Text';
import { Moon, Sun, Globe, LogOut, Check, Smartphone, Lock, Trash2, LifeBuoy, ChevronRight, Bell, ShieldCheck, ScrollText, type AppIcon } from '../../components/ui/icons';
import type { TileColors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/ui/Input';
import { accountApi } from '../../api/accountApi';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import type { PlatformSettings, UserSettings } from '../../types';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { t } from '../../lib/i18n';
import { getPushState, pushSupported, turnOffPush, turnOnPush, type PushState } from '../../lib/push';
import { useAppActive } from '../../api/liveChat';
import { typography } from '../../theme/typography';

export const SettingsScreen: React.FC = () => {
  const { colors, themePref, setThemePref, language, setLanguage, showToast } = useUiStore();
  const { user, role, logout, updateUser } = useAuthStore();
  const currentLang = language;
  const qc = useQueryClient();
  const navigation = useNavigation<any>();

  const settingsQuery = useQuery({ queryKey: queryKeys.settings, queryFn: () => accountApi.getSettings() });
  const saveSettings = useMutation({
    mutationFn: (changes: Partial<UserSettings>) => accountApi.updateSettings(changes),
    onSuccess: (data) => qc.setQueryData(queryKeys.settings, data),
    onError: (e) => showToast(errorText(e, 'Could not save. Check your connection and try again.'), 'error'),
  });
  const settings = settingsQuery.data;

  // Platform rules (admin only)
  const platformQuery = useQuery({
    queryKey: queryKeys.admin.platform,
    queryFn: () => adminApi.getPlatformSettings(),
    enabled: role === 'admin',
  });
  const savePlatform = useMutation({
    mutationFn: (changes: Partial<PlatformSettings>) => adminApi.updatePlatformSettings(changes),
    onSuccess: (data) => qc.setQueryData(queryKeys.admin.platform, data),
    onError: (e) => showToast(errorText(e, 'Could not save. Try again.'), 'error'),
  });
  const platform = platformQuery.data;

  // Phone notifications. Read again when coming back, e.g. from the phone's own settings.
  const appActive = useAppActive();
  const [push, setPush] = useState<PushState | null>(null);
  useEffect(() => {
    if (pushSupported && appActive) getPushState().then(setPush).catch(() => {});
  }, [appActive]);
  const togglePush = async (on: boolean) => {
    if (on && push === 'blocked') return void Linking.openSettings();
    try {
      if (on) setPush(await turnOnPush());
      else {
        await turnOffPush();
        setPush('off');
      }
    } catch (e) {
      showToast(errorText(e, 'Could not save. Check your connection and try again.'), 'error');
    }
  };

  // Password: change it, or set a first one on an account made with Google (then both work).
  const hasPassword = user?.hasPassword !== false;
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState<string>();
  const changePw = useMutation({
    mutationFn: () => {
      if (newPw.length < 8) throw new Error(t('Use at least 8 characters for your password.'));
      return accountApi.changePassword(hasPassword ? curPw : undefined, newPw);
    },
    onSuccess: () => {
      setCurPw('');
      setNewPw('');
      setPwError(undefined);
      updateUser({ hasPassword: true });
      showToast(hasPassword ? t('Password changed. Other devices are logged out.') : t('Password set.'), 'success');
    },
    onError: (e) => setPwError(errorText(e, 'Could not change the password.')),
  });

  // Worker's mobile number: companies call it after shortlisting.
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [phoneError, setPhoneError] = useState<string>();
  const savePhone = useMutation({
    mutationFn: () => {
      if (!isValidPhone(phone)) throw new Error(t('Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.'));
      return accountApi.savePhone(phone);
    },
    onSuccess: (saved) => {
      setPhoneError(undefined);
      updateUser({ phone: saved.phone });
      showToast(t('Mobile number saved.'), 'success');
    },
    onError: (e) => setPhoneError(errorText(e, 'Could not save. Check your connection and try again.')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => accountApi.deleteAccount(),
    onSuccess: () => logout(),
    onError: (e) => showToast(errorText(e, 'Could not save. Check your connection and try again.'), 'error'),
  });
  const confirmDelete = () =>
    Alert.alert(
      t('Delete my account?'),
      t('Your profile, applications and documents will be removed. This cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Delete account'), style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  ];

  const handleLanguageChange = (code: string, label: string) => {
    Haptics.selectionAsync();
    setLanguage(code as 'en' | 'hi' | 'or');
    showToast(`${t('Language')}: ${label}`, 'success');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t('Settings')} showBack={role === 'worker'} />
      <KeyboardScrollView contentContainerStyle={styles.scroll}>
        {/* Account */}
        <Card style={styles.card}>
          <Text style={[typography.h2, { color: colors.ink, fontWeight: '700' }]}>{user?.name}</Text>
          <Text style={[typography.caption, { color: colors.inkSecondary }]}>
            {t(role === 'worker' ? 'Worker' : role === 'employer' ? 'Employer' : 'Admin')} · {user?.phone ?? user?.email}
          </Text>
        </Card>

        {/* Vernacular Language Selector (workers only) */}
        {role === 'worker' && (
        <Card style={styles.card}>
          <SectionTitle icon={Globe} tone={colors.tiles.blue}>{t('Language')} (भाषा / ଭାଷା)</SectionTitle>
          {languages.map((lang, idx) => {
            const isSelected = currentLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code, lang.label)}
                style={[
                  styles.langRow,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                ]}
              >
                <Globe size={18} color={isSelected ? colors.primary : colors.inkMuted} />
                <View style={styles.langTextBlock}>
                  <Text
                    style={[
                      typography.body,
                      { color: isSelected ? colors.primary : colors.ink, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {lang.native} ({lang.label})
                  </Text>
                </View>
                {isSelected && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </Card>
        )}


        {/* Alerts */}
        {(push || (role !== 'admin' && settings)) && (
          <Card style={styles.card}>
            <SectionTitle icon={Bell} tone={colors.tiles.orange}>{t('Alerts')}</SectionTitle>
            {push && (
              <SettingSwitch
                label={t('Phone notifications')}
                hint={
                  push === 'blocked'
                    ? t('Blocked in your phone settings. Turn on to open them.')
                    : t('Messages and job updates on this phone.')
                }
                value={push === 'on'}
                onChange={togglePush}
              />
            )}
            {role !== 'admin' && settings && (<>
            <SettingSwitch
              label={role === 'worker' ? t('New jobs that match me') : 'New applicants on my jobs'}
              value={settings.jobAlerts}
              onChange={(v) => saveSettings.mutate({ jobAlerts: v })}
            />
            <SettingSwitch
              label={t('SMS')}
              hint={role === 'worker' ? t('Interview and offer updates by SMS.') : undefined}
              value={settings.smsAlerts}
              onChange={(v) => saveSettings.mutate({ smsAlerts: v })}
            />
            <SettingSwitch
              label="WhatsApp"
              hint={role === 'worker' ? t('Job alerts and updates on WhatsApp.') : undefined}
              value={settings.whatsappAlerts}
              onChange={(v) => saveSettings.mutate({ whatsappAlerts: v })}
            />
            </>)}
          </Card>
        )}

        {/* Privacy (workers) */}
        {role === 'worker' && settings && (
          <Card style={styles.card}>
            <SectionTitle icon={ShieldCheck} tone={colors.tiles.green}>{t('Privacy')}</SectionTitle>
            <SettingSwitch
              label={t('Let companies find my profile')}
              hint={t('Verified companies can see your trade, experience and city, and invite you to apply. Your phone number stays hidden until you apply.')}
              value={settings.visibleToEmployers}
              onChange={(v) => saveSettings.mutate({ visibleToEmployers: v })}
            />
          </Card>
        )}

        {/* Platform rules (admin) */}
        {role === 'admin' && platform && (
          <Card style={styles.card}>
            <SectionTitle icon={ScrollText} tone={colors.tiles.purple}>Platform rules</SectionTitle>
            <SettingSwitch
              label="Approve companies automatically"
              hint="New companies go live without your approval. Not recommended."
              value={platform.autoApproveCompanies}
              onChange={(v) => savePlatform.mutate({ autoApproveCompanies: v })}
            />
            <SettingSwitch
              label="Messaging between workers and HR"
              hint="Both sides can message after a worker is shortlisted."
              value={platform.messagingEnabled}
              onChange={(v) => savePlatform.mutate({ messagingEnabled: v })}
            />
            <SettingSwitch
              label="Let employers search workers"
              hint="Only workers who allow it can be found."
              value={platform.talentSearchEnabled}
              onChange={(v) => savePlatform.mutate({ talentSearchEnabled: v })}
            />
          </Card>
        )}

        {/* Display & Dark Theme */}
        <Card style={styles.card}>
          <SectionTitle icon={Moon} tone={colors.tiles.purple}>{t('Appearance')}</SectionTitle>
          <Text style={[typography.caption, { color: colors.inkSecondary, marginBottom: spacing.sm }]}>
            {t('Light is the default. System follows your phone.')}
          </Text>
          <SegmentedTabs
            value={themePref}
            onChange={setThemePref}
            items={[
              { key: 'light', label: t('Light'), icon: (c) => <Sun size={16} color={c} /> },
              { key: 'dark', label: t('Dark'), icon: (c) => <Moon size={16} color={c} /> },
              { key: 'system', label: t('System'), icon: (c) => <Smartphone size={16} color={c} /> },
            ]}
          />
        </Card>


        {role === 'worker' && (
          <Card style={styles.card}>
            <SectionTitle icon={Smartphone} tone={colors.tiles.green}>{t('Mobile number')}</SectionTitle>
            <Text style={[typography.caption, { color: colors.inkSecondary, marginBottom: 8 }]}>
              {t('Companies call this number when they shortlist you.')}
            </Text>
            <Input
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="98765 43210"
              error={phoneError}
              leftIcon={<Text style={[typography.body, { color: colors.ink, fontWeight: '700' }]}>+91</Text>}
            />
            <Button
              label={t('Save number')}
              variant="outline"
              onPress={() => savePhone.mutate()}
              loading={savePhone.isPending}
              disabled={phone === (user?.phone ?? '')}
            />
          </Card>
        )}

        {/* Password: every account. Accounts made with Google can add one. */}
        <Card style={styles.card}>
          <SectionTitle icon={Lock} tone={colors.tiles.rose}>
            {hasPassword ? t('Change password') : t('Set a password')}
          </SectionTitle>
          {!hasPassword && (
            <Text style={[typography.caption, { color: colors.inkSecondary, marginBottom: 8 }]}>
              {t('You sign in with Google. Add a password to also log in with your email.')}
            </Text>
          )}
          {hasPassword && (
            <Input
              label={t('Current password')}
              value={curPw}
              onChangeText={setCurPw}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              leftIcon={<Lock size={17} color={colors.inkMuted} />}
            />
          )}
          <Input
            label={t('New password (8+ characters)')}
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            error={pwError}
            leftIcon={<Lock size={17} color={colors.inkMuted} />}
          />
          <Button
            label={hasPassword ? t('Change password') : t('Set password')}
            variant="outline"
            onPress={() => changePw.mutate()}
            loading={changePw.isPending}
          />
        </Card>

        {role !== 'admin' && (
          <Card style={styles.card} onPress={() => navigation.navigate('Help')}>
            <View style={styles.helpRow}>
              <LifeBuoy size={20} color={colors.primary} />
              <View style={styles.switchText}>
                <Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>{t('Help & support')}</Text>
                <Text style={[typography.caption, { color: colors.inkSecondary, marginTop: 2 }]}>{t('Common questions, or send us a message')}</Text>
              </View>
              <ChevronRight size={18} color={colors.inkMuted} />
            </View>
          </Card>
        )}

        <View style={styles.legalRow}>
          {(['terms', 'privacy', 'nofees'] as const).map((k) => (
            <TouchableOpacity key={k} onPress={() => navigation.navigate('Legal', { kind: k })} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={[typography.small, { color: colors.inkSecondary, fontWeight: '600' }]}>
                {t(k === 'terms' ? 'Terms' : k === 'privacy' ? 'Privacy' : 'No fees')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={t('Log out')}
          variant="outline"
          icon={<LogOut size={18} color={colors.dangerFg} />}
          onPress={logout}
          style={styles.logoutBtn}
          textStyle={{ color: colors.dangerFg }}
        />

        {role !== 'admin' && (
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteRow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={16} color={colors.inkMuted} />
            <Text style={[typography.small, { color: colors.inkMuted, fontWeight: '600' }]}>{t('Delete my account')}</Text>
          </TouchableOpacity>
        )}
      </KeyboardScrollView>
    </Screen>
  );
};

const SettingSwitch: React.FC<{ label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label,
  hint,
  value,
  onChange,
}) => {
  const { colors } = useUiStore();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>{label}</Text>
        {hint ? <Text style={[typography.caption, { color: colors.inkSecondary, marginTop: 2 }]}>{hint}</Text> : null}
      </View>
      <Toggle
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

/** Card heading with a tinted duotone icon chip. */
const SectionTitle: React.FC<{ icon: AppIcon; tone: TileColors; children: React.ReactNode }> = ({ icon: Icon, tone, children }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionChip, { backgroundColor: tone.bg }]}>
        <Icon size={18} color={tone.text} weight="duotone" duotoneOpacity={0.3} />
      </View>
      <Text style={[typography.h3, styles.sectionTitleText, { color: colors.ink }]} accessibilityRole="header">
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  sectionChip: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontWeight: '700', flex: 1 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: spacing.sm, minHeight: 52 },
  switchText: { flex: 1 },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, marginBottom: spacing['3xl'] },
  scroll: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  langTextBlock: {
    flex: 1,
    marginLeft: spacing.sm + 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  settingText: {
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  logoutBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
