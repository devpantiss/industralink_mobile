import { VerificationBanner } from '../../components/domain/VerificationBanner';
import { useTabBarSpace } from '../../components/layout/TabBar';
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useTileStyle, TileIcon } from '../../components/ui/tileStyle';
import type { TileColors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  CalendarClock,
  CheckCircle2,
  Plus,
  UserPlus,
  ChevronRight,
} from '../../components/ui/icons';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Hero } from '../../components/ui/Hero';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { SHIFT_LABEL } from '../../lib/labels';
import { formatDateTime, greeting, isAfterAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import { shadows } from '../../theme/shadows';

export const EmployerHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useUiStore();
  const tabSpace = useTabBarSpace();
  const { user } = useAuthStore();

  const companyQuery = useQuery({ queryKey: queryKeys.employer.company, queryFn: () => employerApi.getCompany() });
  const summaryQuery = useQuery({
    queryKey: queryKeys.employer.summary,
    queryFn: () => employerApi.getSummary(),
  });

  const jobsQuery = useQuery({
    queryKey: queryKeys.employer.jobs('active'),
    queryFn: () => employerApi.getJobs('active'),
  });

  const interviewsQuery = useQuery({
    queryKey: queryKeys.employer.allCandidates({ stage: 'interview' }),
    queryFn: () => employerApi.getAllCandidates({ stage: 'interview' }),
  });

  const s = summaryQuery.data;
  const jobs = jobsQuery.data ?? [];
  const upcomingInterviews = (interviewsQuery.data ?? [])
    .filter((c) => c.interview && isAfterAgo(c.interview.at, 3_600_000))
    .slice(0, 4);

  const isRefreshing = summaryQuery.isRefetching || jobsQuery.isRefetching || interviewsQuery.isRefetching;

  const handleRefresh = () => {
    summaryQuery.refetch();
    jobsQuery.refetch();
    interviewsQuery.refetch();
  };

  const firstName = (user?.name || 'Recruiter').split(' ')[0];

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabSpace }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Hero
          eyebrow={companyQuery.data?.verification === 'approved' ? t('Verified employer') : t('Employer')}
          title={`${greeting()}, ${firstName}`}
          subtitle={`Hiring at ${user?.companyName || 'your company'}${
            s ? ` · ${s.newApplicants} new applicant${s.newApplicants === 1 ? '' : 's'} waiting` : ''
          }`}
        >
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Candidates')}
              style={[styles.outlineBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Users size={16} color={colors.ink} />
              <Text style={[styles.outlineBtnText, { color: colors.ink }]}>{t('View candidates')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('PostJobWizard')}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.primaryBtnText}>{t('Post a job')}</Text>
            </TouchableOpacity>
          </View>
        </Hero>

        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <VerificationBanner />
        </View>

        {/* 4 Pastel Stat Cards (2x2 Grid) */}
        <View style={styles.statsGrid}>
          <EmpStat tone={colors.tiles.blue} label={t('Open jobs')} icon={Briefcase} value={s?.openJobs ?? jobs.length} onPress={() => navigation.navigate('EmployerJobs')} />
          <EmpStat
            tone={colors.tiles.green}
            label={t('New applicants')}
            icon={UserPlus}
            value={s?.newApplicants ?? 0}
            note={s?.newApplicants ? 'To review' : undefined}
            onPress={() => navigation.navigate('Candidates')}
          />
          <EmpStat tone={colors.tiles.purple} label={t('Interviews')} icon={CalendarClock} value={s?.interviewsThisWeek ?? 0} note="this week" onPress={() => navigation.navigate('Candidates')} />
          <EmpStat tone={colors.tiles.orange} label={t('Hired')} icon={CheckCircle2} value={s?.hiredThisMonth ?? 0} note="this month" onPress={() => navigation.navigate('Candidates')} />
        </View>

        {/* Applicants Per Day Bar Chart */}
        {s?.applicantsPerDay && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                {t('Applicants per day')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.inkMuted }]}>This week</Text>
            </View>
            <View style={styles.chartBarsRow}>
              {s.applicantsPerDay.map((d, i) => {
                const maxVal = Math.max(1, ...s.applicantsPerDay.map((x) => x.count));
                const barHeight = Math.max(12, (d.count / maxVal) * 90);
                return (
                  <View key={i} style={styles.chartCol}>
                    <Text style={[styles.barCountText, { color: colors.ink }]}>{d.count || ''}</Text>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: barHeight,
                          backgroundColor: d.count > 0 ? colors.primary : colors.surfaceStrong,
                        },
                      ]}
                    />
                    <Text style={[styles.barDayText, { color: colors.inkSecondary }]}>
                      {d.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Upcoming Interviews Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              {t('Upcoming interviews')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Candidates')}>
              <Text style={[styles.cardActionLink, { color: colors.primary }]}>{t('View all')}</Text>
            </TouchableOpacity>
          </View>

          {upcomingInterviews.length === 0 ? (
            <Text style={[styles.emptyHintText, { color: colors.inkMuted }]}>
              {t('No interviews scheduled. Shortlist workers and invite them from a job.')}
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {upcomingInterviews.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => navigation.navigate('CandidateDossier', { candidateId: c.id })}
                  style={[styles.interviewItem, { backgroundColor: colors.surfaceMuted }]}
                >
                  <Avatar name={c.worker.name} src={c.worker.photoUrl} size="sm" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.candidateName, { color: colors.ink }]}>
                      {c.worker.name}
                    </Text>
                    <Text style={[styles.candidateJob, { color: colors.inkMuted }]}>
                      {c.jobTitle}
                    </Text>
                  </View>
                  <Text style={[styles.interviewAtText, { color: colors.tiles.purple.text }]}>
                    {c.interview ? formatDateTime(c.interview.at) : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Hiring Funnel Section */}
        {s?.funnel && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 14 }]}>
              {t('Hiring funnel')} <Text style={{ fontSize: 13, fontWeight: '400', color: colors.inkMuted }}>· all jobs</Text>
            </Text>
            <View style={{ gap: 12 }}>
              {s.funnel.map((f, i) => {
                const max = Math.max(1, s.funnel[0]!.count);
                const funnelColors = [
                  colors.tiles.blue.text,
                  colors.primary,
                  colors.tiles.purple.text,
                  colors.tiles.green.text,
                ];
                return (
                  <View key={f.stage} style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.funnelStageText, { color: colors.inkSecondary }]}>
                        {f.stage}
                      </Text>
                      <Text style={[styles.funnelCountText, { color: colors.ink }]}>{f.count}</Text>
                    </View>
                    <View style={[styles.funnelTrack, { backgroundColor: colors.surfaceStrong }]}>
                      <View
                        style={[
                          styles.funnelFill,
                          {
                            width: `${(f.count / max) * 100}%`,
                            backgroundColor: funnelColors[i] || colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Open Jobs List */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('Open jobs')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EmployerJobs')}>
              <Text style={[styles.cardActionLink, { color: colors.primary }]}>{t('View all')}</Text>
            </TouchableOpacity>
          </View>

          {jobs.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.inkMuted }}>{t('No open jobs.')}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {jobs.slice(0, 5).map((j) => (
                <TouchableOpacity
                  key={j.id}
                  onPress={() => navigation.navigate('JobApplicants', { jobId: j.id })}
                  style={[styles.jobRowItem, { backgroundColor: colors.surfaceMuted }]}
                >
                  <CompanyLogo job={j} size="sm" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.jobRowTitle, { color: colors.ink }]} numberOfLines={1}>
                      {j.title}
                    </Text>
                    <Text style={[styles.jobRowSubtitle, { color: colors.inkMuted }]}>
                      {j.location.city} · {t(SHIFT_LABEL[j.shift])}
                    </Text>
                    <View style={styles.openingsProgress}>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceStrong }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(100, ((j.applicantsCount || 0) / Math.max(1, j.openings)) * 100)}%`,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.openingsText, { color: colors.inkSecondary }]}>
                        {j.openings} {t('openings')} · {j.applicantsCount} {t('applied')}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.inkMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

function EmpStat({
  tone,
  label,
  value,
  note,
  icon: Icon,
  onPress,
}: {
  tone: TileColors;
  label: string;
  value: number;
  note?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
}) {
  const look = useTileStyle(tone);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.statTile, look.box]} accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.statTileHeader}>
        <Text style={[styles.statTileLabel, { color: look.label }]}>{label}</Text>
        <TileIcon tone={tone}>
          <Icon size={18} color={tone.text} />
        </TileIcon>
      </View>
      <Text style={[styles.statTileNumber, { color: look.value }]}>{value}</Text>
      {note ? <Text style={[styles.statNote, { color: look.label }]}>{note}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 22,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: 14,
    borderRadius: 14,
  },
  statTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTileLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  statTileNumber: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 28,
  },
  statNote: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  cardActionLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  chartCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  chartBar: {
    width: 14,
    borderRadius: 7,
  },
  barCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barDayText: {
    fontSize: 11,
  },
  emptyHintText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 14,
    lineHeight: 18,
  },
  interviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
  },
  candidateJob: {
    fontSize: 12,
    marginTop: 1,
  },
  interviewAtText: {
    fontSize: 12,
    fontWeight: '700',
  },
  funnelStageText: {
    fontSize: 13,
  },
  funnelCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  funnelTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  funnelFill: {
    height: '100%',
    borderRadius: 4,
  },
  jobRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  jobRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  jobRowSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  openingsProgress: {
    marginTop: 6,
    gap: 3,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  openingsText: {
    fontSize: 11,
  },
});
