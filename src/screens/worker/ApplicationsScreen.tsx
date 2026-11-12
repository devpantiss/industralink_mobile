import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  MapPin,
  Phone,
  XCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { WorkerStackParamList } from '../../navigation/types';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { payShort } from '../../components/domain/JobBits';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { STAGE_LABEL_WORKER } from '../../lib/labels';
import { formatDateTime, telUrl, timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { WorkerApplication } from '../../types';

type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;
type Tab = 'active' | 'interviews' | 'closed';

const isClosed = (a: WorkerApplication) => ['hired', 'rejected', 'withdrawn'].includes(a.stage);

const STEPS = ['Applied', 'Seen', 'Shortlisted', 'Interview', 'Offer'];

function stepOf(a: WorkerApplication): number {
  switch (a.stage) {
    case 'shortlisted':
      return 2;
    case 'interview':
      return 3;
    case 'offer':
    case 'hired':
      return 4;
    default:
      return a.timeline?.some((e) => e.stage === 'viewed') ? 1 : 0;
  }
}

export const ApplicationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useUiStore();
  const [tab, setTab] = useState<Tab>('active');

  const {
    data: applications,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.worker.applications,
    queryFn: () => workerApi.getApplications(),
  });

  const all = applications ?? [];
  const groups: Record<Tab, WorkerApplication[]> = {
    active: all.filter((a) => !isClosed(a)),
    interviews: all.filter((a) => a.stage === 'interview'),
    closed: all.filter(isClosed),
  };

  const currentList = groups[tab];

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Page Title */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('My applications')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
            {t('See where each application stands.')}
          </Text>
        </View>

        <SegmentedTabs
          variant="underline"
          style={styles.tabsWrap}
          value={tab}
          onChange={setTab}
          items={[
            { key: 'active', label: t('Active'), count: groups.active.length },
            { key: 'interviews', label: t('Interviews'), count: groups.interviews.length },
            { key: 'closed', label: t('Closed'), count: groups.closed.length },
          ]}
        />

        {/* Content */}
        {isLoading ? (
          <ListSkeleton />
        ) : currentList.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
            <FileText size={36} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {tab === 'closed'
                ? t('Nothing here yet')
                : tab === 'interviews'
                ? t('No interviews yet')
                : t("You haven't applied yet")}
            </Text>
            {tab === 'active' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkerTabs', { screen: 'FindJobs' })}
                style={[styles.findJobsBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.findJobsBtnText}>{t('Find jobs')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentList.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              onPress={() => navigation.navigate('ApplicationDetail', { applicationId: a.id })}
              onViewJob={() => navigation.navigate('JobDetail', { jobId: a.job.id })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

function ApplicationCard({
  app,
  onPress,
  onViewJob,
}: {
  app: WorkerApplication;
  onPress: () => void;
  onViewJob: () => void;
}) {
  const { colors } = useUiStore();
  const closed = isClosed(app) && app.stage !== 'hired';
  const step = stepOf(app);
  const pay = payShort(app.job);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <CompanyLogo job={app.job} size="md" />
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.jobTitle, { color: colors.ink }]} numberOfLines={1}>
            {app.job.title}
          </Text>
          <Text style={[styles.jobMeta, { color: colors.inkSecondary }]} numberOfLines={1}>
            {app.job.companyName} · {pay ? `${pay.range} ${pay.per}` : t('Pay not shown')} · {app.job.location.city}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.inkMuted} />
      </View>

      {/* Stage Badge & Quick Call HR button */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.stageBadge,
            {
              backgroundColor:
                app.stage === 'interview'
                  ? colors.tiles.purple.bg
                  : app.stage === 'offer' || app.stage === 'hired'
                  ? colors.tiles.green.bg
                  : app.stage === 'shortlisted'
                  ? colors.primarySoft
                  : colors.surfaceMuted,
            },
          ]}
        >
          <Text
            style={[
              styles.stageBadgeText,
              {
                color:
                  app.stage === 'interview'
                    ? colors.tiles.purple.text
                    : app.stage === 'offer' || app.stage === 'hired'
                    ? colors.tiles.green.text
                    : app.stage === 'shortlisted'
                    ? colors.primary
                    : colors.inkSecondary,
              },
            ]}
          >
            {t(STAGE_LABEL_WORKER[app.stage])}
          </Text>
        </View>

        {app.contact && (
          <TouchableOpacity
            onPress={() => Linking.openURL(telUrl(app.contact!.phone))}
            style={[styles.callHrBtn, { backgroundColor: colors.primary }]}
          >
            <Phone size={13} color="#FFFFFF" />
            <Text style={styles.callHrBtnText}>{t('Call HR')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Closed Notice or 5-Step Stepper */}
      {closed ? (
        <View style={[styles.closedNotice, { backgroundColor: colors.surfaceMuted }]}>
          <XCircle size={16} color={colors.inkMuted} />
          <Text style={[styles.closedNoticeText, { color: colors.inkSecondary }]}>
            {app.stage === 'withdrawn'
              ? t('You withdrew this application.')
              : t('Not selected this time. Keep applying, new jobs come every day.')}
          </Text>
        </View>
      ) : (
        <>
          {/* 5-Step Stepper */}
          <View style={styles.stepperContainer}>
            <View style={[styles.stepperLineTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.stepperLineFill,
                  { width: `${(step / 4) * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>

            <View style={styles.stepsRow}>
              {STEPS.map((s, i) => {
                const done = i < step || app.stage === 'hired';
                const now = i === step && app.stage !== 'hired';
                return (
                  <View key={s} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepNode,
                        {
                          borderColor: done || now ? colors.primary : colors.borderStrong,
                          backgroundColor: done ? colors.primary : colors.surface,
                        },
                      ]}
                    >
                      {done ? (
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      ) : now ? (
                        <View style={[styles.stepNodeDot, { backgroundColor: colors.primary }]} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color: now ? colors.ink : colors.inkMuted,
                          fontWeight: now ? '700' : '500',
                        },
                      ]}
                    >
                      {t(s)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Contextual Status Box */}
          <View style={[styles.contextBox, { backgroundColor: colors.surfaceMuted }]}>
            {app.stage === 'interview' && app.interview ? (
              <>
                <CalendarClock size={16} color={colors.tiles.purple.text} />
                <Text style={[styles.contextText, { color: colors.ink }]}>
                  <Text style={{ fontWeight: '700' }}>{t('Interview')}: </Text>
                  {formatDateTime(app.interview.at)} · {app.interview.place}
                </Text>
              </>
            ) : app.stage === 'offer' || app.stage === 'hired' ? (
              <>
                <Gift size={16} color={colors.successFg} />
                <Text style={[styles.contextText, { color: colors.ink }]}>
                  {app.stage === 'hired'
                    ? t("You're hired. Congratulations!")
                    : t('You have an offer. Tap to reply.')}
                </Text>
              </>
            ) : app.stage === 'shortlisted' ? (
              <>
                <Check size={16} color={colors.primary} />
                <Text style={[styles.contextText, { color: colors.ink }]}>
                  {t("You're shortlisted. The employer will contact you soon.")}
                </Text>
              </>
            ) : (
              <>
                <Clock size={16} color={colors.inkMuted} />
                <Text style={[styles.contextText, { color: colors.inkSecondary }]}>
                  {step === 1
                    ? t('The employer has seen your profile.')
                    : t('Sent. Most employers reply in 2 to 3 days.')}
                  <Text style={{ color: colors.inkMuted }}> · {timeAgo(app.updatedAt)}</Text>
                </Text>
              </>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  titleBlock: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    marginTop: 3,
  },
  tabsWrap: {
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 11,
  },
  tabLabel: {
    fontSize: 13,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  findJobsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  findJobsBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  jobMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  callHrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  callHrBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  closedNoticeText: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },
  stepperContainer: {
    position: 'relative',
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  stepperLineTrack: {
    position: 'absolute',
    top: 10,
    left: '8%',
    right: '8%',
    height: 2,
    zIndex: 1,
  },
  stepperLineFill: {
    height: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepItem: {
    alignItems: 'center',
    width: 58,
  },
  stepNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNodeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stepLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  contextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  contextText: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },
});
