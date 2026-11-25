import { errorText } from '../../lib/errors';
import { ProgressBar } from '../../components/ui/Progress';
import { gradients } from '../../theme/effects';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { ArrowLeft, Search, Share2, Users, X, CheckCircle2 } from '../../components/ui/icons';
import { Text, TextInput } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { CandidateRow, stageTone } from '../../components/domain/CandidateRow';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatPay } from '../../lib/format';
import { STAGE_LABEL } from '../../lib/labels';
import type { EmployerStackParamList } from '../../navigation/types';
import type { ApplicationStage, Candidate } from '../../types';
import { shadows } from '../../theme/shadows';
import { PullToRefresh } from '../../components/ui/PullToRefresh';

type Tab = 'all' | ApplicationStage;
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'New' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
];
/** Same grouping as the web: "All" hides rejected; "New" includes withdrawn. */
const inTab = (c: Candidate, t: Tab) =>
  t === 'all' ? c.stage !== 'rejected' : t === 'applied' ? c.stage === 'applied' || c.stage === 'withdrawn' : c.stage === t;

const STATUS_LABEL = { active: 'Active', draft: 'Draft', closed: 'Closed' } as const;

/**
 * One job's applicants, grouped by hiring step (web: JobPipeline). On a phone the board
 * becomes a step strip: tap a step to see who is in it, tap a person to open their profile.
 */
