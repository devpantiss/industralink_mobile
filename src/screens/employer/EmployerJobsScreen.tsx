import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, ChevronRight, Briefcase } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { SHIFT_LABEL } from '../../lib/labels';
import { formatPay } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { Job } from '../../types';

export const EmployerJobsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useUiStore();
  const [tab, setTab] = useState<'active' | 'draft' | 'closed'>('active');

  const {
    data: allJobs,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.employer.jobs(),
    queryFn: () => employerApi.getJobs(),
  });

  const activeJobs = allJobs?.filter((j) => j.status === 'active') ?? [];
  const draftJobs = allJobs?.filter((j) => j.status === 'draft') ?? [];
  const closedJobs = allJobs?.filter((j) => j.status === 'closed') ?? [];

  const currentList = tab === 'active' ? activeJobs : tab === 'draft' ? draftJobs : closedJobs;

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
        {/* Title and Post Job Button */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.ink }]}>{t('Jobs')}</Text>
            <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
              {t('Manage your job postings and applicants.')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('PostJobWizard')}
            style={[styles.postJobBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={16} color="#FFF" />
            <Text style={styles.postJobBtnText}>{t('Post job')}</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Tabs */}
        <SegmentedTabs
          variant="underline"
          style={styles.tabsWrap}
          value={tab}
          onChange={setTab}
          items={[
            { key: 'active', label: t('Active'), count: activeJobs.length },
            { key: 'draft', label: t('Draft'), count: draftJobs.length },
            { key: 'closed', label: t('Closed'), count: closedJobs.length },
          ]}
        />

        {/* Jobs List */}
        {isLoading ? (
          <ListSkeleton />
        ) : currentList.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
            <Briefcase size={36} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>{t('No jobs here')}</Text>
            {tab === 'active' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('PostJobWizard')}
                style={[styles.emptyPostBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13.5 }}>
                  {t('Post your first job')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentList.map((job) => (
            <TouchableOpacity
              key={job.id}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Candidates')}
              style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.jobCardHeader}>
                <CompanyLogo job={job} size="md" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobCardTitle, { color: colors.ink }]} numberOfLines={1}>
                    {job.title}
                  </Text>
                  <Text style={[styles.jobCardMeta, { color: colors.inkSecondary }]}>
                    {job.location.city} · {t(SHIFT_LABEL[job.shift])} · {formatPay(job.payMin, job.payMax, job.payPeriod)}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </View>

              {/* Stats Bar */}
              <View style={[styles.statsRow, { backgroundColor: colors.surfaceMuted }]}>
                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {job.applicantsCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.inkSecondary }]}>
                    {t('Applicants')}
                  </Text>
                </View>

                {job.newApplicantsCount > 0 && (
                  <View style={styles.statCol}>
                    <Text style={[styles.statValue, { color: colors.tiles.yellow.text }]}>
                      {job.newApplicantsCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.tiles.yellow.text }]}>
                      {t('New')}
                    </Text>
                  </View>
                )}

                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: colors.ink }]}>
                    {job.openings}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.inkSecondary }]}>
                    {t('Openings')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
  },
  postJobBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
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
  tabText: {
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
  emptyPostBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 8,
  },
  jobCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobCardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  jobCardMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 1,
  },
});
