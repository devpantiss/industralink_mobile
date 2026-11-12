import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Bell, Shield, LogOut, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import i18n from '../../lib/i18n';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const SettingsScreen: React.FC = () => {
  const { colors, theme, toggleTheme, showToast } = useUiStore();
  const { user, role, switchRole, logout } = useAuthStore();
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  ];

  const handleLanguageChange = (code: string, label: string) => {
    Haptics.selectionAsync();
    i18n.changeLanguage(code);
    setCurrentLang(code);
    showToast(`App language set to ${label}`, 'success');
  };

  return (
    <Screen edges={['top']}>
      <AppHeader title="App Settings" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account Info */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            Active Account
          </Text>
          <Text style={[typography.h2, { color: colors.ink, fontWeight: '700' }]}>
            {user?.name}
          </Text>
          <Text style={[typography.caption, { color: colors.inkSecondary }]}>
            Current Role: {role.toUpperCase()} • {user?.phone}
          </Text>

          <View style={styles.roleSwitchRow}>
            {(['worker', 'employer', 'admin'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => {
                  Haptics.selectionAsync();
                  switchRole(r);
                  showToast(`Switched active role to ${r.toUpperCase()}`, 'info');
                }}
                style={[
                  styles.rolePill,
                  {
                    backgroundColor: role === r ? colors.primary : colors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: role === r ? '#FFFFFF' : colors.ink,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Vernacular Language Selector */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            Regional Language (भाषा / ଭାଷା)
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

        {/* Display & Dark Theme */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            Display & Appearance
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {theme === 'dark' ? (
                <Moon size={20} color={colors.primary} />
              ) : (
                <Sun size={20} color={colors.accent} />
              )}
              <View style={styles.settingText}>
                <Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>
                  Cobalt Night (Dark Mode)
                </Text>
                <Text style={[typography.caption, { color: colors.inkSecondary }]}>
                  High contrast dark theme for industrial shopfloors
                </Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              thumbColor={colors.surface}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Card>

        <Button
          label="Log Out of IndustriaLink"
          variant="outline"
          icon={<LogOut size={18} color={colors.dangerFg} />}
          onPress={logout}
          style={styles.logoutBtn}
          textStyle={{ color: colors.dangerFg }}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
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
  roleSwitchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
