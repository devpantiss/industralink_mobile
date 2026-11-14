import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft, Moon, Sun, Menu, Settings, Bell } from '../ui/icons';
import { useQuery } from '@tanstack/react-query';
import { inboxApi, type InboxRole } from '../../api/inboxApi';
import { queryKeys } from '../../api/keys';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Text } from '../ui/Text';
import { LogoMark } from '../ui/LogoMark';
import { useUiStore } from '../../store/uiStore';
import { Glass } from '../ui/Glass';
import { useAuthStore } from '../../store/authStore';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

/**
 * Top bar for tab and drawer screens. Sits on the page background (no white strip or
 * hard line) with the brand mark, and outlined round buttons.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack = false, rightAction }) => {
  const navigation = useNavigation();
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const role = useAuthStore((st) => st.role);
  const isAuthenticated = useAuthStore((st) => st.isAuthenticated);
  // Employer and admin live inside a drawer; workers use bottom tabs and reach Settings from here.
  const hasDrawer = role === 'employer' || role === 'admin';
  const canGoBack = showBack;
  // Workers and companies have an inbox; the red number counts unread updates and messages.
  const hasInbox = isAuthenticated && (role === 'worker' || role === 'employer' || role === 'admin');
  const inboxRole = role as InboxRole;
  const unreadNotes = useQuery({
    queryKey: [...queryKeys.notifications, inboxRole],
    queryFn: () => inboxApi.notifications(inboxRole),
    enabled: hasInbox,
  });
  const unreadThreads = useQuery({
    queryKey: [...queryKeys.messages.threads, inboxRole],
    queryFn: () => inboxApi.threads(inboxRole),
    enabled: hasInbox && role !== 'admin',
  });
  const unread =
    (unreadNotes.data ?? []).filter((n) => !n.read).length + (unreadThreads.data ?? []).reduce((sum, th) => sum + th.unread, 0);

  return (
    <View style={[styles.bar, { backgroundColor: colors.canvas }]}>
      <View style={styles.left}>
        {canGoBack ? (
          <RoundButton
            label="Back"
            // Opened from a link (or after a language change) there may be nothing behind: go to Home.
            onPress={() => {
              if (navigation.canGoBack()) return navigation.goBack();
              const home = !isAuthenticated ? 'Login' : role === 'worker' ? 'WorkerTabs' : role === 'employer' ? 'EmployerDrawer' : 'AdminHome';
              (navigation as any).navigate(home);
            }}
          >
            <ArrowLeft size={20} color={colors.ink} />
          </RoundButton>
        ) : hasDrawer ? (
          <RoundButton label="Open menu" onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Menu size={20} color={colors.ink} />
          </RoundButton>
        ) : null}

        {title ? (
          <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        ) : (
          <View style={styles.brand} accessible accessibilityLabel="IndustriaLink">
            <LogoMark size={30} />
            <Text style={[styles.wordmark, { color: colors.ink }]}>
              IndustriaLink
            </Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        {hasInbox && !canGoBack && (
          <View>
            <RoundButton label={unread ? `Inbox, ${unread} unread` : 'Inbox'} onPress={() => (navigation as any).navigate('Inbox')}>
              <Bell size={18} color={colors.ink} />
            </RoundButton>
            {unread > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.dangerFg, borderColor: colors.canvas }]}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        )}
        <RoundButton label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onPress={toggleTheme}>
          {theme === 'light' ? <Moon size={18} color={colors.ink} /> : <Sun size={18} color={colors.accent} />}
        </RoundButton>
        {role === 'worker' && !canGoBack && (
          <RoundButton label="Settings" onPress={() => (navigation as any).navigate('Settings')}>
            <Settings size={18} color={colors.ink} />
          </RoundButton>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const RoundButton: React.FC<{ label: string; onPress: () => void; children: React.ReactNode }> = ({
  label,
  onPress,
  children,
}) => {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.roundWrap, pressed && { transform: [{ scale: 0.94 }] }]}
    >
      {/* Glass circle: reads as part of the chrome, not another card. */}
      <Glass style={styles.round}>{children}</Glass>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  title: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, flexShrink: 1 },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', lineHeight: 13 },
  roundWrap: { borderRadius: 22 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
