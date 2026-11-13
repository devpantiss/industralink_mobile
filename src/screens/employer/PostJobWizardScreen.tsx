import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ArrowRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { JobCard } from '../../components/domain/JobCard';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  BENEFIT_LABEL,
  EXPERIENCE_LABEL,
  JOB_TYPE_LABEL,
  QUALIFICATIONS,
  SHIFT_LABEL,
  TRADE_LABEL,
} from '../../lib/labels';
import { t } from '../../lib/i18n';
import type { Benefit, ExperienceBand, JobInput, JobType, Shift, Trade } from '../../types';

const TEMPLATES: Partial<Record<Trade, Partial<JobInput>>> = {
  welder: {
    title: 'Welder (ITI)',
    qualifications: ['ITI'],
    payMin: 18000,
    payMax: 22000,
    benefits: ['food', 'pf_esi'],
    responsibilities: ['Arc / MIG welding as per drawing', 'Gas cutting and grinding', 'Follow safety permits'],
    requirements: ['ITI in Welder trade', '1+ year experience'],
  },
  driver: {
    title: 'Truck Driver (HMV)',
    payMin: 22000,
    payMax: 26000,
    benefits: ['food', 'overtime'],
    responsibilities: ['Drive company trucks on given routes', 'Daily vehicle check'],
    requirements: ['Valid HMV licence', '3+ years driving experience'],
  },
  electrician: {
    title: 'Electrician (ITI)',
    qualifications: ['ITI'],
    payMin: 20000,
    payMax: 25000,
    benefits: ['pf_esi'],
    responsibilities: ['Maintain plant wiring and panels', 'Fault finding'],
    requirements: ['ITI Electrician', 'Wireman licence preferred'],
  },
  helper: {
    title: 'Helper',
    payMin: 550,
    payMax: 600,
    payPeriod: 'day',
    experience: 'fresher',
    benefits: ['food'],
    responsibilities: ['Loading and unloading', 'Housekeeping'],
    requirements: ['Physically fit'],
  },
  fitter: {
    title: 'Fitter (ITI)',
    qualifications: ['ITI'],
    payMin: 17000,
    payMax: 21000,
    benefits: ['pf_esi'],
    responsibilities: ['Fitting and maintenance of machines'],
    requirements: ['ITI Fitter'],
  },
};

const STEPS = ['Basics', 'Pay & requirements', 'Review'];

