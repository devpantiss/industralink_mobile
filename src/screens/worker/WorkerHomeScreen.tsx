import React, { useMemo, useState } from 'react';
import { Toggle } from '../../components/ui/Toggle';
import { useTabBarSpace } from '../../components/layout/TabBar';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useTileStyle, TileIcon } from '../../components/ui/tileStyle';
import { ProgressBar } from '../../components/ui/Progress';
import { Stagger } from '../../components/ui/Stagger';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Search,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
  Briefcase,
  ChevronRight,
  X,
  Send,
  Bookmark,
} from '../../components/ui/icons';
import * as Haptics from 'expo-haptics';
import type { WorkerStackParamList, WorkerTabParamList } from '../../navigation/types';
import { ListSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { JobCard } from '../../components/domain/JobCard';
import { Hero } from '../../components/ui/Hero';
import { PressableScale } from '../../components/ui/PressableScale';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { TRADE_LABEL } from '../../lib/labels';
import { formatDateTime } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { JobForWorker } from '../../types';
import type { TileColors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { PullToRefresh } from '../../components/ui/PullToRefresh';

type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

/**
 * Worker home, phone layout. Order follows what a worker needs first:
 * search, the next interview, quick counts, profile progress, then matching jobs.
 */
export const WorkerHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useUiStore((s) => s.colors);
  const tabSpace = useTabBarSpace();
  const dark = useUiStore((s) => s.theme) === 'dark';
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [waAlerts, setWaAlerts] = useState(true);

  const goTab = (screen: keyof WorkerTabParamList) => navigation.navigate('WorkerTabs', { screen });

  const summaryQuery = useQuery({ queryKey: queryKeys.worker.summary, queryFn: () => workerApi.getSummary() });
  const profileQuery = useQuery({ queryKey: queryKeys.worker.profile, queryFn: () => workerApi.getProfile() });
  const trade = profileQuery.data?.trade;
  const forYouQuery = useQuery({
    queryKey: queryKeys.worker.jobs({ forYou: trade }),
    queryFn: () => workerApi.searchJobs({ trade, sort: 'nearest' }),
    enabled: profileQuery.isSuccess,
  });
  const latestQuery = useQuery({
    queryKey: queryKeys.worker.jobs({ latest: true }),
    queryFn: () => workerApi.searchJobs({ sort: 'newest' }),
  });

  const saveMutation = useMutation({
    mutationFn: (job: JobForWorker) => workerApi.toggleSaveJob(job.id, !job.saved),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.worker.all }),
  });

  // Jobs for your trade first, then other new jobs, without repeats.
  const allJobs = useMemo(() => {
    const seen = new Set<string>();
    return [...(forYouQuery.data?.items ?? []), ...(latestQuery.data?.items ?? [])].filter(
      (j) => !seen.has(j.id) && !!seen.add(j.id)
    );
  }, [forYouQuery.data, latestQuery.data]);

  const jobs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allJobs;
    return allJobs.filter((j) =>
      `${j.title} ${j.companyName} ${j.location.city} ${j.location.state}`.toLowerCase().includes(s)
    );
  }, [allJobs, q]);

  const summary = summaryQuery.data;
  const profile = profileQuery.data;
  const firstName = (user?.name || profile?.name || '').split(' ')[0];
  const jobsLoading = latestQuery.isLoading || (profileQuery.isSuccess && forYouQuery.isLoading);


  const openNextStep = () => {
    const link = summary?.nextStep?.link ?? '';
    const id = link.includes('application') ? link.split('/').pop() : undefined;
    if (id) navigation.navigate('ApplicationDetail', { applicationId: id });
    else goTab('Applications');
  };

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <KeyboardScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabSpace }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <PullToRefresh onRefresh={() => Promise.all([summaryQuery.refetch(), profileQuery.refetch(), forYouQuery.refetch(), latestQuery.refetch()])} />
        }
      >
        {/* Banner with search */}
        <Hero
          artHeight={76}
          eyebrow={firstName ? t('Hi {name}', { name: firstName }) : undefined}
          title={t("Let's find your next job.")}
          subtitle={
            trade && profile?.location
              ? t('Jobs matched to your trade ({trade}) and location ({city}).', {
                  trade: t(TRADE_LABEL[trade]),
                  city: profile.location.city,
                })
              : t('New verified jobs are added every day.')
          }
        >
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={18} color={colors.inkMuted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={t('Trade, company or city')}
                placeholderTextColor={colors.placeholder}
                returnKeyType="search"
                accessibilityLabel={t('Search jobs')}
                style={[styles.searchInput, { color: colors.ink }]}
              />
              {q.length > 0 && (
                <TouchableOpacity onPress={() => setQ('')} hitSlop={8} accessibilityLabel={t('Clear search')}>
                  <X size={16} color={colors.inkMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => goTab('FindJobs')}
              accessibilityLabel={t('More filters')}
              style={[styles.filterBtn, { backgroundColor: colors.primary }]}
            >
              <SlidersHorizontal size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Hero>

        {/* Next interview / step */}
        {summary?.nextStep && (
          <PressableScale
            onPress={openNextStep}
            style={[
              styles.nextStep,
              // Card with a purple edge and chip instead of a full purple slab.
              { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: dark ? '#3D3380' : '#CFC2FA' },
              !dark && shadows.card,
            ]}
            accessibilityLabel={t(summary.nextStep.title)}
          >
            <View style={[styles.nextIcon, { backgroundColor: colors.tiles.purple.bg }]}>
              <CalendarClock size={20} color={colors.tiles.purple.text} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.nextTitle, { color: colors.tiles.purple.text }]}>
                {t(summary.nextStep.title)}
              </Text>
              {summary.nextStep.at && (
                <Text style={[styles.nextWhen, { color: colors.ink }]}>
                  {formatDateTime(summary.nextStep.at)}
                </Text>
              )}
              <Text style={[styles.nextSub, { color: colors.inkSecondary }]} numberOfLines={2}>
                {summary.nextStep.subtitle}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.inkMuted} />
          </PressableScale>
        )}

        {/* Quick counts */}
        <View style={styles.stats}>
          {summary ? (
            <>
              <StatTile
                tone={colors.tiles.blue}
                icon={<Send size={16} color={colors.tiles.blue.text} />}
                value={summary.activeApplications}
                label={t('Applied')}
                onPress={() => goTab('Applications')}
              />
              <StatTile
                tone={colors.tiles.purple}
                icon={<CalendarClock size={16} color={colors.tiles.purple.text} />}
                value={summary.interviews}
                label={t('Interviews')}
                onPress={() => goTab('Applications')}
              />
              <StatTile
                tone={colors.tiles.green}
                icon={<Bookmark size={16} color={colors.tiles.green.text} />}
                value={summary.saved}
                label={t('Saved')}
                onPress={() => navigation.navigate('SavedJobs')}
              />
            </>
          ) : (
            [0, 1, 2].map((i) => <Skeleton key={i} height={86} radius={14} style={styles.flex} />)
          )}
        </View>

        {/* Profile progress: one slim line, hidden once the profile is complete. */}
        {summary && summary.profileStrength < 100 && (
          <Pressable
            onPress={() => goTab('WorkerProfile')}
            accessibilityRole="button"
            accessibilityLabel={t('Profile {n}% complete', { n: summary.profileStrength })}
            style={({ pressed }) => [styles.profileStrip, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.profileTop}>
              <Text style={[styles.profileTitle, { color: colors.ink }]}>
                {t('Profile {n}%', { n: summary.profileStrength })}
              </Text>
              {summary.profileHint ? (
                <Text style={[styles.profileHint, { color: colors.inkSecondary }]} numberOfLines={1}>
                  {'· '}{t(summary.profileHint)}
                </Text>
              ) : <View style={styles.flex} />}
              <ChevronRight size={16} color={colors.primary} />
            </View>
            <ProgressBar value={summary.profileStrength} height={3} style={styles.bar} />
          </Pressable>
        )}

        {/* Jobs */}
        <View style={styles.sectionHead}>
          <View style={styles.flex}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]} accessibilityRole="header">
              {q ? t('Search result') : t('Jobs for you')}
            </Text>
            {!jobsLoading && (
              <Text style={[styles.sectionSub, { color: colors.inkMuted }]}>
                {jobs.length === 1 ? t('{n} job found', { n: 1 }) : t('{n} jobs found', { n: jobs.length })}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => goTab('FindJobs')} style={styles.seeAll} hitSlop={8}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('See all')}</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {jobsLoading ? (
          <ListSkeleton />
        ) : jobs.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <Briefcase size={32} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {q ? t('No jobs match "{q}"', { q }) : t('No jobs yet')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.inkSecondary }]}>
              {t('Try another trade, like welder, fitter or driver.')}
            </Text>
          </View>
        ) : (
          jobs.map((j, i) => (
            <Stagger key={j.id} index={i}>
            <JobCard
              job={j}
              onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}
              onToggleSave={(job) => saveMutation.mutate(job)}
              saving={saveMutation.isPending && saveMutation.variables?.id === j.id}
            />
            </Stagger>
          ))
        )}

        {!jobsLoading && jobs.length > 0 && (
          <TouchableOpacity style={[styles.allBtn, { borderColor: colors.border }]} onPress={() => goTab('FindJobs')}>
            <Text style={[styles.allBtnText, { color: colors.primary }]}>{t('See all jobs')}</Text>
            <ArrowRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* WhatsApp alerts */}
        <View style={[styles.waCard, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.waIcon, { backgroundColor: colors.tiles.green.bg }]}>
            <MessageCircle size={22} color={colors.tiles.green.text} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.waTitle, { color: colors.ink }]}>{t('Job alerts on WhatsApp')}</Text>
            <Text style={[styles.waDesc, { color: colors.inkSecondary }]}>{t('New jobs for your trade, near you')}</Text>
          </View>
          <Toggle
            value={waAlerts}
            onValueChange={(v) => {
              Haptics.selectionAsync().catch(() => {});
              setWaAlerts(v);
            }}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor="#FFFFFF"
            accessibilityLabel={t('Job alerts on WhatsApp')}
          />
        </View>
      </KeyboardScrollView>
    </Screen>
  );
};

