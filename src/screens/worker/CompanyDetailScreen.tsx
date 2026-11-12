import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  ChevronLeft,
  Globe,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import type { WorkerStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { JobCard } from '../../components/domain/JobCard';
import { BannerArt } from '../../components/ui/BannerArt';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { SECTOR_LABEL } from '../../lib/labels';
import { t } from '../../lib/i18n';
import type { JobForWorker } from '../../types';

type RouteProps = RouteProp<WorkerStackParamList, 'CompanyDetail'>;
type NavProps = NativeStackNavigationProp<WorkerStackParamList>;

export const CompanyDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { colors } = useUiStore();
  const qc = useQueryClient();
  const { companyId } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.worker.company(companyId),
    queryFn: () => workerApi.getCompany(companyId),
  });

  const saveMutation = useMutation({
    mutationFn: (job: JobForWorker) => workerApi.toggleSaveJob(job.id, !job.saved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
  });

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.ink }]}>{t('Company not found')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryBtnText}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const { company: c, jobs } = data;

  return (
    <Screen edges={['top']}>
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceMuted }]}
          accessibilityLabel={t('Back')}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.ink }]} numberOfLines={1}>
          {c.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner with BannerArt */}
        <View style={[styles.banner, { backgroundColor: colors.surfaceMuted }]}>
          {/* Full-colour art at its 600x260 shape (banner is 110 tall). */}
          <BannerArt opacity={1} style={{ width: 254 }} />
        </View>

        {/* Company Info Box */}
        <View style={[styles.companyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CompanyLogo
            job={{ companyName: c.name, sector: c.sector, companyLogoUrl: c.logoUrl }}
            size="lg"
            style={styles.floatingLogo}
          />

          <View style={styles.companyTitleRow}>
            <Text style={[styles.companyName, { color: colors.ink }]}>{c.name}</Text>
            {c.verification === 'approved' && (
              <ShieldCheck size={18} color={colors.primary} />
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Briefcase size={14} color={colors.inkSecondary} />
              <Text style={[styles.metaText, { color: colors.inkSecondary }]}>
                {t(SECTOR_LABEL[c.sector])}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.inkSecondary} />
              <Text style={[styles.metaText, { color: colors.inkSecondary }]}>
                {c.location.city}, {c.location.state}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Users size={14} color={colors.inkSecondary} />
              <Text style={[styles.metaText, { color: colors.inkSecondary }]}>
                {c.size} {t('people')}
              </Text>
            </View>

            {c.website && (
              <TouchableOpacity
                onPress={() => Linking.openURL(c.website!)}
                style={styles.metaItem}
              >
                <Globe size={14} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.primary }]}>{c.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          {c.about && (
            <Text style={[styles.aboutText, { color: colors.ink }]}>{c.about}</Text>
          )}

          {c.address && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  `https://maps.google.com/?q=${encodeURIComponent(
                    [c.address, c.location.city, c.location.state].filter(Boolean).join(', ')
                  )}`
                )
              }
              style={[styles.mapsBtn, { borderColor: colors.border }]}
            >
              <MapPin size={14} color={colors.primary} />
              <Text style={[styles.mapsBtnText, { color: colors.primary }]}>
                {c.address} · {t('Open in Maps')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Open Jobs List */}
        <View style={styles.jobsSection}>
          <Text style={[styles.jobsHeading, { color: colors.ink }]}>
            {t('Open jobs')} ({jobs.length})
          </Text>

          {jobs.length === 0 ? (
            <View style={[styles.emptyJobs, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.emptyJobsText, { color: colors.inkMuted }]}>
                {t('No open jobs right now')}
              </Text>
            </View>
          ) : (
            jobs.map((j) => (
              <JobCard
                key={j.id}
                job={j}
                onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}
                onToggleSave={(job) => saveMutation.mutate(job)}
                saving={saveMutation.isPending && saveMutation.variables?.id === j.id}
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  banner: {
    height: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  companyCard: {
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingTop: 18,
  },
  floatingLogo: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  companyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  aboutText: {
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 12,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  mapsBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  jobsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  jobsHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  emptyJobs: {
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyJobsText: {
    fontSize: 14,
  },
});

