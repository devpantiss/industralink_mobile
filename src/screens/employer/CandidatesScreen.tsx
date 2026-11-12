import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, UserSearch } from 'lucide-react-native';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import {
  EXPERIENCE_LABEL,
  STAGE_LABEL,
  TRADE_LABEL,
} from '../../lib/labels';
import { timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { ApplicationStage, Candidate } from '../../types';

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
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
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
            <CandidateRowItem
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

function CandidateRowItem({
  candidate: c,
  onPress,
}: {
  candidate: Candidate;
  onPress: () => void;
}) {
  const { colors } = useUiStore();
  const w = c.worker;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.rowItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Avatar name={w.name} src={w.photoUrl} size="md" />

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.workerName, { color: colors.ink }]} numberOfLines={1}>
          {w.name}
        </Text>
        <Text style={[styles.workerMeta, { color: colors.inkSecondary }]} numberOfLines={1}>
          {w.trade ? TRADE_LABEL[w.trade] : '—'} · {w.experience ? EXPERIENCE_LABEL[w.experience] : '—'} · {w.location?.city ?? '—'}
        </Text>

        {/* Qualification & Licence Badges */}
        <View style={styles.badgeWrap}>
          {w.qualifications.map((q) => (
            <View key={q} style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{q}</Text>
            </View>
          ))}
          {w.licences.map((lic) => (
            <View key={lic} style={[styles.badge, { backgroundColor: colors.tiles.yellow.bg }]}>
              <Text style={[styles.badgeText, { color: colors.tiles.yellow.text }]}>{lic}</Text>
            </View>
          ))}
        </View>

        {/* Applied Job title + Stage */}
        <View style={styles.appliedJobRow}>
          <Text style={[styles.appliedJobText, { color: colors.inkMuted }]} numberOfLines={1}>
            {c.jobTitle}
          </Text>
          <View
            style={[
              styles.stageBadge,
              {
                backgroundColor:
                  c.stage === 'interview'
                    ? colors.tiles.purple.bg
                    : c.stage === 'offer' || c.stage === 'hired'
                    ? colors.tiles.green.bg
                    : c.stage === 'shortlisted'
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
                    c.stage === 'interview'
                      ? colors.tiles.purple.text
                      : c.stage === 'offer' || c.stage === 'hired'
                      ? colors.tiles.green.text
                      : c.stage === 'shortlisted'
                      ? colors.primary
                      : colors.inkSecondary,
                },
              ]}
            >
              {STAGE_LABEL[c.stage]}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 }}>
        <Text style={[styles.timeAgo, { color: colors.inkMuted }]}>{timeAgo(c.updatedAt)}</Text>
        <ChevronRight size={18} color={colors.inkMuted} />
      </View>
    </TouchableOpacity>
  );
}

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
  rowItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  workerMeta: {
    fontSize: 12.5,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appliedJobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  appliedJobText: {
    fontSize: 12,
    flex: 1,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 11,
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
