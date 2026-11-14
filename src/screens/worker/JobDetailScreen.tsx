import React, { useState } from 'react';
import { HeaderButton } from '../../components/layout/AppHeader';
import { View, StyleSheet, TouchableOpacity, Linking, Share, ActivityIndicator } from 'react-native';
import { Text } from '../../components/ui/Text';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  Share2,
  CalendarClock,
  MapPin,
  Clock,
  Phone,
  Building2,
  ShieldCheck,
  Flag,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
} from '../../components/ui/icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WorkerStackParamList } from '../../navigation/types';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { FONT } from '../../theme/fonts';
import { Screen } from '../../components/layout/Screen';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { BenefitChips, jobTypeText, payShort, walkInWhen } from '../../components/domain/JobBits';
import { ApplyModal, ReportModal } from '../../components/domain/JobActions';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { EXPERIENCE_LABEL, PAY_TYPE_LABEL, SECTOR_LABEL, SHIFT_LABEL } from '../../lib/labels';
import { formatDate, timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { JobForWorker } from '../../types';

type RouteProps = RouteProp<WorkerStackParamList, 'JobDetail'>;
type NavProps = NativeStackNavigationProp<WorkerStackParamList>;

export const JobDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const insets = useSafeAreaInsets();
  // Top bar shows the job title only once the big title has scrolled away.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const barTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [50, 90], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [50, 90], [6, 0], Extrapolation.CLAMP) }],
  }));
  const barLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 24], [0, 1], Extrapolation.CLAMP),
  }));
  const { colors } = useUiStore();
  const qc = useQueryClient();
  const { jobId } = route.params;

  const [activeTab, setActiveTab] = useState<'description' | 'company'>('description');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Job Query
  const { data: job, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.worker.job(jobId),
    queryFn: () => workerApi.getJob(jobId),
  });

  // Company Details Query (for Company Tab)
  const { data: companyData } = useQuery({
    queryKey: queryKeys.worker.company(job?.companyId || ''),
    queryFn: () => workerApi.getCompany(job!.companyId),
    enabled: !!job?.companyId && activeTab === 'company',
  });

  // Save Job Mutation
  const saveMutation = useMutation({
    mutationFn: (j: JobForWorker) => workerApi.toggleSaveJob(j.id, !j.saved),
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

  if (isError || !job) {
    return (
      <Screen edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.ink }]}>{t('Job not found')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryBtnText}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const closed = job.status !== 'active' || (!!job.deadline && new Date(job.deadline) < new Date());
  const pay = payShort(job);
  const place = [job.siteName, job.address, job.location.city, job.location.state, job.pincode].filter(Boolean).join(', ');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${job.title} at ${job.companyName}, ${job.location.city}. Apply on IndustriaLink!`,
      });
    } catch {
      // Ignored
    }
  };

  const handleToggleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveMutation.mutate(job);
  };

  return (
    <Screen edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.canvas }]}>
        <Animated.View style={[styles.topBarLine, { backgroundColor: colors.border }, barLineStyle]} />
        <HeaderButton label={t('Back')} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.ink} weight="bold" />
        </HeaderButton>
        <Animated.Text style={[styles.navBarTitle, { color: colors.ink }, barTitleStyle]} numberOfLines={1}>
          {job.title}
        </Animated.Text>
        <View style={styles.navActions}>
          <HeaderButton label={t('Share job')} onPress={handleShare}>
            <Share2 size={19} color={colors.ink} />
          </HeaderButton>
          <HeaderButton label={job.saved ? t('Remove from saved') : t('Save job')} onPress={handleToggleSave}>
            <Bookmark size={19} color={job.saved ? colors.primary : colors.ink} weight={job.saved ? 'fill' : 'regular'} />
          </HeaderButton>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <CompanyLogo job={job} size="lg" />
          <View style={{ flex: 1 }}>
            <View style={styles.companyRow}>
              <Text style={[styles.companyName, { color: colors.inkSecondary }]}>
                {job.companyName}
              </Text>
              {job.companyVerified && <ShieldCheck size={16} color={colors.primary} />}
            </View>
            <Text style={[styles.title, { color: colors.ink }]}>{job.title}</Text>
            <Text style={[styles.metaText, { color: colors.inkMuted }]}>
              {job.siteName ? `${job.siteName}, ` : ''}{job.location.city}, {job.location.state} · {t('Posted {when}', { when: timeAgo(job.postedAt) })}
            </Text>
          </View>
        </View>

        {/* 4 Pastel Fact Tiles (2x2 Grid) */}
        <View style={styles.tilesGrid}>
          {/* Salary Tile */}
          <View style={[styles.tile, { backgroundColor: colors.tiles.green.bg }]}>
            <Text style={[styles.tileLabel, { color: colors.tiles.green.text }]}>
              {job.payType && pay ? `${t('Salary')} · ${t(PAY_TYPE_LABEL[job.payType])}` : t('Salary')}
            </Text>
            <Text style={[styles.tileValue, { color: colors.tiles.green.text }]} numberOfLines={1}>
              {pay ? `${pay.range} ${pay.per}` : t('Not shown')}
            </Text>
          </View>

          {/* Shift Tile */}
          <View style={[styles.tile, { backgroundColor: colors.tiles.blue.bg }]}>
            <Text style={[styles.tileLabel, { color: colors.tiles.blue.text }]}>{t('Shift')}</Text>
            <Text style={[styles.tileValue, { color: colors.tiles.blue.text }]} numberOfLines={1}>
              {t(SHIFT_LABEL[job.shift]).replace(/ shift$/i, '')}
            </Text>
          </View>

          {/* Openings Tile */}
          <View style={[styles.tile, { backgroundColor: colors.tiles.orange.bg }]}>
            <Text style={[styles.tileLabel, { color: colors.tiles.orange.text }]}>{t('Openings')}</Text>
            <Text style={[styles.tileValue, { color: colors.tiles.orange.text }]} numberOfLines={1}>
              {job.openings} ({t('{n} applied', { n: job.applicantsCount })})
            </Text>
          </View>

          {/* Experience Tile */}
          <View style={[styles.tile, { backgroundColor: colors.tiles.purple.bg }]}>
            <Text style={[styles.tileLabel, { color: colors.tiles.purple.text }]}>{t('Experience')}</Text>
            <Text style={[styles.tileValue, { color: colors.tiles.purple.text }]} numberOfLines={1}>
              {t(EXPERIENCE_LABEL[job.experience])}
            </Text>
          </View>
        </View>

        <SegmentedTabs
          style={styles.tabsRow}
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'description', label: t('Description') },
            { key: 'company', label: t('Company') },
          ]}
        />

        {/* Tab 1: Description Content */}
        {activeTab === 'description' ? (
          <View style={styles.tabContent}>
            {/* Walk-in Interview Box if Present */}
            {job.jobType === 'walk_in' && job.walkIn && (
              <View style={[styles.walkInCard, { backgroundColor: colors.tiles.purple.bg }]}>
                <CalendarClock size={20} color={colors.tiles.purple.text} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.walkInTitle, { color: colors.tiles.purple.text }]}>
                    {t('Walk-in interview')}
                  </Text>
                  <Text style={[styles.walkInText, { color: colors.tiles.purple.text }]}>
                    {walkInWhen(job.walkIn)} · {job.walkIn.address}
                  </Text>
                  {job.walkIn.contactPerson && (
                    <Text style={[styles.walkInText, { color: colors.tiles.purple.text }]}>
                      {t('Ask for')}: {job.walkIn.contactPerson}
                    </Text>
                  )}
                  {job.walkIn.bring && (
                    <Text style={[styles.walkInText, { color: colors.tiles.purple.text }]}>
                      {t('Bring')}: {job.walkIn.bring}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.walkIn!.address)}`)
                    }
                  >
                    <Text style={[styles.mapLinkText, { color: colors.tiles.purple.text }]}>
                      {t('Open in Maps')} →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Job Description List */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  {t('Job description')}
                </Text>
                {job.responsibilities.map((r, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={[styles.bulletPoint, { color: colors.inkMuted }]}>•</Text>
                    <Text style={[styles.bulletBody, { color: colors.inkSecondary }]}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Requirements & Qualifications */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                {t('Requirements')}
              </Text>
              {job.requirements?.map((req, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletPoint, { color: colors.inkMuted }]}>•</Text>
                  <Text style={[styles.bulletBody, { color: colors.inkSecondary }]}>{req}</Text>
                </View>
              ))}
              {job.qualifications?.length > 0 && (
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletPoint, { color: colors.inkMuted }]}>•</Text>
                  <Text style={[styles.bulletBody, { color: colors.inkSecondary }]}>
                    {t('Qualification')}: {job.qualifications.join(', ')}
                  </Text>
                </View>
              )}
              {job.licences && job.licences.length > 0 && (
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletPoint, { color: colors.inkMuted }]}>•</Text>
                  <Text style={[styles.bulletBody, { color: colors.inkSecondary }]}>
                    {t('Licence needed')}: {job.licences.join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Facilities / Benefits Chips */}
            {job.benefits && job.benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  {t('Facilities & Benefits')}
                </Text>
                <BenefitChips benefits={job.benefits} />
              </View>
            )}

            {/* Key Facts Cards */}
            <View style={styles.factsGrid}>
              <FactCard
                icon={MapPin}
                label={t('Work location')}
                value={place}
                link={
                  job.address
                    ? {
                        label: t('Open in Maps'),
                        url: `https://maps.google.com/?q=${encodeURIComponent(place)}`,
                      }
                    : undefined
                }
              />
              <FactCard icon={Building2} label={t('Job type')} value={jobTypeText(job)} />
              {job.workHours && (
                <FactCard icon={Clock} label={t('Working hours')} value={job.workHours} />
              )}
              {job.deadline && (
                <FactCard
                  icon={CalendarClock}
                  label={t('Last date to apply')}
                  value={formatDate(job.deadline)}
                />
              )}
              <FactCard
                icon={Phone}
                label={t('HR contact')}
                value={
                  job.allowCalls
                    ? `${t("After you're shortlisted")}${job.callHours ? ` · ${job.callHours}` : ''}`
                    : t("The employer will contact you if you're shortlisted.")
                }
              />
            </View>
          </View>
        ) : (
          /* Tab 2: Company Content */
          <View style={styles.tabContent}>
            {companyData ? (
              <>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                    {t('About {company}', { company: companyData.company.name })}
                  </Text>
                  <Text style={[styles.aboutText, { color: colors.inkSecondary }]}>
                    {companyData.company.about || t("This company hasn't added a description yet.")}
                  </Text>
                </View>

                {/* Company Facts Grid */}
                <View style={styles.companyFactsGrid}>
                  <View style={[styles.coFactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.coFactLabel, { color: colors.inkMuted }]}>{t('Industry')}</Text>
                    <Text style={[styles.coFactValue, { color: colors.ink }]}>
                      {t(SECTOR_LABEL[companyData.company.sector])}
                    </Text>
                  </View>

                  <View style={[styles.coFactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.coFactLabel, { color: colors.inkMuted }]}>{t('Workers')}</Text>
                    <Text style={[styles.coFactValue, { color: colors.ink }]}>
                      {companyData.company.size} people
                    </Text>
                  </View>

                  <View style={[styles.coFactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.coFactLabel, { color: colors.inkMuted }]}>{t('Location')}</Text>
                    <Text style={[styles.coFactValue, { color: colors.ink }]}>
                      {companyData.company.location.city}, {companyData.company.location.state}
                    </Text>
                  </View>

                  <View style={[styles.coFactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.coFactLabel, { color: colors.inkMuted }]}>{t('Verified')}</Text>
                    <Text style={[styles.coFactValue, { color: colors.successFg }]}>
                      ✓ {t('Verified by IndustriaLink')}
                    </Text>
                  </View>
                </View>

                {/* More Jobs at this Company */}
                {companyData.jobs.length > 1 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                      {t('More jobs here')}
                    </Text>
                    {companyData.jobs
                      .filter((o) => o.id !== job.id)
                      .slice(0, 3)
                      .map((o) => {
                        const oPay = payShort(o);
                        return (
                          <TouchableOpacity
                            key={o.id}
                            onPress={() => navigation.push('JobDetail', { jobId: o.id })}
                            style={[styles.otherJobRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          >
                            <CompanyLogo job={o} size="sm" />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.otherJobTitle, { color: colors.ink }]} numberOfLines={1}>
                                {o.title}
                              </Text>
                              <Text style={[styles.otherJobSubtitle, { color: colors.inkMuted }]}>
                                {oPay ? `${oPay.range} ${oPay.per}` : t('Pay not shown')} · {t(SHIFT_LABEL[o.shift])}
                              </Text>
                            </View>
                            <ArrowRight size={16} color={colors.inkMuted} />
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                )}
              </>
            ) : (
              <ActivityIndicator color={colors.primary} />
            )}
          </View>
        )}

        {/* Safety Disclaimer and Report Link */}
        <View style={styles.safetyBox}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={[styles.safetyText, { color: colors.inkMuted }]}>
            {t('IndustriaLink never asks for money.')} {t("Don't pay anyone for a job or registration.")}
          </Text>
          <TouchableOpacity onPress={() => setReportModalOpen(true)} style={styles.reportBtn}>
            <Flag size={13} color={colors.inkSecondary} />
            <Text style={[styles.reportBtnText, { color: colors.inkSecondary }]}>
              {t('Report job')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {closed ? (
          <View style={[styles.closedBar, { backgroundColor: colors.surfaceStrong }]}>
            <Text style={[styles.closedText, { color: colors.inkMuted }]}>
              {t('This job is closed')}
            </Text>
          </View>
        ) : job.appliedApplicationId ? (
          <TouchableOpacity
            style={[styles.trackBtn, { backgroundColor: colors.successBg }]}
            onPress={() => navigation.navigate('ApplicationDetail', { applicationId: job.appliedApplicationId! })}
          >
            <CheckCircle2 size={18} color={colors.successFg} />
            <Text style={[styles.trackBtnText, { color: colors.successFg }]}>
              {t('Applied · Track it')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => setApplyModalOpen(true)}
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyBtnText}>{t('Apply now')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
            accessibilityLabel={t('Share on WhatsApp')}
              style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <MessageCircle size={20} color="#1FA855" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Apply Modal */}
      <ApplyModal
        visible={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        jobId={job.id}
        title={`${job.title} – ${job.companyName}`}
        onTrackApplication={(appId) => navigation.navigate('ApplicationDetail', { applicationId: appId })}
      />

      {/* Report Modal */}
      <ReportModal
        visible={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        jobId={job.id}
      />
    </Screen>
  );
};

function FactCard({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: any;
  label: string;
  value: string;
  link?: { label: string; url: string };
}) {
  const { colors } = useUiStore();
  return (
    <View style={[styles.factCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.factIconBox, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={16} color={colors.inkSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.factLabel, { color: colors.inkMuted }]}>{label}</Text>
        <Text style={[styles.factValue, { color: colors.ink }]}>{value}</Text>
        {link && (
          <TouchableOpacity onPress={() => Linking.openURL(link.url)} style={{ marginTop: 2 }}>
            <Text style={[styles.factLink, { color: colors.primary }]}>{link.label} →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

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
    gap: 10,
  },
  topBarLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  navBarTitle: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: '700',
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  metaText: {
    fontSize: 12,
    marginTop: 4,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    opacity: 0.85,
  },
  tileValue: {
    fontSize: 15.5,
    fontWeight: '700',
    marginTop: 2,
  },
  tabsRow: {
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabContent: {
    gap: 18,
  },
  walkInCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  walkInTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  walkInText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  mapLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 18,
  },
  bulletBody: {
    fontSize: 13.5,
    lineHeight: 19,
    flex: 1,
  },
  factsGrid: {
    gap: 8,
  },
  factCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  factIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factLabel: {
    fontSize: 11.5,
  },
  factValue: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 1,
  },
  factLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  companyFactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coFactCard: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  coFactLabel: {
    fontSize: 11.5,
  },
  coFactValue: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  otherJobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  otherJobTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  otherJobSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  safetyBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  safetyText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  applyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  closedBar: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
