import React from 'react';
import { GradientFill } from '../../components/ui/GradientFill';
import { gradients } from '../../theme/effects';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, Briefcase, Building2, HardHat, PartyPopper } from '../../components/ui/icons';
import { Text } from '../../components/ui/Text';
import { useTileStyle, TileIcon } from '../../components/ui/tileStyle';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Hero } from '../../components/ui/Hero';
import { PressableScale } from '../../components/ui/PressableScale';
import { Skeleton } from '../../components/ui/Skeleton';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatNumber } from '../../lib/format';
import type { AdminDrawerParamList } from '../../navigation/types';
import type { TileColors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

/** Admin overview (web: AdminHome): what needs doing today, and how the platform is growing. */
export const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const q = useQuery({ queryKey: queryKeys.admin.summary, queryFn: () => adminApi.getSummary() });
  const s = q.data;
  const go = (screen: keyof AdminDrawerParamList) => navigation.navigate(screen);
  const maxWeek = Math.max(1, ...(s?.signupsPerWeek.map((w) => Math.max(w.workers, w.companies)) ?? [1]));

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
        <Hero
          eyebrow="Admin"
          title="Platform overview"
          subtitle="Keep IndustriaLink trusted: approve real companies and remove bad jobs."
        >
          {s && s.pendingVerifications > 0 ? (
            <Pressable
              onPress={() => go('VerificationsQueue')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cta, { overflow: 'hidden', opacity: pressed ? 0.85 : 1 }]}
            >
              <GradientFill colors={gradients[theme].sunrise} />
              <Text style={[styles.ctaText, { color: colors.onAccent }]}>
                Review {s.pendingVerifications} {s.pendingVerifications === 1 ? 'company' : 'companies'}
              </Text>
              <ArrowRight size={18} color={colors.onAccent} weight="bold" />
            </Pressable>
          ) : null}
        </Hero>

        <View style={styles.grid}>
          {s ? (
            <>
              <Stat tone={colors.tiles.blue} label="Workers" value={formatNumber(s.workers)} icon={HardHat} onPress={() => go('UsersManagement')} />
              <Stat tone={colors.tiles.green} label="Companies" value={formatNumber(s.companies)} icon={Building2} onPress={() => go('UsersManagement')} />
              <Stat tone={colors.tiles.purple} label="Active jobs" value={String(s.activeJobs)} icon={Briefcase} onPress={() => go('JobsModeration')} />
              <Stat
                tone={colors.tiles.yellow}
                label="Waiting for approval"
                value={String(s.pendingVerifications)}
                icon={BadgeCheck}
                onPress={() => go('VerificationsQueue')}
              />
            </>
          ) : (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} style={styles.statSkeleton} />)
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>Action required</Text>
          {!s ? (
            <Skeleton style={{ height: 72, borderRadius: 10 }} />
          ) : s.attention.length === 0 ? (
            <View style={styles.caughtUp}>
              <PartyPopper size={22} color={colors.inkMuted} />
              <Text style={[styles.caughtUpText, { color: colors.inkMuted }]}>All caught up</Text>
            </View>
          ) : (
            s.attention.map((a, i) => (
              <Pressable
                key={a.id}
                onPress={() => go(a.link as keyof AdminDrawerParamList)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.attention,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  pressed && { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.attentionText, { color: colors.ink }]}>{a.text}</Text>
                <ArrowRight size={16} color={colors.primary} />
              </Pressable>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, styles.noMargin, { color: colors.ink }]}>Sign-ups per week</Text>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.inkSecondary }]}>Workers</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.inkSecondary }]}>Companies</Text>
            </View>
          </View>
          {s ? (
            <View style={styles.chart}>
              {s.signupsPerWeek.map((w) => (
                <View
                  key={w.week}
                  style={styles.weekCol}
                  accessible
                  accessibilityLabel={`Week of ${w.week}: ${w.workers} workers, ${w.companies} companies`}
                >
                  <View style={styles.bars}>
                    {[
                      { n: w.workers, c: colors.primary },
                      { n: w.companies, c: colors.accent },
                    ].map((b, k) => (
                      <View key={k} style={styles.barWrap}>
                        <Text style={[styles.barNum, { color: colors.inkSecondary }]}>{b.n}</Text>
                        <View style={[styles.bar, { height: Math.max(3, (b.n / maxWeek) * 110), backgroundColor: b.c }]} />
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.week, { color: colors.inkMuted }]}>{w.week}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Skeleton style={{ height: 150, borderRadius: 10 }} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const Stat: React.FC<{
  tone: TileColors;
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
}> = ({ tone, label, value, icon: Icon, onPress }) => {
  const look = useTileStyle(tone);
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={[styles.stat, look.box]}>
      <View style={styles.statHead}>
        <Text style={[styles.statLabel, { color: look.label }]} numberOfLines={1}>
          {label}
        </Text>
        <TileIcon tone={tone}>
          <Icon size={18} color={tone.text} />
        </TileIcon>
      </View>
      <Text style={[styles.statValue, { color: look.value }]}>{value}</Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
  },
  ctaText: { fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: 16, padding: 14, minHeight: 96 },
  statSkeleton: { flexGrow: 1, flexBasis: '45%', height: 96, borderRadius: 16 },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 10, letterSpacing: -0.5 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  noMargin: { marginBottom: 0 },
  caughtUp: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  caughtUpText: { fontSize: 14 },
  attention: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 52 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  attentionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  legendText: { fontSize: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 8 },
  weekCol: { flex: 1, alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrap: { alignItems: 'center', gap: 3 },
  bar: { width: 18, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barNum: { fontSize: 11.5, fontWeight: '700' },
  week: { fontSize: 11 },
});
