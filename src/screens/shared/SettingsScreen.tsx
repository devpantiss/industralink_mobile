import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../../components/ui/Text';
import { Moon, Sun, Globe, LogOut, Check, Smartphone, Lock, Trash2 } from 'lucide-react-native';
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
import { USE_MOCKS } from '../../api/client';
import { typography } from '../../theme/typography';

export const SettingsScreen: React.FC = () => {
  const { colors, themePref, setThemePref, language, setLanguage, showToast } = useUiStore();
  const { user, role, switchRole, logout } = useAuthStore();
  const currentLang = language;
  const qc = useQueryClient();

  const settingsQuery = useQuery({ queryKey: queryKeys.settings, queryFn: () => accountApi.getSettings() });
  const saveSettings = useMutation({
    mutationFn: (changes: Partial<UserSettings>) => accountApi.updateSettings(changes),
    onSuccess: (data) => qc.setQueryData(queryKeys.settings, data),
    onError: () => showToast(t('Could not save. Check your connection and try again.'), 'error'),
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
    onError: () => showToast('Could not save. Try again.', 'error'),
  });
  const platform = platformQuery.data;

  // Password (company and admin accounts)
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState<string>();
  const changePw = useMutation({
    mutationFn: () => accountApi.changePassword(curPw, newPw),
    onSuccess: () => {
      setCurPw('');
      setNewPw('');
      setPwError(undefined);
      showToast('Password changed.', 'success');
    },
    onError: (e: Error) => setPwError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => accountApi.deleteAccount(),
    onSuccess: () => logout(),
    onError: () => showToast(t('Could not save. Check your connection and try again.'), 'error'),
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
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account */}
        <Card style={styles.card}>
          <Text style={[typography.h2, { color: colors.ink, fontWeight: '700' }]}>{user?.name}</Text>
          <Text style={[typography.caption, { color: colors.inkSecondary }]}>
            {t(role === 'worker' ? 'Worker' : role === 'employer' ? 'Employer' : 'Admin')} · {user?.phone}
          </Text>

          {/* Demo data only: lets a presenter jump between the three sides of the app. */}
          {USE_MOCKS && (
            <>
              <Text style={[typography.caption, styles.demoLabel, { color: colors.inkMuted }]}>Demo only: switch role</Text>
              <View style={styles.roleSwitchRow}>
                {(['worker', 'employer', 'admin'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === r }}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      switchRole(r);
                    }}
                    style={[styles.rolePill, { backgroundColor: role === r ? colors.primary : colors.surfaceMuted }]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        { color: role === r ? '#FFFFFF' : colors.ink, fontWeight: '700', textTransform: 'capitalize' },
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Vernacular Language Selector */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            {t('Language')} (भाषा / ଭାଷା)
          </Text>
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


        {/* Alerts */}
        {role !== 'admin' && settings && (
          <Card style={styles.card}>
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>{t('Alerts')}</Text>
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
          </Card>
        )}

        {/* Privacy (workers) */}
        {role === 'worker' && settings && (
          <Card style={styles.card}>
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>{t('Privacy')}</Text>
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
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>Platform rules</Text>
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
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            {t('Appearance')}
          </Text>
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


        {/* Password (company and admin accounts; workers sign in with an SMS code) */}
        {role !== 'worker' && (
          <Card style={styles.card}>
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>Change password</Text>
            <Input
              label="Current password"
              value={curPw}
              onChangeText={setCurPw}
              secureTextEntry
              autoCapitalize="none"
              leftIcon={<Lock size={17} color={colors.inkMuted} />}
            />
            <Input
              label="New password"
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              error={pwError}
              leftIcon={<Lock size={17} color={colors.inkMuted} />}
            />
            <Button label="Change password" variant="outline" onPress={() => changePw.mutate()} loading={changePw.isPending} />
          </Card>
        )}

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
      </ScrollView>
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
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: spacing.sm, minHeight: 52 },
  switchText: { flex: 1 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, marginBottom: spacing['3xl'] },
  scroll: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  demoLabel: { marginTop: spacing.md, fontWeight: '600' },
  roleSwitchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
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
