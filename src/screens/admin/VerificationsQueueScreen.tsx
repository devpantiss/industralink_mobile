import { errorText } from '../../lib/errors';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BadgeCheck, ChevronRight, ExternalLink, FileText, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../../components/ui/Text';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { PressableScale } from '../../components/ui/PressableScale';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { COMPANY_DOC_LABEL } from '../../lib/labels';
import { formatDate, timeAgo } from '../../lib/format';
import type { VerificationItem, VerificationStatus } from '../../types';
import { shadows } from '../../theme/shadows';

const QUICK_REASONS = [
  'GST certificate is for a different company name',
  'Document is unclear or cut off',
  'GST number not found on the GST portal',
  'No document uploaded',
];

/** Company approvals (web: Verifications). New companies can't publish jobs until approved. */
export const VerificationsQueueScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const [tab, setTab] = useState<VerificationStatus>('pending');
  const [selected, setSelected] = useState<VerificationItem | null>(null);
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [reason, setReason] = useState('');

  const q = useQuery({ queryKey: queryKeys.admin.verifications, queryFn: () => adminApi.getVerifications() });
  const all = useMemo(() => q.data ?? [], [q.data]);
  const counts = useMemo(
    () => ({
      pending: all.filter((v) => v.status === 'pending').length,
      approved: all.filter((v) => v.status === 'approved').length,
      rejected: all.filter((v) => v.status === 'rejected').length,
    }),
    [all]
  );
  // Waiting: oldest first, so no one waits too long. Others: newest first.
  const shown = all
    .filter((v) => v.status === tab)
    .sort((a, b) => (tab === 'pending' ? 1 : -1) * (+new Date(a.submittedAt) - +new Date(b.submittedAt)));

  const decide = useMutation({
    mutationFn: ({ item, decision, why }: { item: VerificationItem; decision: 'approve' | 'reject'; why?: string }) =>
      adminApi.decideVerification(item.kind, item.id, decision, why),
    onSuccess: (_d, { item, decision }) => {
      Haptics.notificationAsync(
        decision === 'approve' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      showToast(
        decision === 'approve' ? `${item.title} approved. They can now post jobs.` : `${item.title} rejected. They were told why.`,
        'success'
      );
      setSelected(null);
    },
    onError: (e) => showToast(errorText(e, 'Something went wrong. Please try again.'), 'error'),
  });

  const open = (v: VerificationItem) => {
    setMode('review');
    setReason('');
    setSelected(v);
  };

  const s = selected;
  const rejectionReason = s?.details['Rejection reason'];
  const details = s ? Object.entries(s.details).filter(([k]) => k !== 'Rejection reason') : [];

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.title, { color: colors.ink }]}>Company approvals</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          New companies can’t publish jobs until you approve them. Oldest first.
        </Text>

        <SegmentedTabs<VerificationStatus>
          variant="underline"
          style={styles.tabs}
          value={tab}
          onChange={setTab}
          items={[
            { key: 'pending', label: 'Waiting', count: counts.pending },
            { key: 'approved', label: 'Approved', count: counts.approved },
            { key: 'rejected', label: 'Rejected', count: counts.rejected },
          ]}
        />

        {q.isLoading ? (
          <ListSkeleton />
        ) : shown.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <BadgeCheck size={32} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {tab === 'pending' ? 'All caught up' : 'Nothing here yet'}
            </Text>
            {tab === 'pending' && (
              <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>No companies are waiting for approval.</Text>
            )}
          </View>
        ) : (
          shown.map((v) => (
            <Animated.View key={v.id} entering={FadeIn.duration(180)}>
              <PressableScale
                onPress={() => open(v)}
                accessibilityLabel={`Review ${v.title}`}
                style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Avatar name={v.title} square size="md" />
                <View style={styles.flex}>
                  <Text style={[styles.itemTitle, { color: colors.ink }]} numberOfLines={1}>
                    {v.title}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.inkSecondary }]} numberOfLines={1}>
                    {v.subtitle}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemTime, { color: colors.inkMuted }]}>Signed up {timeAgo(v.submittedAt)}</Text>
                    {v.status === 'pending' && v.documents.length === 0 && (
                      <View style={[styles.pill, { backgroundColor: colors.warningBg }]}>
                        <Text style={[styles.pillText, { color: colors.warningFg }]}>No document</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </PressableScale>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Sheet
        visible={!!s}
        onClose={() => setSelected(null)}
        title={mode === 'reject' && s ? `Reject ${s.title}?` : s?.title}
        subtitle={
          mode === 'reject'
            ? 'The company sees this reason so they can fix it and send again.'
            : s
              ? `${s.subtitle} · ${formatDate(s.submittedAt)}`
              : undefined
        }
        footer={
          s?.status !== 'pending' ? undefined : mode === 'review' ? (
            <View style={styles.actions}>
              <Button label="Reject" variant="outline" onPress={() => setMode('reject')} style={styles.flex} textStyle={{ color: colors.dangerFg }} />
              <Button
                label="Approve company"
                loading={decide.isPending}
                onPress={() => s && decide.mutate({ item: s, decision: 'approve' })}
                style={styles.flex2}
              />
            </View>
          ) : (
            <View style={styles.actions}>
              <Button label="Back" variant="secondary" onPress={() => setMode('review')} style={styles.flex} />
              <Button
                label="Reject company"
                variant="danger"
                disabled={!reason.trim()}
                loading={decide.isPending}
                onPress={() => s && decide.mutate({ item: s, decision: 'reject', why: reason.trim() })}
                style={styles.flex2}
              />
            </View>
          )
        }
      >
        {s && mode === 'review' && (
          <View style={styles.sheetBody}>
            {s.status === 'rejected' && rejectionReason ? (
              <View style={[styles.notice, { backgroundColor: colors.dangerBg }]}>
                <AlertTriangle size={16} color={colors.dangerFg} />
                <Text style={[styles.noticeText, { color: colors.dangerFg }]}>Rejected: {rejectionReason}</Text>
              </View>
            ) : s.status === 'approved' ? (
              <View style={[styles.notice, { backgroundColor: colors.successBg }]}>
                <BadgeCheck size={16} color={colors.successFg} />
                <Text style={[styles.noticeText, { color: colors.successFg }]}>Approved. This company can post jobs.</Text>
              </View>
            ) : null}

            <View style={[styles.details, { borderColor: colors.border }]}>
              {details.map(([k, v], i) => (
                <View key={k} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.detailKey, { color: colors.inkMuted }]}>{k}</Text>
                  <Text style={[styles.detailVal, { color: colors.ink }]} selectable>
                    {v}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[styles.heading, { color: colors.ink }]}>Documents</Text>
            {s.documents.length === 0 ? (
              <View style={[styles.notice, { backgroundColor: colors.warningBg }]}>
                <AlertTriangle size={16} color={colors.warningFg} />
                <Text style={[styles.noticeText, { color: colors.warningFg }]}>
                  No document uploaded yet. Ask for a GST certificate before approving.
                </Text>
              </View>
            ) : (
              s.documents.map((d) => (
                <Pressable
                  key={d.id}
                  disabled={!d.url}
                  onPress={() => d.url && Linking.openURL(d.url).catch(() => {})}
                  style={[styles.doc, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                >
                  <FileText size={20} color={colors.primary} />
                  <View style={styles.flex}>
                    <Text style={[styles.docName, { color: colors.ink }]} numberOfLines={1}>
                      {d.name}
                    </Text>
                    <Text style={[styles.docType, { color: colors.inkMuted }]}>
                      {COMPANY_DOC_LABEL[d.type as keyof typeof COMPANY_DOC_LABEL] || d.type}
                    </Text>
                  </View>
                  {d.url ? <ExternalLink size={16} color={colors.inkMuted} /> : null}
                </Pressable>
              ))
            )}

            {s.details['GST number'] ? (
              <Pressable
                onPress={() => Linking.openURL('https://services.gst.gov.in/services/searchtp').catch(() => {})}
                style={[styles.gst, { backgroundColor: colors.primarySoft }]}
              >
                <ExternalLink size={16} color={colors.primary} />
                <Text style={[styles.gstText, { color: colors.primary }]}>Check this GST number on the GST portal</Text>
              </Pressable>
            ) : null}

            {s.status === 'pending' && (
              <View style={[styles.checklist, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.checkTitle, { color: colors.ink }]}>Before approving, check:</Text>
                {[
                  'The document shows the same company name and GST number',
                  'The GST number belongs to this company on the portal',
                  'Call the HR number to confirm they hire for this company',
                ].map((c) => (
                  <Text key={c} style={[styles.checkItem, { color: colors.inkSecondary }]}>
                    •  {c}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {s && mode === 'reject' && (
          <View style={styles.sheetBody}>
            <Text style={[styles.label, { color: colors.inkSecondary }]}>Common reasons</Text>
            <View style={styles.quick}>
              {QUICK_REASONS.map((r) => {
                const on = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    style={[
                      styles.quickChip,
                      { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.surface },
                    ]}
                  >
                    <Text style={[styles.quickText, { color: on ? colors.primary : colors.ink }]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.label, { color: colors.inkSecondary }]}>Reason (required)</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="What should they fix?"
              placeholderTextColor={colors.inkMuted}
              style={[styles.textarea, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
            />
          </View>
        )}
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 1.6 },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  tabs: { marginTop: 10, marginBottom: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, ...shadows.card },
  itemTitle: { fontSize: 15, fontWeight: '700' },
  itemSub: { fontSize: 13, marginTop: 1 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemTime: { fontSize: 12 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },
  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  sheetBody: { gap: 12 },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, padding: 12 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  details: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  detailRow: { paddingVertical: 10, gap: 2 },
  detailKey: { fontSize: 12 },
  detailVal: { fontSize: 14, fontWeight: '600' },
  heading: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  docName: { fontSize: 14, fontWeight: '600' },
  docType: { fontSize: 12, marginTop: 1 },
  gst: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, minHeight: 48 },
  gstText: { flex: 1, fontSize: 13.5, fontWeight: '700' },
  checklist: { borderRadius: 12, padding: 12, gap: 4 },
  checkTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 2 },
  checkItem: { fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  quickText: { fontSize: 13, fontWeight: '600' },
  textarea: { minHeight: 88, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top' },
});
