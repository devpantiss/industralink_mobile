import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Search, Users, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { FilterChips } from '../../components/ui/FilterChips';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatDate, formatPhone } from '../../lib/format';
import type { AdminUserRow } from '../../types';

type RoleKey = 'all' | 'worker' | 'employer';
const VERIFY_LABEL = { approved: 'Approved', pending: 'Waiting for approval', rejected: 'Not approved' } as const;

/** Worker and company accounts; suspend anyone abusing the platform (web: Users). */
export const UsersManagementScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const [role, setRole] = useState<RoleKey>('all');
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<AdminUserRow | null>(null);

  const params = { role: role === 'all' ? undefined : role, q: q.trim() || undefined };
  const list = useQuery({ queryKey: queryKeys.admin.users(params), queryFn: () => adminApi.getUsers(params) });

  const toggle = useMutation({
    mutationFn: (u: AdminUserRow) => adminApi.setUserStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended'),
    onSuccess: (u) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast(u.status === 'suspended' ? `${u.name} suspended` : `${u.name} can use IndustriaLink again`, 'success');
      setTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: () => showToast('Something went wrong. Please try again.', 'error'),
  });

  const suspending = target?.status !== 'suspended';

  return (
    <Screen edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.title, { color: colors.ink }]}>Users</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          Worker and company accounts. Suspend anyone who cheats or asks workers for money.
        </Text>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Name, phone or city"
            placeholderTextColor={colors.inkMuted}
            style={[styles.searchInput, { color: colors.ink }]}
            returnKeyType="search"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={18} color={colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>

        <FilterChips<RoleKey>
          style={styles.chips}
          value={role}
          onChange={setRole}
          options={[
            { key: 'all', label: 'All' },
            { key: 'worker', label: 'Workers' },
            { key: 'employer', label: 'Companies' },
          ]}
        />

        {list.isLoading ? (
          <ListSkeleton />
        ) : !list.data?.length ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <Users size={30} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>No one found</Text>
          </View>
        ) : (
          list.data.map((u) => {
            const suspended = u.status === 'suspended';
            return (
              <Animated.View
                key={u.id}
                entering={FadeIn.duration(180)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.top}>
                  <Avatar name={u.name} size="md" square={u.role === 'employer'} />
                  <View style={styles.flex}>
                    <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <Text style={[styles.meta, { color: colors.inkSecondary }]} numberOfLines={1}>
                      {u.role === 'worker' ? 'Worker' : 'Company'} · {formatPhone(u.contact)} · {u.city}
                    </Text>
                    <Text style={[styles.joined, { color: colors.inkMuted }]}>Joined {formatDate(u.joinedAt)}</Text>
                  </View>
                </View>
                <View style={[styles.foot, { borderTopColor: colors.border }]}>
                  <View style={styles.pills}>
                    <Pill
                      text={suspended ? 'Suspended' : 'Active'}
                      bg={suspended ? colors.dangerBg : colors.successBg}
                      fg={suspended ? colors.dangerFg : colors.successFg}
                    />
                    {u.verification && (
                      <Pill
                        text={VERIFY_LABEL[u.verification]}
                        bg={u.verification === 'approved' ? colors.primarySoft : u.verification === 'pending' ? colors.warningBg : colors.neutralBg}
                        fg={u.verification === 'approved' ? colors.primary : u.verification === 'pending' ? colors.warningFg : colors.neutralFg}
                      />
                    )}
                  </View>
                  <Pressable
                    onPress={() => setTarget(u)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.action,
                      {
                        borderColor: suspended ? colors.primary : colors.dangerFg,
                        backgroundColor: pressed ? (suspended ? colors.primarySoft : colors.dangerBg) : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: suspended ? colors.primary : colors.dangerFg }]}>
                      {suspended ? 'Reactivate' : 'Suspend'}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Dialog
        visible={!!target}
        onClose={() => setTarget(null)}
        title={target ? `${suspending ? 'Suspend' : 'Reactivate'} ${target.name}?` : ''}
        message={
          suspending
            ? target?.role === 'employer'
              ? 'They are logged out and all their jobs are hidden from workers until you reactivate them.'
              : 'They are logged out and cannot apply to jobs until you reactivate them.'
            : 'They can log in and use IndustriaLink again.'
        }
        actions={
          <>
            <Button label="Cancel" variant="secondary" size="sm" onPress={() => setTarget(null)} />
            <Button
              label={suspending ? 'Suspend' : 'Reactivate'}
              variant={suspending ? 'danger' : 'primary'}
              size="sm"
              loading={toggle.isPending}
              onPress={() => target && toggle.mutate(target)}
            />
          </>
        }
      />
    </Screen>
  );
};

const Pill: React.FC<{ text: string; bg: string; fg: string }> = ({ text, bg, fg }) => (
  <View style={[styles.pill, { backgroundColor: bg }]}>
    <Text style={[styles.pillText, { color: fg }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 14, lineHeight: 18 },
  search: { height: 46, borderRadius: 23, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  chips: { paddingVertical: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 1 },
  joined: { fontSize: 12, marginTop: 2 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 10 },
  pills: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },
  action: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '700' },
  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});
