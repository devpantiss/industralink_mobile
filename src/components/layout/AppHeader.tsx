import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Moon, Sun, Menu, Settings } from 'lucide-react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  rightAction,
}) => {
  const navigation = useNavigation();
  const { colors, theme, toggleTheme } = useUiStore();
  const role = useAuthStore((st) => st.role);
  // Employer and admin live inside a drawer; workers use bottom tabs and reach Settings from here.
  const hasDrawer = role === 'employer' || role === 'admin';
  const canGoBack = showBack && navigation.canGoBack();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.left}>
        {!canGoBack && hasDrawer && (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Open menu"
          >
            <Menu size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        {canGoBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        {title ? (
          <Text
            style={[
              typography.h2,
              styles.title,
              { color: colors.ink },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : (
          <View style={styles.brandRow}>
            <View style={[styles.brandDot, { backgroundColor: colors.accent }]} />
            <Text style={[typography.h2, { color: colors.ink, fontWeight: '700' }]}>
              IndustriaLink
            </Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={toggleTheme}
          accessibilityLabel="Switch light or dark mode"
          style={[styles.themeBtn, { backgroundColor: colors.surfaceMuted }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {theme === 'light' ? (
            <Moon size={18} color={colors.ink} />
          ) : (
            <Sun size={18} color={colors.accent} />
          )}
        </TouchableOpacity>

        {role === 'worker' && !canGoBack && (
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('Settings')}
            style={[styles.themeBtn, { backgroundColor: colors.surfaceMuted, marginLeft: 8 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Settings"
          >
            <Settings size={18} color={colors.ink} />
          </TouchableOpacity>
        )}

        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginRight: spacing.md,
  },
  title: {
    fontWeight: '700',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

