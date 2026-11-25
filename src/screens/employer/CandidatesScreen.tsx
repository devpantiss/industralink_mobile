import React, { useState, useMemo } from 'react';
import { useTabBarSpace } from '../../components/layout/TabBar';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from '../../components/ui/icons';
import { ErrorState } from '../../components/ui/ErrorState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { CandidateRow } from '../../components/domain/CandidateRow';
import { FilterChips } from '../../components/ui/FilterChips';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';
import { RejectSheet } from '../../components/domain/PipelineSheets';
import { Button } from '../../components/ui/Button';
import { errorText } from '../../lib/errors';
import type { ApplicationStage } from '../../types';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { EmptyState } from '../../components/ui/EmptyState';

export const CandidatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useUiStore();
  const tabSpace = useTabBarSpace();

  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState<ApplicationStage | ''>('');
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  const { data: candidates, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.employer.allCandidates({ stage: stageFilter || undefined }),
    queryFn: () => employerApi.getAllCandidates({ stage: stageFilter || undefined }),
  });

  const filtered = useMemo(() => {
    const list = candidates ?? [];
    const search = q.trim().toLowerCase();
    if (!search) return list;
    return list.filter((c) =>
      `${c.worker.name} ${c.worker.location?.city ?? ''} ${c.worker.skills.join(' ')} ${c.worker.licences.join(' ')} ${c.jobTitle}`
        .toLowerCase()
        .includes(search)
    );
  }, [candidates, q]);

  const byId = new Map((candidates ?? []).map((c) => [c.id, c]));
  const canShortlist = picked.filter((id) => byId.get(id)?.stage === 'applied');
  const canReject = picked.filter((id) => ['applied', 'shortlisted', 'interview', 'offer'].includes(byId.get(id)?.stage ?? ''));

  const bulk = useMutation({
    mutationFn: async ({ ids, stage, payload }: { ids: string[]; stage: ApplicationStage; payload?: unknown }) => {
      const results = await Promise.allSettled(ids.map((id) => employerApi.updateStage(id, stage, payload)));
      const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      return { done: ids.length - failed.length, failed: failed.length, first: failed[0]?.reason };
    },
    onSuccess: ({ done, failed, first }) => {
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      setRejecting(false);
      setPicked([]);
      setSelecting(false);
      showToast(failed ? `${done} updated, ${failed} failed. ${errorText(first, '')}` : t('{n} candidates updated', { n: done }), failed ? 'warning' : 'success');
    },
    onError: (e) => showToast(errorText(e, 'Could not update. Try again.'), 'error'),
  });

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const stages: { key: '' | ApplicationStage; label: string }[] = [
    { key: '', label: t('All stages') },
    { key: 'applied', label: t('New') },
    { key: 'shortlisted', label: t('Shortlisted') },
    { key: 'interview', label: t('Interview') },
    { key: 'offer', label: t('Offer') },
    { key: 'hired', label: t('Hired') },
    { key: 'rejected', label: t('Rejected') },
  ];

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <View style={styles.topContainer}>
        {/* Page Title */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('Candidates')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
            {t('Everyone who applied to your jobs. Tap to see their resume and documents.')}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('Name, city, skill, licence…')}
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.ink }]}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')}>
              <Text style={{ color: colors.inkMuted, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stage filter */}
        <FilterChips<'' | ApplicationStage> options={stages} value={stageFilter} onChange={setStageFilter} style={styles.stageChipsRow} />
        <View style={styles.toolRow}>
          <Text style={[styles.sortNote, { color: colors.inkMuted }]}>{t('Newest first')}</Text>
          <TouchableOpacity
            onPress={() => {
              setSelecting(!selecting);
              setPicked([]);
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{selecting ? t('Cancel') : t('Select')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        keyboardDismissMode="on-drag"
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabSpace }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <PullToRefresh onRefresh={() => refetch()} />
        }
        renderItem={({ item: c }) => (
          <CandidateRow
            candidate={c}
            selecting={selecting ? { selected: picked.includes(c.id) } : undefined}
            onPress={() => (selecting ? toggle(c.id) : navigation.navigate('CandidateDossier', { candidateId: c.id }))}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              art="people"
              title={t('No candidates found')}
              description={t('Try a different search, or post a job to get applicants.')}
            />
          )
        }
      />

      {selecting && picked.length > 0 ? (
        <View style={[styles.bulkBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={{ color: colors.inkSecondary, fontSize: 13, marginBottom: 8 }}>{t('{n} selected', { n: picked.length })}</Text>
          <View style={styles.bulkRow}>
            <Button
              label={`${t('Shortlist')} (${canShortlist.length})`}
              onPress={() => bulk.mutate({ ids: canShortlist, stage: 'shortlisted' })}
              disabled={canShortlist.length === 0}
              loading={bulk.isPending && !rejecting}
              style={{ flex: 1 }}
            />
            <Button label={`${t('Reject')} (${canReject.length})`} variant="outline" onPress={() => setRejecting(true)} disabled={canReject.length === 0} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}

      <RejectSheet
        key={`bulk${rejecting}`}
        visible={rejecting}
        onClose={() => setRejecting(false)}
        loading={bulk.isPending}
        title={t('Reject {n} candidates?', { n: canReject.length })}
        onSubmit={(payload) => bulk.mutate({ ids: canReject, stage: 'rejected', payload })}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  sortNote: { fontSize: 13, fontWeight: '600', flex: 1 },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
  },
  searchBar: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bulkBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
  bulkRow: { flexDirection: 'row', gap: 12 },
  stageChipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 10,
  },
});
