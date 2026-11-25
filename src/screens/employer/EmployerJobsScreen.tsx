import { errorText } from '../../lib/errors';
import { GradientFill } from '../../components/ui/GradientFill';
import { useTabBarSpace } from '../../components/layout/TabBar';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Briefcase, MoreVertical, Pencil, Copy, PauseCircle, PlayCircle, Trash2 } from '../../components/ui/icons';
import { Sheet } from '../../components/ui/Sheet';
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
import { shadows } from '../../theme/shadows';
import { PullToRefresh } from '../../components/ui/PullToRefresh';

export const EmployerJobsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useUiStore();
  const tabSpace = useTabBarSpace();
  const [tab, setTab] = useState<'active' | 'draft' | 'closed'>('active');
  const [menuJob, setMenuJob] = useState<Job | null>(null);
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  const refreshJobs = () => {
    qc.invalidateQueries({ queryKey: queryKeys.employer.all });
    qc.invalidateQueries({ queryKey: queryKeys.jobs() });
  };
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'closed' }) => employerApi.updateJob(id, { status }),
    onSuccess: (_d, v) => {
      refreshJobs();
      showToast(v.status === 'closed' ? 'Job closed. Workers cannot apply now.' : 'Job reopened.', 'success');
    },
    onError: (e) => showToast(errorText(e, 'Could not update the job. Try again.'), 'error'),
  });
  const duplicate = useMutation({
    mutationFn: (j: Job) => {
      const { id: _id, postedAt: _p, applicantsCount: _a, newApplicantsCount: _n, ...rest } = j;
      return employerApi.createJob({ ...rest, title: `${j.title} (copy)`, status: 'draft' });
    },
    onSuccess: () => {
      refreshJobs();
      setTab('draft');
      showToast('Copied to Draft. Open it to edit and publish.', 'success');
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => employerApi.deleteJob(id),
    onSuccess: () => {
      refreshJobs();
      showToast('Job deleted.', 'success');
    },
    onError: (e) => showToast(errorText(e, 'Could not delete the job. Try again.'), 'error'),
  });
  const confirmDelete = (j: Job) =>
    Alert.alert(
      'Delete this job?',
      j.applicantsCount > 0
        ? `${j.applicantsCount} applicant${j.applicantsCount === 1 ? '' : 's'} will lose this application. Closing the job keeps them.`
        : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(j.id) },
      ],
    );

  const {
    data: allJobs,
    isLoading,
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabSpace }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh onRefresh={() => refetch()} />
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
            style={[styles.postJobBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}
          >
            <GradientFill />
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
                style={[styles.emptyPostBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}
              >
                <GradientFill />
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
              onPress={() => navigation.navigate('JobApplicants', { jobId: job.id })}
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
                <TouchableOpacity
                  onPress={() => setMenuJob(job)}
                  accessibilityLabel="Job options"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.moreBtn}
                >
                  <MoreVertical size={20} color={colors.inkSecondary} />
                </TouchableOpacity>
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

      <Sheet visible={!!menuJob} onClose={() => setMenuJob(null)} title={menuJob?.title} subtitle={menuJob ? `${menuJob.location.city}` : undefined}>
        {menuJob && (
          <>
            <JobMenuRow
              icon={<Pencil size={20} color={colors.primary} />}
              label="Edit job"
              onPress={() => {
                const id = menuJob.id;
                setMenuJob(null);
                navigation.navigate('PostJobWizard', { jobId: id });
              }}
            />
            {menuJob.status === 'active' && (
              <JobMenuRow
                icon={<PauseCircle size={20} color={colors.primary} />}
                label="Close job (stop new applications)"
                onPress={() => {
                  setStatus.mutate({ id: menuJob.id, status: 'closed' });
                  setMenuJob(null);
                }}
              />
            )}
            {menuJob.status === 'closed' && (
              <JobMenuRow
                icon={<PlayCircle size={20} color={colors.primary} />}
                label="Reopen job"
                onPress={() => {
                  setStatus.mutate({ id: menuJob.id, status: 'active' });
                  setMenuJob(null);
                }}
              />
            )}
            <JobMenuRow
              icon={<Copy size={20} color={colors.primary} />}
              label="Duplicate as draft"
              onPress={() => {
                duplicate.mutate(menuJob);
                setMenuJob(null);
              }}
            />
            <JobMenuRow
              icon={<Trash2 size={20} color={colors.dangerFg} />}
              label="Delete job"
              danger
              onPress={() => {
                const j = menuJob;
                setMenuJob(null);
                // Wait for the sheet to slide away before showing the alert.
                setTimeout(() => confirmDelete(j), 250);
              }}
            />
          </>
        )}
      </Sheet>
    </Screen>
  );
};

const JobMenuRow: React.FC<{ icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean }> = ({
  icon,
  label,
  onPress,
  danger,
}) => {
  const { colors } = useUiStore();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.menuRow, { borderColor: colors.border }]}>
      {icon}
      <Text style={[styles.menuLabel, { color: danger ? colors.dangerFg : colors.ink }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  moreBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  menuLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
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
    fontSize: 22,
    fontWeight: '700',
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
    height: 44,
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
    height: 44,
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
    ...shadows.card,
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
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 1,
  },
});
