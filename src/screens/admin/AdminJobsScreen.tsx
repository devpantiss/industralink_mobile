import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Briefcase, Search, X } from 'lucide-react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { FilterChips } from '../../components/ui/FilterChips';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatDate, formatPay } from '../../lib/format';
import type { AdminJobRow } from '../../types';

const REASONS = ['Asks workers for money', 'Fake or misleading job', 'Pay not shown / unrealistic', 'Duplicate post', 'Other'];
type StatusKey = 'active' | 'closed' | 'all';

/** Every published job; remove anything fake, unsafe or asking workers for money (web: AdminJobs). */
export const AdminJobsScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusKey>('active');
  const [target, setTarget] = useState<AdminJobRow | null>(null);
  const [reason, setReason] = useState(REASONS[0]!);
  const [note, setNote] = useState('');

  const params = { q: q.trim() || undefined, status: status === 'all' ? undefined : status };
  const list = useQuery({ queryKey: queryKeys.admin.jobs(params), queryFn: () => adminApi.getJobs(params) });

  const remove = useMutation({
    mutationFn: () =>
      adminApi.removeJob(
        target!.id,
        reason === 'Other' ? note.trim() : `${reason}${note.trim() ? ` – ${note.trim()}` : ''}`
      ),
    onSuccess: () => {
      showToast('Job removed. The company was told why.', 'success');
      setTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
    onError: () => showToast('Could not remove the job. Please try again.', 'error'),
  });

  const openRemove = (j: AdminJobRow) => {
    setReason(REASONS[0]!);
    setNote('');
    setTarget(j);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.title, { color: colors.ink }]}>Jobs</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          All published jobs. Remove anything fake, unsafe or asking workers for money.
        </Text>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Job title, company, city"
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

        <FilterChips<StatusKey>
          style={styles.chips}
          value={status}
          onChange={setStatus}
          options={[
            { key: 'active', label: 'Active' },
            { key: 'closed', label: 'Closed' },
            { key: 'all', label: 'All' },
          ]}
        />

        {list.isLoading ? (
          <ListSkeleton />
        ) : !list.data?.length ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <Briefcase size={30} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>No jobs found</Text>
          </View>
        ) : (
          list.data.map((j) => {
            const noPay = !j.payMin && !j.payMax;
            return (
              <Animated.View
                key={j.id}
                entering={FadeIn.duration(180)}
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.rowTop}>
                  <CompanyLogo job={j} size="sm" />
                  <View style={styles.flex}>
                    <Text style={[styles.jobTitle, { color: colors.ink }]} numberOfLines={1}>
                      {j.title}
                    </Text>
                    <Text style={[styles.meta, { color: colors.inkMuted }]} numberOfLines={1}>
                      {j.companyName} · {j.location.city} · posted {formatDate(j.postedAt)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.rowFoot, { borderTopColor: colors.border }]}>
                  <View style={styles.badges}>
                    {j.removedByAdmin ? (
                      <Pill text="Removed" bg={colors.dangerBg} fg={colors.dangerFg} />
                    ) : (
                      <Pill
                        text={j.status === 'active' ? 'Active' : j.status === 'draft' ? 'Draft' : 'Closed'}
                        bg={j.status === 'active' ? colors.successBg : colors.neutralBg}
                        fg={j.status === 'active' ? colors.successFg : colors.neutralFg}
                      />
                    )}
                    {!j.companyVerified && <Pill text="Company not approved" bg={colors.warningBg} fg={colors.warningFg} />}
                    <Text
                      style={[styles.pay, { color: noPay ? colors.warningFg : colors.inkSecondary }]}
                      numberOfLines={1}
                    >
                      {formatPay(j.payMin, j.payMax, j.payPeriod)}
                    </Text>
                  </View>
                  {j.status === 'active' && (
                    <Pressable
                      onPress={() => openRemove(j)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${j.title}`}
                      style={({ pressed }) => [
                        styles.removeBtn,
                        { borderColor: colors.dangerFg, backgroundColor: pressed ? colors.dangerBg : 'transparent' },
                      ]}
                    >
                      <Text style={[styles.removeText, { color: colors.dangerFg }]}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Sheet
        visible={!!target}
        onClose={() => setTarget(null)}
        title={target ? `Remove "${target.title}"?` : ''}
        subtitle={target ? `The job closes straight away and ${target.companyName} is told the reason.` : undefined}
        footer={
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={() => setTarget(null)} style={styles.flex} />
            <Button
              label="Remove job"
              variant="danger"
              loading={remove.isPending}
              disabled={reason === 'Other' && !note.trim()}
              onPress={() => remove.mutate()}
              style={styles.flex}
            />
          </View>
        }
      >
        <ReasonPicker reasons={REASONS} value={reason} onChange={setReason} />
        <Text style={[styles.label, { color: colors.inkSecondary }]}>
          {reason === 'Other' ? 'Details (required)' : 'Details (optional)'}
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="What did you find?"
          placeholderTextColor={colors.inkMuted}
          style={[styles.textarea, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
        />
      </Sheet>
    </Screen>
  );
};

/** Radio list of reasons, shared by the job and report removal sheets. */
export const ReasonPicker: React.FC<{ reasons: string[]; value: string; onChange: (r: string) => void }> = ({
  reasons,
  value,
  onChange,
}) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.reasons} accessibilityRole="radiogroup">
      {reasons.map((r) => {
        const on = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[
              styles.reason,
              { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.surface },
            ]}
          >
            <View style={[styles.radio, { borderColor: on ? colors.primary : colors.borderStrong }]}>
              {on && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[styles.reasonText, { color: colors.ink }]}>{r}</Text>
          </Pressable>
        );
      })}
    </View>
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
  search: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chips: { paddingVertical: 12 },
  row: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jobTitle: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12.5, marginTop: 2 },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 10 },
  badges: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },
  pay: { fontSize: 12.5, flexShrink: 1 },
  removeBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, justifyContent: 'center' },
  removeText: { fontSize: 13, fontWeight: '700' },
  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  reasons: { gap: 8, marginBottom: 16 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontSize: 14, fontWeight: '600', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  textarea: { minHeight: 88, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top' },
});