function StatTile({
  tone,
  icon,
  value,
  label,
  onPress,
}: {
  tone: TileColors;
  icon: React.ReactNode;
  value: number;
  label: string;
  onPress: () => void;
}) {
  const look = useTileStyle(tone);
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.stat, look.box]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <TileIcon tone={tone}>{icon}</TileIcon>
      <Text style={[styles.statValue, { color: look.value }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: look.label }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  flex: { flex: 1 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  filterBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  nextStep: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 14 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextTitle: { fontSize: 15, fontWeight: '700' },
  nextWhen: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  nextSub: { fontSize: 13, lineHeight: 18, marginTop: 2, opacity: 0.9 },

  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12, minHeight: 80 },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12.5, fontWeight: '600' },

  profileStrip: { paddingVertical: 6, paddingHorizontal: 2, marginBottom: 22 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileTitle: { fontSize: 13, fontWeight: '700' },
  profileHint: { flex: 1, fontSize: 13 },
  bar: { marginTop: 8 },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, marginTop: 2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  seeAllText: { fontSize: 14, fontWeight: '700' },

  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  emptyDesc: { fontSize: 14, textAlign: 'center' },

  allBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  allBtnText: { fontSize: 15, fontWeight: '700' },

  waCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginTop: 20 },
  waIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  waTitle: { fontSize: 15, fontWeight: '700' },
  waDesc: { fontSize: 13, marginTop: 2 },
});
