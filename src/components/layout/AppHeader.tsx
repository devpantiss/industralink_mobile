import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Moon, Sun, Shield, Briefcase, HardHat } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
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
  const { role, switchRole } = useAuthStore();

  const handleRoleCycle = () => {
    if (role === 'worker') switchRole('employer');
    else if (role === 'employer') switchRole('admin');
    else switchRole('worker');
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'worker':
        return <HardHat size={16} color={colors.primary} />;
      case 'employer':
        return <Briefcase size={16} color={colors.primary} />;
      case 'admin':
        return <Shield size={16} color={colors.primary} />;
    }
  };

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
        {showBack && navigation.canGoBack() && (
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
        {/* Quick Role Switcher Pill for easy switching during development */}
        <TouchableOpacity
          onPress={handleRoleCycle}
          style={[styles.rolePill, { backgroundColor: colors.primarySoft }]}
          activeOpacity={0.8}
        >
          {getRoleIcon()}
          <Text
            style={[
              typography.caption,
              styles.roleText,
              { color: colors.primary },
            ]}
          >
            {role.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: colors.surfaceMuted }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {theme === 'light' ? (
            <Moon size={18} color={colors.ink} />
          ) : (
            <Sun size={18} color={colors.accent} />
          )}
        </TouchableOpacity>

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
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  roleText: {
    fontWeight: '700',
    marginLeft: 4,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

