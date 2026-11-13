import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft, Moon, Sun, Menu, Settings } from 'lucide-react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Text } from '../ui/Text';
import { LogoMark } from '../ui/LogoMark';
import { useUiStore } from '../../store/uiStore';
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
  const colors = useUiStore((s) => s.colors);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: pressed ? colors.surfaceStrong : colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
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
  wordmark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
