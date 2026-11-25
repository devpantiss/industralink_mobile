import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkerStackParamList } from '../../navigation/types';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { JobCard } from '../../components/domain/JobCard';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';
import type { JobForWorker } from '../../types';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { EmptyState } from '../../components/ui/EmptyState';

type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

export const SavedJobsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useUiStore();
  const qc = useQueryClient();

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: queryKeys.worker.saved,
    queryFn: () => workerApi.getSavedJobs(),
  });

  const saveMutation = useMutation({
    mutationFn: (job: JobForWorker) => workerApi.toggleSaveJob(job.id, false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
  });

  const savedList = [...(jobs ?? [])].sort(
    (a, b) => Number(a.status !== 'active') - Number(b.status !== 'active')
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh onRefresh={() => refetch()} />
        }
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('Saved jobs')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
            {t('Jobs you want to look at again.')}
          </Text>
        </View>

        {isLoading ? (
          <ListSkeleton />
        ) : savedList.length === 0 ? (
          <EmptyState
            art="saved"
            title={t('No saved jobs yet')}
            description={t('Tap the bookmark icon on any job to save it here.')}
            action={{ label: t('Find jobs'), onPress: () => navigation.navigate('WorkerTabs', { screen: 'FindJobs' }) }}
          />
        ) : (
          savedList.map((j) => (
            // Unsaved cards fade out and the rest slide up to close the gap.
            <Animated.View key={j.id} exiting={FadeOut.duration(160)} layout={LinearTransition.duration(220)}>
              <JobCard
                job={j}
                onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}
                onToggleSave={(job) => saveMutation.mutate(job)}
                saving={saveMutation.isPending && saveMutation.variables?.id === j.id}
              />
            </Animated.View>
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
  },
  titleBlock: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    marginTop: 3,
  },
});
