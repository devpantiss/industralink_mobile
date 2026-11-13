import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, ChevronRight, Search, Building2 } from 'lucide-react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { FilterChips } from '../../components/ui/FilterChips';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { SECTOR_LABEL } from '../../lib/labels';
import { t } from '../../lib/i18n';
import type { WorkerStackParamList } from '../../navigation/types';
import type { Sector } from '../../types';

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

/** Verified companies that are hiring (web: Companies). */
export const CompaniesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const colors = useUiStore((s) => s.colors);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState<Sector | 'all'>('all');

  const params = { q: q.trim() || undefined, sector: sector === 'all' ? undefined : sector };
  const query = useQuery({
    queryKey: queryKeys.worker.companies(params),
    queryFn: () => workerApi.listCompanies(params),
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t('Companies')} showBack />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(r) => r.company.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={18} color={colors.inkMuted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={t('Company name or city')}
                placeholderTextColor={colors.inkMuted}
                style={[styles.searchInput, { color: colors.ink }]}
                returnKeyType="search"
              />
            </View>
            <FilterChips
              value={sector}
              onChange={setSector}
              style={styles.chips}
              options={[
                { key: 'all', label: t('All') },
                ...(Object.keys(SECTOR_LABEL) as Sector[]).map((k) => ({ key: k, label: t(SECTOR_LABEL[k]) })),
              ]}
            />
          </View>
        }
        renderItem={({ item: { company, openJobs } }) => (
          <Pressable
            onPress={() => navigation.navigate('CompanyDetail', { companyId: company.id })}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
          >
            <CompanyLogo job={{ companyName: company.name, sector: company.sector, companyLogoUrl: company.logoUrl }} size="md" />
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                  {company.name}
                </Text>
                <BadgeCheck size={15} color={colors.primary} />
              </View>
              <Text style={[styles.meta, { color: colors.inkSecondary }]} numberOfLines={1}>
                {t(SECTOR_LABEL[company.sector])} · {company.location.city}
              </Text>
              <Text style={[styles.jobs, { color: openJobs > 0 ? colors.successFg : colors.inkMuted }]}>
                {openJobs === 1 ? t('{n} open job', { n: openJobs }) : t('{n} open jobs', { n: openJobs })}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.inkMuted} />
          </Pressable>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <ListSkeleton />
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
              <Building2 size={36} color={colors.inkMuted} />
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>{t('No companies found')}</Text>
            </View>
          )
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  header: { gap: 10, paddingBottom: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 15 },
  chips: { paddingHorizontal: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { fontSize: 13, marginTop: 2 },
  jobs: { fontSize: 12.5, fontWeight: '700', marginTop: 4 },
  empty: { margin: 16, padding: 28, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});
