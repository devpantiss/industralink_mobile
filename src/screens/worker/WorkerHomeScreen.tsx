import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Search,
  Mic,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
  Briefcase,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { WorkerStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { JobCard } from '../../components/domain/JobCard';
import { Avatar } from '../../components/ui/Avatar';
import { Hero } from '../../components/ui/Hero';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { TRADE_LABEL, EXPERIENCE_LABEL } from '../../lib/labels';
import { formatDateTime } from '../../lib/format';
import { t } from '../../lib/i18n';
import { spacing } from '../../theme/spacing';
import type { JobForWorker } from '../../types';

type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

export const WorkerHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useUiStore();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [waAlerts, setWaAlerts] = useState(true);

  // Queries
  const summaryQuery = useQuery({
    queryKey: queryKeys.worker.summary,
    queryFn: () => workerApi.getSummary(),
  });

  const profileQuery = useQuery({
    queryKey: queryKeys.worker.profile,
    queryFn: () => workerApi.getProfile(),
  });

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

  const appsQuery = useQuery({
    queryKey: queryKeys.worker.applications,
    queryFn: () => workerApi.getApplications(),
  });

  // Toggle Save Job Mutation
  const saveMutation = useMutation({
    mutationFn: (job: JobForWorker) => workerApi.toggleSaveJob(job.id, !job.saved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
  });

  // Combine jobs: forYou trade matching + latest, avoiding duplicates
  const allJobs = useMemo(() => {
    const seen = new Set<string>();
    const list: JobForWorker[] = [];
    for (const j of [...(forYouQuery.data?.items ?? []), ...(latestQuery.data?.items ?? [])]) {
      if (!seen.has(j.id)) {
        seen.add(j.id);
        list.push(j);
      }
    }
    return list;
  }, [forYouQuery.data, latestQuery.data]);

  // Filtered jobs matching query `q`
  const filteredJobs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allJobs;
    return allJobs.filter((j) =>
      `${j.title} ${j.companyName} ${j.location.city} ${j.location.state}`.toLowerCase().includes(s)
    );
  }, [allJobs, q]);

  const summary = summaryQuery.data;
  const profile = profileQuery.data;
  const firstName = (user?.name || profile?.name || 'Worker').split(' ')[0];

  const handleVoiceSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isVoiceListening) {
      setIsVoiceListening(true);
      // Mock voice input
      setTimeout(() => {
        setQ('Welder');
        setIsVoiceListening(false);
      }, 1500);
    } else {
      setIsVoiceListening(false);
    }
  };

  const isRefreshing =
    summaryQuery.isRefetching || profileQuery.isRefetching || forYouQuery.isRefetching || latestQuery.isRefetching;

  const handleRefresh = () => {
    summaryQuery.refetch();
    profileQuery.refetch();
    forYouQuery.refetch();
    latestQuery.refetch();
    appsQuery.refetch();
  };

  // Stage counts for application distribution mini bar chart
  const stages = [
    { key: 'applied', label: t('Applied'), color: colors.tiles.blue.text },
    { key: 'shortlisted', label: t('Shortlisted'), color: colors.primary },
    { key: 'interview', label: t('Interview'), color: colors.tiles.purple.text },
    { key: 'offer', label: t('Offer'), color: colors.tiles.green.text },
  ];
  const appsList = appsQuery.data ?? [];
  const stageCounts = stages.map(
    (st) => appsList.filter((a) => a.stage === st.key || (st.key === 'offer' && a.stage === 'hired')).length
  );
  const maxStageCount = Math.max(1, ...stageCounts);

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Welcome Header */}
        <Hero
          eyebrow={t('Hi {name}', { name: firstName })}
          title={t("Let's find your next job.")}
          subtitle={
            trade && profile?.location
              ? t('Jobs matched to your trade ({trade}) and location ({city}).', {
                  trade: t(TRADE_LABEL[trade]),
                  city: profile.location.city,
                })
              : t('New verified jobs are added every day.')
          }
        />

        {/* Next Step Appointment Urgent Banner */}
        {summary?.nextStep && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (summary.nextStep?.link.includes('application')) {
                const id = summary.nextStep.link.split('/').pop();
                if (id) {
                  navigation.navigate('ApplicationDetail', { applicationId: id });
                }
              } else {
                navigation.navigate('WorkerTabs', { screen: 'Applications' } as any);
              }
            }}
            style={[styles.nextStepBanner, { backgroundColor: colors.tiles.purple.bg }]}
          >
            <CalendarClock size={20} color={colors.tiles.purple.text} style={styles.nextStepIcon} />
            <View style={styles.nextStepContent}>
              <Text style={[styles.nextStepTitle, { color: colors.tiles.purple.text }]}>
                {t(summary.nextStep.title)}
                {summary.nextStep.at ? ` · ${formatDateTime(summary.nextStep.at)}` : ''}
              </Text>
              <Text style={[styles.nextStepSubtitle, { color: colors.tiles.purple.text }]}>
                {summary.nextStep.subtitle}
              </Text>
            </View>
            <View style={styles.nextStepAction}>
              <Text style={[styles.nextStepActionText, { color: colors.tiles.purple.text }]}>
                {t('View')}
              </Text>
              <ArrowRight size={14} color={colors.tiles.purple.text} />
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar & Result Pill */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <Search size={18} color={colors.inkMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('Search welder, driver, fitter, company…')}
              placeholderTextColor={colors.inkMuted}
              style={[styles.searchInput, { color: colors.ink }]}
            />
            {q.length > 0 && (
              <TouchableOpacity onPress={() => setQ('')} style={{ padding: 4 }}>
                <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleVoiceSearch}
              style={[
                styles.micBtn,
                { backgroundColor: isVoiceListening ? colors.dangerFg : 'transparent' },
              ]}
            >
              <Mic
                size={18}
                color={isVoiceListening ? '#FFFFFF' : colors.inkSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'FindJobs' } as any)}
            style={[styles.filterBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            <SlidersHorizontal size={18} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Result Counter Pill */}
        <View style={styles.resultPillRow}>
          <View style={[styles.resultPill, { backgroundColor: colors.inkFill }]}>
            <Text style={[styles.resultPillTitle, { color: colors.onInk }]}>
              {q ? t('Search result') : t('Jobs for you')}
            </Text>
            <Text style={[styles.resultPillCount, { color: 'rgba(255, 255, 255, 0.75)' }]}>
              {filteredJobs.length === 1
                ? t('{n} job found', { n: filteredJobs.length })
                : t('{n} jobs found', { n: filteredJobs.length })}
            </Text>
          </View>
        </View>

        {/* Worker Profile Card with Strength Bar */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <View style={styles.profileHeaderRow}>
            <Avatar name={user?.name || profile?.name || 'Worker'} size="lg" />
            <View style={styles.profileHeaderInfo}>
              <View style={styles.profileNameLine}>
                <Text style={[styles.profileName, { color: colors.ink }]} numberOfLines={1}>
                  {user?.name || profile?.name}
                </Text>
                <ShieldCheck size={16} color={colors.primary} />
              </View>
              <Text style={[styles.profileTrade, { color: colors.inkSecondary }]}>
                {profile?.trade ? t(TRADE_LABEL[profile.trade]) : t('Worker')}
                {profile?.experience ? ` · ${t(EXPERIENCE_LABEL[profile.experience])}` : ''}
              </Text>
              {profile?.location && (
                <Text style={[styles.profileLocation, { color: colors.inkMuted }]}>
                  {profile.location.city}, {profile.location.state}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkerTabs', { screen: 'WorkerProfile' } as any)}
              style={[styles.editProfileBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>{t('Edit')}</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Strength Progress Bar */}
          {summary && (
            <View style={[styles.strengthSection, { borderTopColor: colors.border }]}>
              <View style={styles.strengthHeader}>
                <Text style={[styles.strengthTitle, { color: colors.inkSecondary }]}>
                  {t('Profile strength')}
                </Text>
                <Text style={[styles.strengthPercent, { color: colors.ink }]}>
                  {summary.profileStrength}%
                </Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceStrong }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${summary.profileStrength}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              {summary.profileHint && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('WorkerTabs', { screen: 'WorkerProfile' } as any)}
                  style={styles.hintLink}
                >
                  <Text style={[styles.hintText, { color: colors.primary }]}>
                    {t('Next: {item}', { item: t(summary.profileHint) })} →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 4 MiniStat Cards Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'Applications' } as any)}
            style={[styles.statTile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            <Text style={[styles.statLabel, { color: colors.inkSecondary }]}>{t('Applied')}</Text>
            <Text style={[styles.statNumber, { color: colors.ink }]}>
              {summary?.activeApplications ?? 0}
            </Text>
            <Text style={[styles.statUnit, { color: colors.inkMuted }]}>{t('active')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'Applications' } as any)}
            style={[styles.statTile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            <Text style={[styles.statLabel, { color: colors.inkSecondary }]}>{t('Interviews')}</Text>
            <Text style={[styles.statNumber, { color: colors.ink }]}>
              {summary?.interviews ?? 0}
            </Text>
            <Text style={[styles.statUnit, { color: colors.inkMuted }]}>{t('coming up')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'SavedJobs' } as any)}
            style={[styles.statTile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            <Text style={[styles.statLabel, { color: colors.inkSecondary }]}>{t('Saved')}</Text>
            <Text style={[styles.statNumber, { color: colors.ink }]}>
              {summary?.saved ?? 0}
            </Text>
            <Text style={[styles.statUnit, { color: colors.inkMuted }]}>{t('jobs')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'WorkerProfile' } as any)}
            style={[styles.statTile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            <Text style={[styles.statLabel, { color: colors.inkSecondary }]}>{t('Experience')}</Text>
            <Text style={[styles.statNumberText, { color: colors.ink }]}>
              {profile?.experience ? t(EXPERIENCE_LABEL[profile.experience]) : '—'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Application Stage Distribution Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View style={[styles.dotIndicator, { backgroundColor: colors.primary }]} />
            <Text style={[styles.chartTitle, { color: colors.inkSecondary }]}>
              {t('Your applications distribution')}
            </Text>
          </View>
          <View style={styles.barsContainer}>
            {stages.map((st, i) => (
              <View key={st.key} style={styles.barItem}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barStageText, { color: colors.inkSecondary }]}>
                    {st.label}
                  </Text>
                  <Text style={[styles.barCountText, { color: colors.ink }]}>
                    {stageCounts[i]}
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceStrong }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(stageCounts[i]! / maxStageCount) * 100}%`,
                        backgroundColor: st.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* WhatsApp Job Alerts Toggle Card */}
        <View style={[styles.waCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <View style={[styles.waIconBox, { backgroundColor: colors.tiles.green.bg }]}>
            <MessageCircle size={22} color={colors.tiles.green.text} />
          </View>
          <View style={styles.waContent}>
            <Text style={[styles.waTitle, { color: colors.ink }]}>
              {t('Job alerts on WhatsApp')}
            </Text>
            <Text style={[styles.waDesc, { color: colors.inkMuted }]}>
              {t('New jobs for your trade, near you')}
            </Text>
          </View>
          <Switch
            value={waAlerts}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWaAlerts(val);
            }}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Job Recommendations Section Header */}
        <View style={styles.jobsSectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            {q ? t('Search Results') : t('Recommended for you')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'FindJobs' } as any)}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('See all')}</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Jobs Feed */}
        {forYouQuery.isLoading || latestQuery.isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceMuted }]}>
            <Briefcase size={36} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {q ? t('No jobs match "{q}"', { q }) : t('No jobs yet')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.inkSecondary }]}>
              {t('Try another trade, like welder, fitter or driver.')}
            </Text>
          </View>
        ) : (
          filteredJobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}
              onToggleSave={(job) => saveMutation.mutate(job)}
              saving={saveMutation.isPending && saveMutation.variables?.id === j.id}
            />
          ))
        )}

        {filteredJobs.length > 0 && (
          <TouchableOpacity
            style={[styles.bottomAllBtn, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('WorkerTabs', { screen: 'FindJobs' } as any)}
          >
            <Text style={[styles.bottomAllText, { color: colors.primary }]}>
              {t('See all jobs')}
            </Text>
            <ArrowRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  welcomeBlock: {
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  welcomeSubtitle: {
    fontSize: 13.5,
    marginTop: 4,
    lineHeight: 18,
  },
  nextStepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  nextStepIcon: {
    marginTop: 1,
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  nextStepSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  nextStepAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextStepActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultPillRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  resultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  resultPillTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  resultPillCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileTrade: {
    fontSize: 12.5,
    marginTop: 2,
  },
  profileLocation: {
    fontSize: 11.5,
    marginTop: 1,
  },
  editProfileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  strengthSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 14,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  strengthPercent: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hintLink: {
    marginTop: 6,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 28,
  },
  statNumberText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  statUnit: {
    fontSize: 11,
    marginTop: 1,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  barsContainer: {
    gap: 10,
  },
  barItem: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barStageText: {
    fontSize: 12,
  },
  barCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  waCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
  },
  waIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waContent: {
    flex: 1,
  },
  waTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  waDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  jobsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  bottomAllBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  bottomAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
