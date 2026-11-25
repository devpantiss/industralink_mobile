import React, { useState } from 'react';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { View, StyleSheet, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Search, X } from '../../components/ui/icons';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { FilterChips } from '../../components/ui/FilterChips';
import { Dialog } from '../../components/ui/Dialog';
import { Sheet } from '../../components/ui/Sheet';
import { ReasonPicker } from './AdminJobsScreen';
import { errorText } from '../../lib/errors';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatDate, formatPhone } from '../../lib/format';
import type { AdminUserRow } from '../../types';
import { shadows } from '../../theme/shadows';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { EmptyState } from '../../components/ui/EmptyState';

type RoleKey = 'all' | 'worker' | 'employer';
const SUSPEND_REASONS = ['Asked workers for money', 'Fake or false details', 'Abusive behaviour', 'Repeated policy breaks', 'Other'];
const VERIFY_LABEL = { approved: 'Approved', pending: 'Waiting for approval', rejected: 'Not approved' } as const;

/** Worker and company accounts; block anyone abusing the platform (web: Users). */
export const UsersManagementScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const [role, setRole] = useState<RoleKey>('all');
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<AdminUserRow | null>(null);
  const [reason, setReason] = useState(SUSPEND_REASONS[0]!);
  const [detail, setDetail] = useState('');

  const params = { role: role === 'all' ? undefined : role, q: q.trim() || undefined };
  const list = useQuery({ queryKey: queryKeys.admin.users(params), queryFn: () => adminApi.getUsers(params) });

  const toggle = useMutation({
    mutationFn: (u: AdminUserRow) =>
      adminApi.setUserStatus(
        u.id,
        u.status === 'blocked' ? 'active' : 'blocked',
        u.status === 'blocked' ? undefined : reason === 'Other' ? detail.trim() : `${reason}${detail.trim() ? `: ${detail.trim()}` : ''}`
      ),
    onSuccess: (u) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast(u.status === 'blocked' ? `${u.name} is blocked` : `${u.name} can use IndustriaLink again`, 'success');
      setTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (e) => showToast(errorText(e), 'error'),
  });

  const impact = useQuery({
    queryKey: ['admin', 'impact', target?.id],
    queryFn: () => adminApi.getUserImpact(target!.id),
    enabled: !!target && target.role === 'employer' && target.status !== 'blocked',
  });

  const blocking = target?.status !== 'blocked';

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader />
      <KeyboardScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh onRefresh={() => list.refetch()} />
        }
      >
        <Text style={[styles.title, { color: colors.ink }]}>Users</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          Worker and company accounts. Block anyone who cheats or asks workers for money.
        </Text>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Name, phone or city"
            placeholderTextColor={colors.placeholder}
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
          <EmptyState art="people" title="No one found" />
        ) : (
          list.data.map((u) => {
            const blocked = u.status === 'blocked';
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
                      text={blocked ? 'Blocked' : 'Active'}
                      bg={blocked ? colors.dangerBg : colors.successBg}
                      fg={blocked ? colors.dangerFg : colors.successFg}
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
                    onPress={() => {
                      setReason(SUSPEND_REASONS[0]!);
                      setDetail('');
                      setTarget(u);
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.action,
                      {
                        borderColor: blocked ? colors.primary : colors.dangerFg,
                        backgroundColor: pressed ? (blocked ? colors.primarySoft : colors.dangerBg) : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: blocked ? colors.primary : colors.dangerFg }]}>
                      {blocked ? 'Unblock' : 'Block'}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            );
          })
        )}
      </KeyboardScrollView>

      <Dialog
        visible={!!target && !blocking}
        onClose={() => setTarget(null)}
        title={target ? `Reactivate ${target.name}?` : ''}
        message="They can log in and use IndustriaLink again."
        actions={
          <>
            <Button label="Cancel" variant="secondary" size="sm" onPress={() => setTarget(null)} />
            <Button label="Reactivate" size="sm" loading={toggle.isPending} onPress={() => target && toggle.mutate(target)} />
          </>
        }
      />

      <Sheet
        visible={!!target && blocking}
        onClose={() => setTarget(null)}
        title={target ? `Block ${target.name}?` : ''}
        subtitle={
          target?.role === 'employer'
            ? impact.data
              ? `${impact.data.activeJobs} live job${impact.data.activeJobs === 1 ? '' : 's'} with ${impact.data.applicants} applicant${impact.data.applicants === 1 ? '' : 's'} will be hidden, and they are logged out.`
              : 'Their jobs will be hidden and they are logged out.'
            : 'They are logged out and cannot apply to jobs.'
        }
        footer={
          <View style={styles.sheetFoot}>
            <Button label="Cancel" variant="ghost" onPress={() => setTarget(null)} />
            <Button
              label="Block"
              variant="danger"
              loading={toggle.isPending}
              disabled={reason === 'Other' && !detail.trim()}
              onPress={() => target && toggle.mutate(target)}
              style={styles.flex}
            />
          </View>
        }
      >
        <ReasonPicker reasons={SUSPEND_REASONS} value={reason} onChange={setReason} />
        <Text style={[styles.detailLabel, { color: colors.inkSecondary }]}>
          {reason === 'Other' ? 'Details (required)' : 'Details (optional)'}
        </Text>
        <TextInput
          value={detail}
          onChangeText={setDetail}
          multiline
          placeholder="What happened?"
          placeholderTextColor={colors.placeholder}
          style={[styles.detailInput, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
        />
        <Text style={[styles.detailLabel, { color: colors.inkMuted, marginTop: 8 }]}>
          Saved in the activity log. Only admins can see it.
        </Text>
      </Sheet>
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
  sheetFoot: { flexDirection: 'row', gap: 12 },
  detailLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  detailInput: { minHeight: 72, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, textAlignVertical: 'top' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 14, lineHeight: 18 },
  search: { height: 46, borderRadius: 23, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  chips: { paddingVertical: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, gap: 12, ...shadows.card },
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
});
