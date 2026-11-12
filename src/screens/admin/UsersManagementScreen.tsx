import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { Search, UserCheck, ShieldAlert, UserX, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';
import { formatPhone } from '../../lib/format';

interface UserItem {
  id: string;
  name: string;
  role: 'Worker' | 'Employer' | 'Admin';
  phone: string;
  companyName?: string;
  status: 'active' | 'suspended';
  trade?: string;
}

export const UsersManagementScreen: React.FC = () => {
  const { colors, showToast } = useUiStore();
  const [roleFilter, setRoleFilter] = useState<'all' | 'Worker' | 'Employer'>('all');
  const [q, setQ] = useState('');

  const [userList, setUserList] = useState<UserItem[]>([
    {
      id: 'u1',
      name: 'Ramesh Kumar',
      role: 'Worker',
      phone: '9876543210',
      trade: 'Welder (MIG)',
      status: 'active',
    },
    {
      id: 'u2',
      name: 'National Heavy Eng HR Team',
      role: 'Employer',
      companyName: 'National Heavy Engineering',
      phone: '9811122334',
      status: 'active',
    },
    {
      id: 'u3',
      name: 'Bikash Mohanty',
      role: 'Worker',
      phone: '9899988877',
      trade: 'Substation Electrician',
      status: 'active',
    },
    {
      id: 'u4',
      name: 'Unverified Placement Agency',
      role: 'Employer',
      companyName: 'Kalinganagar Manpower',
      phone: '9123456789',
      status: 'suspended',
    },
  ]);

  const toggleStatus = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const next = u.status === 'active' ? 'suspended' : 'active';
          showToast(
            next === 'suspended' ? `Suspended ${u.name}` : `Reactivated ${u.name}`,
            next === 'suspended' ? 'warning' : 'success'
          );
          return { ...u, status: next };
        }
        return u;
      })
    );
  };

  const filtered = userList.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      u.name.toLowerCase().includes(s) ||
      u.phone.includes(s) ||
      (u.companyName && u.companyName.toLowerCase().includes(s))
    );
  });

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('User moderation')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
            {t('Monitor and manage worker and employer accounts.')}
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('Search name, phone or company…')}
            placeholderTextColor={colors.inkMuted}
            style={[styles.searchInput, { color: colors.ink }]}
          />
        </View>

        {/* Role Filter Chips */}
        <View style={styles.rolesRow}>
          {(['all', 'Worker', 'Employer'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRoleFilter(r)}
              style={[
                styles.roleChip,
                {
                  backgroundColor: roleFilter === r ? colors.primary : colors.surfaceMuted,
                  borderColor: roleFilter === r ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: roleFilter === r ? '#FFF' : colors.inkSecondary, fontWeight: '600', fontSize: 13 }}>
                {r === 'all' ? t('All users') : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Card List */}
        <View style={{ gap: 10 }}>
          {filtered.map((u) => (
            <View
              key={u.id}
              style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.userTopRow}>
                <Avatar name={u.name} size="md" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.ink }]}>{u.name}</Text>
                  <Text style={[styles.userMeta, { color: colors.inkSecondary }]}>
                    {u.role} · {formatPhone(u.phone)} {u.companyName ? `· ${u.companyName}` : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: u.status === 'active' ? colors.successBg : colors.dangerBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: u.status === 'active' ? colors.successFg : colors.dangerFg },
                    ]}
                  >
                    {u.status === 'active' ? t('Active') : t('Suspended')}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => toggleStatus(u.id)}
                  style={[
                    styles.actionBtn,
                    {
                      borderColor: u.status === 'active' ? colors.dangerFg : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: u.status === 'active' ? colors.dangerFg : colors.primary },
                    ]}
                  >
                    {u.status === 'active' ? t('Suspend account') : t('Reactivate account')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 14,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
  },
  searchBar: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  userCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  userMeta: {
    fontSize: 12.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
