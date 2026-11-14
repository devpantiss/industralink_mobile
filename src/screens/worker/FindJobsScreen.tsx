import React, { useState, useMemo } from 'react';
import { GradientFill } from '../../components/ui/GradientFill';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/effects';
import { TRADE_ICON } from '../../lib/tradeIcons';
import { Stagger } from '../../components/ui/Stagger';
import { useTabBarSpace } from '../../components/layout/TabBar';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  BadgeCheck,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronDown,
  Check,
} from '../../components/ui/icons';
import * as Haptics from 'expo-haptics';
import type { WorkerStackParamList } from '../../navigation/types';
import { ErrorState } from '../../components/ui/ErrorState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Hero } from '../../components/ui/Hero';
import { Sheet } from '../../components/ui/Sheet';
import { JobRow } from '../../components/domain/JobRow';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { TRADE_LABEL, SECTOR_LABEL, SHIFT_LABEL } from '../../lib/labels';
import { t } from '../../lib/i18n';
import type { JobForWorker, JobSearchParams, Sector, Shift, Trade } from '../../types';

type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

const QUICK_TRADES: Trade[] = [
  'welder',
  'driver',
  'electrician',
  'fitter',
  'machine_operator',
  'crane_operator',
  'helper',
  'security',
];


export const FindJobsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, theme } = useUiStore();
  const tabSpace = useTabBarSpace();
  const qc = useQueryClient();

  // Filters State
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | ''>('');
  const [selectedSector, setSelectedSector] = useState<Sector | ''>('');
  const [selectedShift, setSelectedShift] = useState<Shift | ''>('');
  const [minPay, setMinPay] = useState<number>(0);
  const [walkInOnly, setWalkInOnly] = useState<boolean>(false);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [foodStay, setFoodStay] = useState<boolean>(false);
  const [sort, setSort] = useState<JobSearchParams['sort']>('newest');

  // UI state
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  // Profile query (for "Near me" city hint)
  const profileQuery = useQuery({
    queryKey: queryKeys.worker.profile,
    queryFn: () => workerApi.getProfile(),
  });
  const homeCity = profileQuery.data?.location?.city;

  const currentFilters: JobSearchParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      city: city.trim() || undefined,
      trade: selectedTrade || undefined,
      sector: selectedSector || undefined,
      shift: selectedShift || undefined,
      minPay: minPay > 0 ? minPay : undefined,
      walkInOnly: walkInOnly ? true : undefined,
      verifiedOnly: verifiedOnly ? true : undefined,
      foodStay: foodStay ? true : undefined,
      sort,
    }),
    [q, city, selectedTrade, selectedSector, selectedShift, minPay, walkInOnly, verifiedOnly, foodStay, sort]
  );

  const activeFilterCount = [
    selectedTrade,
    selectedSector,
    selectedShift,
    minPay > 0,
    walkInOnly,
    verifiedOnly,
    foodStay,
    city,
  ].filter(Boolean).length;

  // Infinite Jobs Query
  const jobsQuery = useInfiniteQuery({
    queryKey: queryKeys.worker.jobs(currentFilters),
    queryFn: ({ pageParam = 1 }) => workerApi.searchJobs({ ...currentFilters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });

  const jobsList = useMemo(
    () => jobsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [jobsQuery.data]
  );
  const totalCount = jobsQuery.data?.pages[0]?.total ?? jobsList.length;

  // Toggle Save Mutation
  const saveMutation = useMutation({
    mutationFn: (job: JobForWorker) => workerApi.toggleSaveJob(job.id, !job.saved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
  });

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQ('');
    setCity('');
    setSelectedTrade('');
    setSelectedSector('');
    setSelectedShift('');
    setMinPay(0);
    setWalkInOnly(false);
    setVerifiedOnly(false);
    setFoodStay(false);
    setSort('newest');
  };

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <FlatList
        keyboardDismissMode="on-drag"
        data={jobsList}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabSpace }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (jobsQuery.hasNextPage && !jobsQuery.isFetchingNextPage) void jobsQuery.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={jobsQuery.isRefetching && !jobsQuery.isFetchingNextPage}
            onRefresh={() => {
              void jobsQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item: j, index }) => (
          <Stagger index={index}>
            <JobRow
              job={j}
              style={styles.row}
              onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}
              onToggleSave={(job) => saveMutation.mutate(job)}
              saving={saveMutation.isPending && saveMutation.variables?.id === j.id}
            />
          </Stagger>
        )}
        ListHeaderComponent={
          <>
        <Hero
          style={styles.hero}
          artHeight={64}
          title={t('Find work near you')}
          subtitle={t('Verified jobs from plants, ports, mines and transport companies. Apply with your profile, no resume needed.')}
        >
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustBadge}>
              <BadgeCheck size={15} color={colors.primary} />
              <Text style={[styles.trustBadgeText, { color: colors.inkSecondary }]}>
                {t('Verified employers')}
              </Text>
            </View>
            <View style={styles.trustBadge}>
              <ShieldCheck size={15} color={colors.primary} />
              <Text style={[styles.trustBadgeText, { color: colors.inkSecondary }]}>
                {t('Always free for workers')}
              </Text>
            </View>
          </View>
        </Hero>

        {/* Floating/Docked Search Card */}
        <View style={[styles.searchDockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Job or skill input */}
          <View style={styles.searchRow}>
            <Search size={18} color={colors.inkMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('Job title, trade or company')}
              placeholderTextColor={colors.inkMuted}
              style={[styles.searchInput, { color: colors.ink }]}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* City input with Near Me shortcut */}
          <View style={styles.searchRow}>
            <MapPin size={18} color={colors.inkMuted} />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={t('City, district or state')}
              placeholderTextColor={colors.inkMuted}
              style={[styles.searchInput, { color: colors.ink }]}
            />
            {homeCity && city !== homeCity && (
              <TouchableOpacity
                onPress={() => setCity(homeCity)}
                style={[styles.nearMeBtn, { backgroundColor: colors.primarySoft }]}
              >
                <Text style={[styles.nearMeBtnText, { color: colors.primary }]}>{t('Near me')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Companies')}
          style={[styles.companiesLink, { borderColor: colors.border, backgroundColor: colors.surface }]}
          accessibilityRole="button"
        >
          <Building2 size={16} color={colors.primary} />
          <Text style={[styles.companiesLinkText, { color: colors.ink }]}>{t('Browse companies')}</Text>
          <ChevronRight size={16} color={colors.inkMuted} />
        </TouchableOpacity>

        {/* Quick Trade Pills Horizontal Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickTradesContainer}
        >
          {QUICK_TRADES.map((tr) => {
            const isSelected = selectedTrade === tr;
            const TradeIcon = TRADE_ICON[tr];
            return (
              <TouchableOpacity
                key={tr}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTrade(isSelected ? '' : tr);
                }}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.tradePill,
                  {
                    backgroundColor: isSelected ? 'transparent' : colors.surface,
                    borderColor: isSelected ? 'transparent' : colors.border,
                  },
                ]}
              >
                {isSelected && (
                  <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                )}
                <TradeIcon size={16} color={isSelected ? '#FFFFFF' : colors.primary} weight={isSelected ? 'fill' : 'duotone'} duotoneOpacity={0.25} />
                <Text
                  style={[
                    styles.tradePillText,
                    { color: isSelected ? '#FFFFFF' : colors.ink, fontWeight: isSelected ? '700' : '600' },
                  ]}
                >
                  {t(TRADE_LABEL[tr])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Bar: Count + Filter Button + Sort Button */}
        <View style={styles.resultsBar}>
          <Text style={[styles.resultsCountText, { color: colors.ink }]}>
            {jobsQuery.isLoading
              ? t('Searching…')
              : totalCount === 1
              ? t('{n} job found', { n: totalCount })
              : t('{n} jobs found', { n: totalCount })}
          </Text>

          <View style={styles.actionsBar}>
            <TouchableOpacity
              onPress={() => setFilterModalOpen(true)}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: activeFilterCount > 0 ? colors.primarySoft : colors.surfaceMuted,
                  borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                },
              ]}
            >
              <SlidersHorizontal
                size={14}
                color={activeFilterCount > 0 ? colors.primary : colors.ink}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: activeFilterCount > 0 ? colors.primary : colors.ink },
                ]}
              >
                {t('Filters')}
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortModalOpen(true)}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.ink }]}>
                {sort === 'pay' ? t('Highest pay') : sort === 'nearest' ? t('Nearest') : t('Newest first')}
              </Text>
              <ChevronDown size={14} color={colors.inkMuted} />
            </TouchableOpacity>
          </View>
        </View>

          </>
        }
        ListEmptyComponent={
          jobsQuery.isLoading ? (
            <ListSkeleton style={{ paddingHorizontal: 16 }} />
          ) : jobsQuery.isError ? (
            <ErrorState onRetry={() => void jobsQuery.refetch()} />
          ) : (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
            <Search size={36} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {t('No jobs found')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.inkSecondary }]}>
              {t('Try removing some filters or searching a nearby city.')}
            </Text>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.clearAllBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}
            >
              <GradientFill />
              <Text style={styles.clearAllBtnText}>{t('Clear filters')}</Text>
            </TouchableOpacity>
          </View>
          )
        }
        ListFooterComponent={
          <>
            {jobsQuery.hasNextPage && (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                disabled={jobsQuery.isFetchingNextPage}
                onPress={() => jobsQuery.fetchNextPage()}
              >
                {jobsQuery.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.ink }]}>{t('Load more jobs')}</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        }
      />

      {/* Filters */}
      <Sheet
        visible={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={t('Filter')}
        footer={
          <View style={styles.sheetFooterRow}>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.clearBtn, { borderColor: colors.borderStrong }]}
            >
              <Text style={[styles.clearBtnText, { color: colors.ink }]}>{t('Clear all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterModalOpen(false)}
              style={[styles.applyFilterBtn, styles.flex1, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyFilterBtnText}>{t('Show {n} jobs', { n: totalCount })}</Text>
            </TouchableOpacity>
          </View>
        }
      >

              {/* Job Type Checkboxes */}
              <View style={styles.filterGroup}>
                <Text style={[styles.groupTitle, { color: colors.ink }]}>{t('Job type')}</Text>
                <FilterCheckbox
                  label={t('Walk-in interview')}
                  checked={walkInOnly}
                  onToggle={() => setWalkInOnly(!walkInOnly)}
                />
                <FilterCheckbox
                  label={t('Verified companies only')}
                  checked={verifiedOnly}
                  onToggle={() => setVerifiedOnly(!verifiedOnly)}
                />
                <FilterCheckbox
                  label={t('Food & stay given')}
                  checked={foodStay}
                  onToggle={() => setFoodStay(!foodStay)}
                />
              </View>

              {/* Min Pay Section */}
              <View style={styles.filterGroup}>
                <Text style={[styles.groupTitle, { color: colors.ink }]}>
                  {t('Minimum pay per month')}
                </Text>
                <View style={styles.payOptionsRow}>
                  {[0, 15000, 20000, 25000].map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setMinPay(p)}
                      style={[
                        styles.payOptionChip,
                        {
                          backgroundColor: minPay === p ? colors.primarySoft : colors.surfaceMuted,
                          borderColor: minPay === p ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.payOptionText,
                          { color: minPay === p ? colors.primary : colors.ink },
                        ]}
                      >
                        {p === 0 ? t('Any') : `₹${p / 1000}k+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Shift Options */}
              <View style={styles.filterGroup}>
                <Text style={[styles.groupTitle, { color: colors.ink }]}>{t('Shift')}</Text>
                <View style={styles.payOptionsRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedShift('')}
                    style={[
                      styles.payOptionChip,
                      {
                        backgroundColor: !selectedShift ? colors.primarySoft : colors.surfaceMuted,
                        borderColor: !selectedShift ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: !selectedShift ? colors.primary : colors.ink, fontWeight: '600' }}>
                      {t('Any')}
                    </Text>
                  </TouchableOpacity>
                  {(['day', 'night', 'rotational'] as Shift[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSelectedShift(s)}
                      style={[
                        styles.payOptionChip,
                        {
                          backgroundColor: selectedShift === s ? colors.primarySoft : colors.surfaceMuted,
                          borderColor: selectedShift === s ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: selectedShift === s ? colors.primary : colors.ink, fontWeight: '600' }}>
                        {t(SHIFT_LABEL[s]).replace(/ shift$/i, '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Industry / Sector */}
              <View style={styles.filterGroup}>
                <Text style={[styles.groupTitle, { color: colors.ink }]}>{t('Industry')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedSector('')}
                    style={[
                      styles.sectorChip,
                      {
                        backgroundColor: !selectedSector ? colors.primary : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: !selectedSector ? '#FFF' : colors.ink, fontWeight: '600' }}>
                      {t('All industries')}
                    </Text>
                  </TouchableOpacity>
                  {(Object.keys(SECTOR_LABEL) as Sector[]).map((sec) => (
                    <TouchableOpacity
                      key={sec}
                      onPress={() => setSelectedSector(sec)}
                      style={[
                        styles.sectorChip,
                        {
                          backgroundColor: selectedSector === sec ? colors.primary : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text style={{ color: selectedSector === sec ? '#FFF' : colors.ink, fontWeight: '600' }}>
                        {t(SECTOR_LABEL[sec])}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
      </Sheet>

      {/* Sort */}
      <Sheet visible={sortModalOpen} onClose={() => setSortModalOpen(false)} title={t('Sort by')} scroll={false}>
        {[
          { key: 'newest' as const, label: t('Newest first') },
          { key: 'pay' as const, label: t('Highest pay') },
          ...(homeCity ? [{ key: 'nearest' as const, label: t('Nearest') }] : []),
        ].map((opt) => {
          const on = sort === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setSort(opt.key);
                setSortModalOpen(false);
              }}
              style={[styles.sortRow, { backgroundColor: on ? colors.primarySoft : 'transparent' }]}
            >
              <Text style={[styles.sortRowText, { color: on ? colors.primary : colors.ink }]}>{opt.label}</Text>
              {on && <Check size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </Sheet>
    </Screen>
  );
};

function FilterCheckbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { colors } = useUiStore();
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.checkboxRow}>
      <View
        style={[
          styles.checkboxSquare,
          {
            borderColor: checked ? colors.primary : colors.borderStrong,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {checked && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
      </View>
      <Text style={[styles.checkboxLabel, { color: checked ? colors.ink : colors.inkSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 48,
  },
  flex1: { flex: 1 },
  companiesLink: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  companiesLinkText: { flex: 1, fontSize: 14, fontWeight: '600' },
  row: { marginHorizontal: 16 },
  sheetFooterRow: { flexDirection: 'row', gap: 10 },
  clearBtn: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 15, fontWeight: '600' },
  // Bottom padding leaves room for the search card that overlaps the banner.
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 0,
    paddingBottom: 22,
  },
  bannerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  bannerTextContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '85%',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchDockCard: {
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  nearMeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  nearMeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickTradesContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 16,
    paddingBottom: 6,
  },
  tradePill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tradePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  resultsCountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptyBox: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearAllBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 10,
  },
  clearAllBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterSheetBody: {
    padding: 20,
    gap: 20,
  },
  filterGroup: {
    gap: 10,
    marginBottom: 22,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  payOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payOptionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  payOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterSheetFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyFilterBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyFilterBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sortCard: {
    margin: 24,
    borderRadius: 16,
    padding: 16,
    alignSelf: 'center',
    width: '80%',
    gap: 6,
  },
  sortCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sortRowText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
});
