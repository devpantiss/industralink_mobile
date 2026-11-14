import { errorText } from '../../lib/errors';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Flag, LifeBuoy, Phone } from '../../components/ui/icons';
import { Text, TextInput } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { FilterChips } from '../../components/ui/FilterChips';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatPhone, timeAgo } from '../../lib/format';
import { openContact } from '../../lib/contact';
import type { AdminReportRow, ReportReason } from '../../types';
import { shadows } from '../../theme/shadows';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  asks_money: 'Asked for money',
  fake: 'Looks fake',
  wrong_details: 'Wrong pay / details',
  unsafe: 'Unsafe work',
  other: 'Other',
};

type Tab = 'jobs' | 'help';

/** Job reports from workers, and help requests from anyone (web: Reports). */
export const ReportsScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const [tab, setTab] = useState<Tab>('jobs');
  const [status, setStatus] = useState('open');
  const reportsOpen = useQuery({ queryKey: queryKeys.admin.reports('open'), queryFn: () => adminApi.getReports('open') });
  const ticketsOpen = useQuery({ queryKey: queryKeys.admin.tickets('open'), queryFn: () => adminApi.getTickets('open') });

  const options =
    tab === 'jobs'
      ? [
          { key: 'open', label: 'Open' },
          { key: 'dismissed', label: 'Dismissed' },
          { key: 'job_removed', label: 'Job removed' },
          { key: 'all', label: 'All' },
        ]
      : [
          { key: 'open', label: 'Open' },
          { key: 'closed', label: 'Done' },
          { key: 'all', label: 'All' },
        ];

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader />
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.ink }]}>Reports & help</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          Act on reported jobs first: a job asking for money can hurt workers today.
        </Text>
        <SegmentedTabs<Tab>
          variant="underline"
          value={tab}
          onChange={(t) => {
            setTab(t);
            setStatus('open');
          }}
          items={[
            { key: 'jobs', label: 'Reported jobs', count: reportsOpen.data?.length },
            { key: 'help', label: 'Help requests', count: ticketsOpen.data?.length },
          ]}
        />
        <FilterChips style={styles.chips} options={options} value={status} onChange={setStatus} />
      </View>
      {tab === 'jobs' ? <JobReports key={`j-${status}`} status={status} /> : <HelpRequests key={`h-${status}`} status={status} />}
    </Screen>
  );
};