export const PostJobWizardScreen: React.FC = () => {
  const navigation = useNavigation();
  const jobId = (useRoute().params as { jobId?: string } | undefined)?.jobId;
  const editing = !!jobId;
  const { colors, showToast } = useUiStore();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);

  // Form State
  const [f, setF] = useState<JobInput>({
    title: '',
    trade: 'welder',
    sector: 'metals',
    siteName: '',
    location: { city: 'Kalinganagar', state: 'Odisha' },
    payMin: 18000,
    payMax: 22000,
    payPeriod: 'month',
    payType: 'in_hand',
    shift: 'day',
    jobType: 'full_time',
    openings: 5,
    experience: '1_2',
    qualifications: ['ITI'],
    licences: [],
    benefits: ['food', 'pf_esi'],
    responsibilities: ['Arc and MIG welding as per engineering drawing'],
    requirements: ['ITI Welder trade certificate'],
    status: 'active',
    hrPhone: user?.phone || '9876543210',
    allowCalls: true,
  });

  const [walkInDate, setWalkInDate] = useState('2026-11-20');
  const [walkInAddress, setWalkInAddress] = useState('Gate 3, Industrial Estate, Kalinganagar');
  const [walkInContact, setWalkInContact] = useState('Mr. Sharma (HR)');
  const [noFeeConfirmed, setNoFeeConfirmed] = useState(false);

  // Editing: load the saved job once and fill the form with it.
  const existing = useQuery({
    queryKey: queryKeys.employer.job(jobId ?? ''),
    queryFn: () => employerApi.getJob(jobId!),
    enabled: editing,
  });
  const [prefilled, setPrefilled] = useState(false);
  // Fill the form once the saved job arrives (state set during render, guarded so it runs once).
  if (existing.data && !prefilled) {
    const j = existing.data;
    setPrefilled(true);
    setF((prev) => ({ ...prev, ...(j as unknown as JobInput) }));
    if (j.walkIn) {
      setWalkInDate(j.walkIn.date);
      setWalkInAddress(j.walkIn.address);
      setWalkInContact(j.walkIn.contactPerson ?? '');
    }
    setNoFeeConfirmed(true); // they already confirmed this when they first posted it
  }

  const applyTemplate = (tKey: Trade) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tmpl = TEMPLATES[tKey];
    if (tmpl) {
      setF((prev) => ({
        ...prev,
        trade: tKey,
        ...tmpl,
      }));
    }
  };

  const createMutation = useMutation({
    mutationFn: (status: 'active' | 'draft') => {
      // Saving an active or closed job keeps its status; only drafts change when published.
      const keep = editing && existing.data && existing.data.status !== 'draft' ? existing.data.status : status;
      const payload: JobInput = {
        ...f,
        status: keep,
        walkIn:
          f.jobType === 'walk_in'
            ? {
                date: walkInDate,
                address: walkInAddress,
                contactPerson: walkInContact,
              }
            : undefined,
      };
      return editing ? employerApi.updateJob(jobId!, payload) : employerApi.createJob(payload);
    },
    onSuccess: (_data, status) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      qc.invalidateQueries({ queryKey: queryKeys.jobs() });
      showToast(
        editing ? t('Changes saved') : status === 'active' ? t('Job published! Workers can see it now.') : t('Saved as draft'),
        'success'
      );
      navigation.goBack();
    },
  });

  const handleNext = () => {
    if (step === 0) {
      if (!f.title.trim()) {
        showToast(t('Enter a job title'), 'warning');
        return;
      }
      if (!f.location.city.trim()) {
        showToast(t('Enter work site city'), 'warning');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!f.payMin && !f.payMax) {
        showToast(t('Please add the pay range'), 'warning');
        return;
      }
      setStep(2);
    }
  };

  const previewJob = {
    ...f,
    id: 'preview',
    companyId: user?.companyId || 'comp-1',
    companyName: user?.companyName || 'National Heavy Engineering',
    companyVerified: true,
    postedAt: new Date().toISOString(),
    applicantsCount: 0,
    newApplicantsCount: 0,
    saved: false,
    status: 'active' as const,
  };

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
          accessibilityLabel="Back"
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.ink }]}>{editing ? t('Edit job') : t('Post a job')}</Text>
      </View>

      {/* Stepper Header */}
      <View style={[styles.stepperWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <View key={s} style={styles.stepHeaderItem}>
              <View
                style={[
                  styles.stepBadge,
                  {
                    backgroundColor: done ? colors.primary : active ? colors.primarySoft : colors.surfaceMuted,
                    borderColor: active ? colors.primary : 'transparent',
                    borderWidth: active ? 1.5 : 0,
                  },
                ]}
              >
                {done ? (
                  <Check size={12} color="#FFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={{
                      color: active ? colors.primary : colors.inkMuted,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepHeaderText,
                  { color: active ? colors.ink : colors.inkMuted, fontWeight: active ? '700' : '500' },
                ]}
              >
                {s}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 0: Basics */}
        {step === 0 && (
          <View style={styles.stepBody}>
            {/* Quick Templates Strip */}
            <View style={[styles.templatesBox, { borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={16} color={colors.accent} />
                <Text style={[styles.templatesHeading, { color: colors.ink }]}>
                  {t('Start from a template')}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(Object.keys(TEMPLATES) as Trade[]).map((tKey) => {
                  const isSelected = f.trade === tKey && f.title === TEMPLATES[tKey]!.title;
                  return (
                    <TouchableOpacity
                      key={tKey}
                      onPress={() => applyTemplate(tKey)}
                      style={[
                        styles.templateChip,
                        {
                          backgroundColor: isSelected ? colors.primarySoft : colors.surfaceMuted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.templateChipText,
                          { color: isSelected ? colors.primary : colors.ink },
                        ]}
                      >
                        {TRADE_LABEL[tKey]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Job Title */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Job title')} *</Text>
              <TextInput
                value={f.title}
                onChangeText={(text) => setF({ ...f, title: text })}
                placeholder="e.g. Welder (ITI)"
                placeholderTextColor={colors.inkMuted}
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
              />
            </View>

            {/* Trade Selection */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Trade')} *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(Object.keys(TRADE_LABEL) as Trade[]).map((tr) => (
                  <TouchableOpacity
                    key={tr}
                    onPress={() => setF({ ...f, trade: tr })}
                    style={[
                      styles.pillOption,
                      {
                        backgroundColor: f.trade === tr ? colors.primary : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: f.trade === tr ? '#FFF' : colors.ink, fontWeight: '600', fontSize: 13 }}>
                      {TRADE_LABEL[tr]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Openings & Site */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Openings')} *</Text>
                <TextInput
                  value={String(f.openings)}
                  onChangeText={(val) => setF({ ...f, openings: parseInt(val, 10) || 1 })}
                  keyboardType="numeric"
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
              </View>

              <View style={[styles.field, { flex: 1.5 }]}>
                <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Site / Plant name')}</Text>
                <TextInput
                  value={f.siteName || ''}
                  onChangeText={(val) => setF({ ...f, siteName: val })}
                  placeholder="e.g. Plant 2"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
              </View>
            </View>

            {/* Location City & State */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Work site city')} *</Text>
                <TextInput
                  value={f.location.city}
                  onChangeText={(val) => setF({ ...f, location: { ...f.location, city: val } })}
                  placeholder="e.g. Kalinganagar"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('State')}</Text>
                <TextInput
                  value={f.location.state}
                  onChangeText={(val) => setF({ ...f, location: { ...f.location, state: val } })}
                  placeholder="e.g. Odisha"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
              </View>
            </View>

            {/* Job Type */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Job type')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['full_time', 'contract', 'walk_in'] as JobType[]).map((jt) => (
                  <TouchableOpacity
                    key={jt}
                    onPress={() => setF({ ...f, jobType: jt })}
                    style={[
                      styles.pillOption,
                      {
                        backgroundColor: f.jobType === jt ? colors.primary : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: f.jobType === jt ? '#FFF' : colors.ink, fontWeight: '600', fontSize: 13 }}>
                      {JOB_TYPE_LABEL[jt]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Walk-in Fields if walk_in selected */}
            {f.jobType === 'walk_in' && (
              <View style={[styles.walkInFormBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.tiles.purple.text }]}>
                <Text style={[styles.fieldLabel, { color: colors.tiles.purple.text }]}>
                  {t('Walk-in Interview Details')}
                </Text>

                <TextInput
                  value={walkInDate}
                  onChangeText={setWalkInDate}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />

                <TextInput
                  value={walkInAddress}
                  onChangeText={setWalkInAddress}
                  placeholder="Walk-in venue / factory gate address"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />

                <TextInput
                  value={walkInContact}
                  onChangeText={setWalkInContact}
                  placeholder="Contact person / ask for"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
              </View>
            )}
          </View>
        )}

        {/* Step 1: Pay & Requirements */}
        {step === 1 && (
          <View style={styles.stepBody}>
            {/* Pay range */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                {t('Monthly Salary range (₹)')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput
                  value={String(f.payMin || '')}
                  onChangeText={(val) => setF({ ...f, payMin: parseInt(val, 10) || 0 })}
                  placeholder="Min (e.g. 18000)"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
                <TextInput
                  value={String(f.payMax || '')}
                  onChangeText={(val) => setF({ ...f, payMax: parseInt(val, 10) || 0 })}
                  placeholder="Max (e.g. 24000)"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
                />
              </View>
            </View>

            {/* Shift */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Shift')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['day', 'night', 'rotational'] as Shift[]).map((sh) => (
                  <TouchableOpacity
                    key={sh}
                    onPress={() => setF({ ...f, shift: sh })}
                    style={[
                      styles.pillOption,
                      {
                        backgroundColor: f.shift === sh ? colors.primary : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: f.shift === sh ? '#FFF' : colors.ink, fontWeight: '600', fontSize: 13 }}>
                      {SHIFT_LABEL[sh]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Required */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                {t('Experience required')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['fresher', '1_2', '3_5', '5_plus'] as ExperienceBand[]).map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    onPress={() => setF({ ...f, experience: exp })}
                    style={[
                      styles.pillOption,
                      {
                        backgroundColor: f.experience === exp ? colors.primary : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: f.experience === exp ? '#FFF' : colors.ink, fontWeight: '600', fontSize: 13 }}>
                      {EXPERIENCE_LABEL[exp]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Qualifications */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>{t('Qualifications')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {QUALIFICATIONS.map((q) => {
                  const sel = f.qualifications.includes(q);
                  return (
                    <TouchableOpacity
                      key={q}
                      onPress={() =>
                        setF({
                          ...f,
                          qualifications: sel ? f.qualifications.filter((x) => x !== q) : [...f.qualifications, q],
                        })
                      }
                      style={[
                        styles.pillOption,
                        {
                          backgroundColor: sel ? colors.primary : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text style={{ color: sel ? '#FFF' : colors.ink, fontWeight: '600', fontSize: 13 }}>
                        {q}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Facilities / Benefits */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                {t('Facilities & Benefits')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(Object.keys(BENEFIT_LABEL) as Benefit[]).map((b) => {
                  const sel = f.benefits.includes(b);
                  return (
                    <TouchableOpacity
                      key={b}
                      onPress={() =>
                        setF({
                          ...f,
                          benefits: sel ? f.benefits.filter((x) => x !== b) : [...f.benefits, b],
                        })
                      }
                      style={[
                        styles.pillOption,
                        {
                          backgroundColor: sel ? colors.tiles.green.bg : colors.surfaceMuted,
                          borderColor: sel ? colors.tiles.green.text : 'transparent',
                          borderWidth: sel ? 1 : 0,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: sel ? colors.tiles.green.text : colors.ink,
                          fontWeight: '700',
                          fontSize: 13,
                        }}
                      >
                        {BENEFIT_LABEL[b]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* HR Contact Phone */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                {t('HR Phone for Shortlisted Candidates')}
              </Text>
              <TextInput
                value={f.hrPhone || ''}
                onChangeText={(val) => setF({ ...f, hrPhone: val })}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.inkMuted}
                keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
              />
            </View>
          </View>
        )}

        {/* Step 2: Review & Confirm */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <Text style={[styles.previewHeading, { color: colors.ink }]}>
              {t('How workers will see this job')}
            </Text>

            {/* Preview only: not tappable. */}
            <View pointerEvents="none">
              <JobCard job={previewJob} onPress={() => {}} />
            </View>

            {/* Zero fee anti-exploitation guarantee */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setNoFeeConfirmed(!noFeeConfirmed)}
              style={[
                styles.zeroFeeCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: noFeeConfirmed ? colors.primary : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    backgroundColor: noFeeConfirmed ? colors.primary : 'transparent',
                    borderColor: noFeeConfirmed ? colors.primary : colors.borderStrong,
                  },
                ]}
              >
                {noFeeConfirmed && <Check size={12} color="#FFF" strokeWidth={3} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.zeroFeeTitle, { color: colors.ink }]}>
                  {t('Zero fee guarantee')}
                </Text>
                <Text style={[styles.zeroFeeText, { color: colors.inkSecondary }]}>
                  {t('I confirm our company will never ask candidates for money, security deposit or "registration" fee.')}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.submitActionsRow}>
              {(!editing || existing.data?.status === 'draft') && (
              <TouchableOpacity
                onPress={() => createMutation.mutate('draft')}
                disabled={createMutation.isPending}
                style={[styles.draftBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Text style={[styles.draftBtnText, { color: colors.ink }]}>{t('Save draft')}</Text>
              </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => createMutation.mutate('active')}
                disabled={createMutation.isPending || !noFeeConfirmed}
                style={[
                  styles.publishBtn,
                  {
                    backgroundColor: noFeeConfirmed ? colors.primary : colors.inkMuted,
                  },
                ]}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.publishBtnText}>{editing && existing.data?.status !== 'draft' ? t('Save changes') : t('Publish Job')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step Navigation Button */}
        {step < 2 && (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.nextBtnText}>{t('Next')}</Text>
            <ArrowRight size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeaderText: {
    fontSize: 12.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  stepBody: {
    gap: 16,
  },
  templatesBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  templatesHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  templateChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  pillOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  walkInFormBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginTop: 4,
  },
  previewHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: -6,
  },
  zeroFeeCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  zeroFeeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  zeroFeeText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  submitActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  draftBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  publishBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
