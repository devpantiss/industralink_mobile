import React from 'react';
import { ChartBar } from '../../components/ui/ChartBar';
import { ProgressBar } from '../../components/ui/Progress';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, FileText, Timer, Users } from '../../components/ui/icons';
import { Text } from '../../components/ui/Text';
import { useTileStyle, TileIcon } from '../../components/ui/tileStyle';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { PressableScale } from '../../components/ui/PressableScale';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import type { TileColors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { EmptyState } from '../../components/ui/EmptyState';

/** Hiring numbers: speed, fill rate, where applicants come from, and each job's steps (web: Analytics). */
export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useUiStore((s) => s.colors);
  const q = useQuery({ queryKey: queryKeys.employer.analytics, queryFn: () => employerApi.getAnalytics() });
  const a = q.data;

  const body = () => {
    if (q.isLoading || !a) return <ListSkeleton count={3} />;
    if (a.totalApplicants === 0)
      return (
        <EmptyState art="chart" title="No numbers yet" description="Numbers appear once people start applying to your jobs." />
      );

    const maxWeek = Math.max(1, ...a.applicantsPerWeek.map((w) => w.count));
    const maxState = Math.max(1, ...a.byState.map((s) => s.count));

    return (
      <>
        <View style={styles.grid}>
          <Stat tone={colors.tiles.blue} label="Total applicants" value={String(a.totalApplicants)} icon={Users} />
          <Stat
            tone={colors.tiles.green}
            label="Openings filled"
            value={`${a.fillRate}%`}
            hint={`${a.hired} hired in total`}
            icon={CheckCircle2}
          />
          <Stat
            tone={colors.tiles.purple}
            label="Days to hire"
            value={a.avgDaysToHire === null ? '–' : String(Math.round(a.avgDaysToHire))}
            hint={a.avgDaysToHire === null ? 'No hires yet' : 'Average, apply to hired'}
            icon={Timer}
          />
          <Stat
            tone={colors.tiles.orange}
            label="Sent a resume"
            value={`${a.resumeShare}%`}
            hint="Others applied with profile"
            icon={FileText}
          />
        </View>

        <Card title="Applicants per week" caption="Last 8 weeks, all jobs">
          <View style={styles.chart} accessibilityLabel={a.applicantsPerWeek.map((w) => `${w.week}: ${w.count}`).join(', ')}>
            {a.applicantsPerWeek.map((w, i) => (
              <View key={w.week} style={styles.barCol}>
                <Text style={[styles.barNum, { color: colors.inkSecondary }]}>{w.count || ''}</Text>
                <ChartBar height={Math.max(3, (w.count / maxWeek) * 110)} filled={!!w.count} index={i} style={styles.bar} />
                <Text style={[styles.barLabel, { color: colors.inkMuted }]} numberOfLines={1}>
                  {i % 2 === 1 || i === a.applicantsPerWeek.length - 1 ? w.week : ''}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card title="Where applicants live" caption="By state">
          <View style={styles.states}>
            {a.byState.slice(0, 6).map((s) => (
              <View key={s.state}>
                <View style={styles.stateRow}>
                  <Text style={[styles.stateName, { color: colors.inkSecondary }]}>{s.state}</Text>
                  <Text style={[styles.stateNum, { color: colors.ink }]}>{s.count}</Text>
                </View>
                <ProgressBar value={(s.count / maxState) * 100} style={styles.track} />
              </View>
            ))}
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.ink }]}>Each job</Text>
        <Text style={[styles.sectionCaption, { color: colors.inkSecondary }]}>
          How many people reached each step. Tap a job to see its applicants.
        </Text>
        {a.byJob.map((j) => (
          <PressableScale
            key={j.jobId}
            onPress={() => navigation.navigate('JobApplicants', { jobId: j.jobId })}
            accessibilityLabel={`${j.title}: ${j.applied} applied, ${j.hired} of ${j.openings} hired`}
            style={[styles.job, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.jobHead}>
              <Text style={[styles.jobTitle, { color: colors.ink }]} numberOfLines={1}>
                {j.title}
              </Text>
              <ChevronRight size={18} color={colors.inkMuted} />
            </View>
            <View style={styles.steps}>
              {[
                { label: 'Applied', n: j.applied, tone: colors.tiles.blue },
                { label: 'Shortlisted', n: j.shortlisted, tone: { bg: colors.primarySoft, text: colors.primary } },
                { label: 'Interview', n: j.interview, tone: colors.tiles.purple },
                { label: 'Hired', n: j.hired, tone: colors.tiles.green, of: j.openings },
              ].map((s) => (
                <View key={s.label} style={[styles.step, { backgroundColor: s.tone.bg }]}>
                  <Text style={[styles.stepNum, { color: s.tone.text }]}>
                    {s.n}
                    {s.of !== undefined && <Text style={styles.stepOf}> / {s.of}</Text>}
                  </Text>
                  <Text style={[styles.stepLabel, { color: s.tone.text }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </PressableScale>
        ))}
      </>
    );
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh onRefresh={() => q.refetch()} />
        }
      >
        <Text style={[styles.title, { color: colors.ink }]}>Analytics</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          How fast you hire, and where your applicants come from.
        </Text>
        {body()}
      </ScrollView>
    </Screen>
  );
};

const Stat: React.FC<{
  tone: TileColors;
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}> = ({ tone, label, value, hint, icon: Icon }) => {
  const look = useTileStyle(tone);
  return (
    <View style={[styles.stat, look.box]}>
      <View style={styles.statHead}>
        <Text style={[styles.statLabel, { color: look.label }]} numberOfLines={1}>
          {label}
        </Text>
        <TileIcon tone={tone}>
          <Icon size={18} color={tone.text} />
        </TileIcon>
      </View>
      <Text style={[styles.statValue, { color: look.value }]}>{value}</Text>
      {hint ? (
        <Text style={[styles.statHint, { color: look.label }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
};

const Card: React.FC<{ title: string; caption?: string; children: React.ReactNode }> = ({ title, caption, children }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>{title}</Text>
        {caption ? <Text style={[styles.cardCaption, { color: colors.inkMuted }]}>{caption}</Text> : null}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: 16, padding: 12, minHeight: 92 },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 8, letterSpacing: -0.5 },
  statHint: { fontSize: 11.5, marginTop: 2, opacity: 0.9 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardCaption: { fontSize: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 150 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '70%', maxWidth: 26, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barNum: { fontSize: 11, fontWeight: '700' },
  barLabel: { fontSize: 11, height: 14 },
  states: { gap: 12 },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  stateName: { fontSize: 13 },
  stateNum: { fontSize: 13, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  sectionCaption: { fontSize: 13, marginTop: 2, marginBottom: 10 },
  job: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, gap: 10, ...shadows.card },
  jobHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' },
  stepNum: { fontSize: 17, fontWeight: '700' },
  stepOf: { fontSize: 12, fontWeight: '600' },
  stepLabel: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
});