function JobReports({ status }: { status: string }) {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: queryKeys.admin.reports(status), queryFn: () => adminApi.getReports(status) });
  const [target, setTarget] = useState<AdminReportRow | null>(null);
  const [note, setNote] = useState('');

  const resolve = useMutation({
    mutationFn: ({ r, action }: { r: AdminReportRow; action: 'dismiss' | 'remove_job' }) =>
      adminApi.resolveReport(r.id, action, action === 'remove_job' ? note.trim() || REPORT_REASON_LABEL[r.reason] : undefined),
    onSuccess: (_d, { action }) => {
      showToast(action === 'remove_job' ? 'Job removed. The company was told why.' : 'Report dismissed', 'success');
      setTarget(null);
      setNote('');
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
    onError: (e) => showToast(errorText(e, 'Something went wrong. Please try again.'), 'error'),
  });

  return (
    <>
      <KeyboardScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.primary} />
        }
      >
        {list.isLoading ? (
          <ListSkeleton />
        ) : !list.data?.length ? (
          <Empty
            icon={<Flag size={30} color={colors.inkMuted} />}
            title={status === 'open' ? 'No open reports' : 'Nothing here'}
            text="Workers report jobs from the job page."
          />
        ) : (
          groupOpen(list.data, status === 'open').map(({ r, all }) => {
            const serious = r.reason === 'asks_money' || r.reason === 'unsafe';
            return (
              <Animated.View
                key={r.id}
                entering={FadeIn.duration(180)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.badges}>
                  <Pill
                    text={REPORT_REASON_LABEL[r.reason]}
                    bg={serious ? colors.dangerBg : colors.warningBg}
                    fg={serious ? colors.dangerFg : colors.warningFg}
                  />
                  {all.slice(1).filter((x, i, a) => a.findIndex((y) => y.reason === x.reason) === i && x.reason !== r.reason).map((x) => (
                    <Pill key={x.id} text={REPORT_REASON_LABEL[x.reason]} bg={colors.warningBg} fg={colors.warningFg} />
                  ))}
                  {all.length > 1 && (
                    <Pill text={`${all.length} workers reported this job`} bg={colors.dangerBg} fg={colors.dangerFg} />
                  )}
                </View>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>
                  {r.jobTitle}
                  <Text style={[styles.cardTitleSub, { color: colors.inkSecondary }]}> · {r.companyName}</Text>
                </Text>
                <Text style={[styles.meta, { color: colors.inkMuted }]}>
                  {timeAgo(r.at)} · by {r.reporterName}
                </Text>
                {all.filter((x) => x.details).slice(0, 3).map((x) => (
                  <Text key={x.id} style={[styles.quote, { backgroundColor: colors.surfaceMuted, color: colors.inkSecondary }]}>
                    “{x.details}”
                  </Text>
                ))}
                {r.status !== 'open' ? (
                  <Text style={[styles.meta, { color: colors.inkMuted }]}>
                    {r.status === 'dismissed' ? 'Dismissed' : 'Job removed'} by {r.resolvedBy}
                    {r.resolvedAt ? ` · ${timeAgo(r.resolvedAt)}` : ''}
                  </Text>
                ) : (
                  <View style={[styles.actions, styles.cardActions, { borderTopColor: colors.border }]}>
                    <Button
                      label="Dismiss"
                      variant="secondary"
                      size="sm"
                      disabled={resolve.isPending}
                      onPress={() => resolve.mutate({ r, action: 'dismiss' })}
                      style={styles.flex}
                    />
                    {r.jobStatus === 'active' ? (
                      <Button
                        label="Remove job"
                        variant="danger"
                        size="sm"
                        onPress={() => {
                          setNote('');
                          setTarget(r);
                        }}
                        style={styles.flex}
                      />
                    ) : (
                      <Text style={[styles.meta, styles.flex, { color: colors.inkMuted, textAlign: 'center' }]}>
                        Job already closed
                      </Text>
                    )}
                  </View>
                )}
              </Animated.View>
            );
          })
        )}
      </KeyboardScrollView>

      <Sheet
        visible={!!target}
        onClose={() => setTarget(null)}
        title={target ? `Remove "${target.jobTitle}"?` : ''}
        subtitle={
          target
            ? `The job closes straight away, all open reports on it are marked done, and ${target.companyName} is told the reason.`
            : undefined
        }
        footer={
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={() => setTarget(null)} style={styles.flex} />
            <Button
              label="Remove job"
              variant="danger"
              loading={resolve.isPending}
              onPress={() => target && resolve.mutate({ r: target, action: 'remove_job' })}
              style={styles.flex}
            />
          </View>
        }
      >
        <Text style={[styles.label, { color: colors.inkSecondary }]}>Reason shown to the company (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder={target ? REPORT_REASON_LABEL[target.reason] : ''}
          placeholderTextColor={colors.placeholder}
          style={[styles.textarea, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
        />
      </Sheet>
    </>
  );
}

function HelpRequests({ status }: { status: string }) {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: queryKeys.admin.tickets(status), queryFn: () => adminApi.getTickets(status) });
  const close = useMutation({
    mutationFn: (id: string) => adminApi.closeTicket(id),
    onSuccess: () => {
      showToast('Marked as done. The person was told.', 'success');
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (e) => showToast(errorText(e, 'Something went wrong. Please try again.'), 'error'),
  });

  return (
    <KeyboardScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.primary} />
      }
    >
      {list.isLoading ? (
        <ListSkeleton />
      ) : !list.data?.length ? (
        <Empty
          icon={<LifeBuoy size={30} color={colors.inkMuted} />}
          title="No help requests"
          text="People send these from the Help page."
        />
      ) : (
        list.data.map((t) => {
          const money = t.topic.toLowerCase().includes('money');
          return (
            <Animated.View
              key={t.id}
              entering={FadeIn.duration(180)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.badges}>
                <Pill
                  text={t.topic}
                  bg={money ? colors.dangerBg : colors.neutralBg}
                  fg={money ? colors.dangerFg : colors.neutralFg}
                />
                <Text style={[styles.meta, { color: colors.inkMuted }]}>
                  {timeAgo(t.at)} · {t.role === 'guest' ? 'Not logged in' : t.role === 'employer' ? 'Employer' : 'Worker'}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>{t.name}</Text>
              <Text style={[styles.body, { color: colors.inkSecondary }]}>{t.message}</Text>
              <View style={[styles.actions, styles.cardActions, { borderTopColor: colors.border }]}>
                <Pressable
                  onPress={() => openContact('call', t.contact)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${t.name}`}
                  style={[styles.call, styles.flex, { borderColor: colors.border }]}
                >
                  <Phone size={15} color={colors.primary} />
                  <Text style={[styles.callText, { color: colors.primary }]}>{formatPhone(t.contact)}</Text>
                </Pressable>
                {t.status === 'open' ? (
                  <Button
                    label="Mark done"
                    size="sm"
                    loading={close.isPending && close.variables === t.id}
                    onPress={() => close.mutate(t.id)}
                    style={styles.flex}
                  />
                ) : (
                  <View style={[styles.flex, styles.doneWrap]}>
                    <Pill text="Done" bg={colors.successBg} fg={colors.successFg} />
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })
      )}
    </KeyboardScrollView>
  );
}

const Empty: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
      {icon}
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>{text}</Text>
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
  top: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 10, lineHeight: 18 },
  chips: { paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 48, gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 6, ...shadows.card },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', marginTop: 4, lineHeight: 20 },
  cardTitleSub: { fontWeight: '400' },
  meta: { fontSize: 12 },
  quote: { fontSize: 13.5, lineHeight: 19, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4, overflow: 'hidden' },
  body: { fontSize: 13.5, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cardActions: { borderTopWidth: 1, paddingTop: 12, marginTop: 6 },
  call: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 19, borderWidth: 1 },
  callText: { fontSize: 13, fontWeight: '700' },
  doneWrap: { alignItems: 'center' },
  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  textarea: { minHeight: 88, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top' },
});

/** Open reports are shown once per job, newest first, with every report on that job attached. */
function groupOpen<T extends { jobId: string }>(rows: T[], group: boolean): { r: T; all: T[] }[] {
  if (!group) return rows.map((r) => ({ r, all: [r] }));
  const seen = new Map<string, T[]>();
  for (const r of rows) seen.set(r.jobId, [...(seen.get(r.jobId) ?? []), r]);
  return [...seen.values()].map((all) => ({ r: all[0]!, all }));
}
