import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Search, UserSearch } from 'lucide-react-native';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { CandidateRow } from '../../components/domain/CandidateRow';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';
import type { ApplicationStage } from '../../types';

export const CandidatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useUiStore();

  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState<ApplicationStage | ''>('');

  const { data: candidates, isLoading, isRefetching, refetch } = useQuery({
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
            placeholderTextColor={colors.inkMuted}
            style={[styles.searchInput, { color: colors.ink }]}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')}>
              <Text style={{ color: colors.inkMuted, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stage Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageChipsRow}
        >
          {stages.map((st) => {
            const isSelected = stageFilter === st.key;
            return (
              <TouchableOpacity
                key={st.key}
                onPress={() => setStageFilter(st.key)}
                style={[
                  styles.stageChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceMuted,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stageChipText,
                    { color: isSelected ? '#FFFFFF' : colors.inkSecondary },
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
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
        {isLoading ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
            <UserSearch size={36} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {t('No candidates found')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.inkSecondary }]}>
              {t('Try a different search, or post a job to get applicants.')}
            </Text>
          </View>
        ) : (
          filtered.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              onPress={() => navigation.navigate('CandidateDossier', { candidateId: c.id })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
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
  stageChipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 10,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