export const JobApplicantsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const { jobId } = useRoute<RouteProp<EmployerStackParamList, 'JobApplicants'>>().params;
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const showToast = useUiStore((s) => s.showToast);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');

  const job = useQuery({ queryKey: queryKeys.employer.job(jobId), queryFn: () => employerApi.getJob(jobId) });
  const cands = useQuery({
    queryKey: queryKeys.employer.candidates(jobId),
    queryFn: () => employerApi.getCandidates(jobId),
  });

  const shortlist = useMutation({
    mutationFn: (c: Candidate) => employerApi.updateStage(c.id, 'shortlisted'),
    onSuccess: (_d, c) => {
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      showToast(
        `${c.worker.name} shortlisted.${job.data?.allowCalls ? ' They can now see your HR number.' : ''}`,
        'success'
      );
    },
    onError: (e) => showToast(errorText(e, 'Could not shortlist. Please try again.'), 'error'),
  });

  const list = useMemo(() => cands.data ?? [], [cands.data]);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.key, list.filter((c) => inTab(c, t.key)).length])) as Record<Tab, number>,
    [list]
  );
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list
      .filter((c) => inTab(c, tab))
      .filter(
        (c) =>
          !s ||
          `${c.worker.name} ${c.worker.location?.city ?? ''} ${c.worker.skills.join(' ')} ${c.worker.licences.join(' ')} ${c.worker.qualifications.join(' ')}`
            .toLowerCase()
            .includes(s)
      );
  }, [list, tab, q]);

  const j = job.data;
  const hired = list.filter((c) => c.stage === 'hired').length;
  const filled = j ? Math.min(1, hired / Math.max(1, j.openings)) : 0;

  const shareJob = () => {
    if (!j) return;
    Share.share({
      message: `${j.title} at ${j.companyName}, ${j.location.city}. ${formatPay(j.payMin, j.payMax, j.payPeriod)}. Apply on IndustriaLink: https://industrialink.in/jobs/${j.id}`,
    }).catch(() => {});
  };

  const openProfile = (c: Candidate) => navigation.navigate('CandidateDossier', { candidateId: c.id });

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.bar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          style={[styles.round, { backgroundColor: colors.surfaceMuted }]}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <Text style={[styles.barTitle, { color: colors.ink }]} numberOfLines={1}>
          Applicants
        </Text>
        <Pressable
          onPress={shareJob}
          accessibilityLabel="Share job link"
          style={[styles.round, { backgroundColor: colors.surfaceMuted }]}
        >
          <Share2 size={18} color={colors.ink} />
        </Pressable>
      </View>

      <KeyboardScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          <PullToRefresh onRefresh={() => Promise.all([job.refetch(), cands.refetch()])} />
        }
      >
        {/* Job summary */}
        <View>
          {job.isLoading ? (
            <ListSkeleton count={1} />
          ) : j ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.jobHead}>
                <Text style={[styles.jobTitle, { color: colors.ink }]}>{j.title}</Text>
                <View
                  style={[
                    styles.status,
                    { backgroundColor: j.status === 'active' ? colors.successBg : colors.neutralBg },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: j.status === 'active' ? colors.successFg : colors.neutralFg }]}
                  >
                    {STATUS_LABEL[j.status]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.jobMeta, { color: colors.inkSecondary }]}>
                {[j.siteName, j.location.city].filter(Boolean).join(', ')} · {formatPay(j.payMin, j.payMax, j.payPeriod)}
              </Text>

              <View style={styles.fillRow}>
                <Text style={[styles.fillText, { color: colors.ink }]}>
                  <Text style={styles.fillNum}>{hired}</Text> of {j.openings} hired
                </Text>
                <Text style={[styles.fillText, { color: colors.inkMuted }]}>{list.length} applied</Text>
              </View>
              <ProgressBar value={filled * 100} gradient={gradients[theme].success} style={styles.track} />

              {j.status === 'active' && hired >= j.openings && (
                <View style={[styles.note, { backgroundColor: colors.successBg }]}>
                  <CheckCircle2 size={16} color={colors.successFg} />
                  <Text style={[styles.noteText, { color: colors.successFg }]}>
                    All {j.openings} positions are filled. You can close this job from My Jobs.
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <Text style={[styles.jobMeta, { color: colors.inkSecondary }]}>This job could not be found.</Text>
          )}
        </View>

        {/* Steps + search (sticks under the bar while scrolling) */}
        <View style={[styles.sticky, { backgroundColor: colors.canvas }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.steps}>
            {TABS.map((t) => {
              const active = t.key === tab;
              const dot = t.key === 'all' ? colors.ink : stageTone(t.key, colors).dot;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.step,
                    active
                      ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {t.key !== 'all' && <View style={[styles.dot, { backgroundColor: dot }]} />}
                  <Text style={[styles.stepText, { color: active ? colors.primary : colors.inkSecondary, fontWeight: active ? '700' : '500' }]}>{t.label}</Text>
                  <Text style={[styles.stepCount, { color: active ? colors.primary : colors.inkMuted }]}>
                    {counts[t.key]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={18} color={colors.inkMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search name, city, licence"
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { color: colors.ink }]}
              returnKeyType="search"
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear search">
                <X size={18} color={colors.inkMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* People */}
        <View style={styles.list}>
          {cands.isLoading ? (
            <ListSkeleton count={3} />
          ) : list.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
              <Users size={32} color={colors.inkMuted} />
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>No applicants yet</Text>
              <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>
                Share the job on WhatsApp groups to get applicants faster.
              </Text>
              <Button label="Share job link" variant="secondary" size="sm" onPress={shareJob} style={styles.emptyBtn} />
            </View>
          ) : shown.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>
                {q ? 'No one matches your search' : `No one in ${tab === 'all' ? 'this list' : STAGE_LABEL[tab as ApplicationStage]}`}
              </Text>
              <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>
                {q ? 'Try a name, city or licence.' : 'People move here as you take them through hiring.'}
              </Text>
            </View>
          ) : (
            shown.map((c) => (
              <Animated.View key={c.id} entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} layout={LinearTransition.duration(220)}>
                <CandidateRow
                  candidate={c}
                  showJob={false}
                  onPress={() => openProfile(c)}
                  action={
                    c.stage === 'applied'
                      ? {
                          label: 'Shortlist',
                          onPress: () => shortlist.mutate(c),
                          disabled: shortlist.isPending && shortlist.variables?.id === c.id,
                        }
                      : undefined
                  }
                />
              </Animated.View>
            ))
          )}
        </View>
      </KeyboardScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  content: { paddingBottom: 48 },
  jobCard: { margin: 16, marginBottom: 4, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6, ...shadows.card },
  jobHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  jobTitle: { flex: 1, fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
  status: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, marginTop: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  jobMeta: { fontSize: 13, lineHeight: 18 },
  fillRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  fillText: { fontSize: 13 },
  fillNum: { fontWeight: '700' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, padding: 10, marginTop: 8 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  sticky: { paddingTop: 12, paddingBottom: 10, gap: 10 },
  steps: { paddingHorizontal: 16, gap: 8 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { fontSize: 13, fontWeight: '600' },
  stepCount: { fontSize: 12, fontWeight: '700' },
  search: {
    marginHorizontal: 16,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 16, gap: 10 },
  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyBtn: { marginTop: 8 },
});
