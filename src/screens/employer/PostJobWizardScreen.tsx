import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { JobCard } from '../../components/domain/JobCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DateField } from '../../components/ui/DateField';
import { VerificationBanner } from '../../components/domain/VerificationBanner';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  BENEFIT_LABEL,
  EXPERIENCE_LABEL,
  JOB_TYPE_LABEL,
  QUALIFICATIONS,
  LICENCES,
  SHIFT_LABEL,
  TRADE_LABEL,
  INDIA_STATES,
} from '../../lib/labels';
import { isValidPhone, errorText } from '../../lib/errors';
import { findFeeWording } from '../../lib/scam';
import { t } from '../../lib/i18n';
import type { Benefit, ExperienceBand, JobInput, JobType, PayPeriod, PayType, Shift, Trade } from '../../types';

const TEMPLATES: Partial<Record<Trade, Partial<Draft>>> = {
  welder: {
    title: 'Welder (ITI)',
    qualifications: ['ITI'],
    payMin: '18000',
    payMax: '22000',
    benefits: ['food', 'pf_esi'],
    responsibilities: 'Arc / MIG welding as per drawing\nGas cutting and grinding\nFollow safety permits',
    requirements: 'ITI in Welder trade\n1+ year experience',
  },
  driver: {
    title: 'Truck Driver (HMV)',
    payMin: '22000',
    payMax: '26000',
    benefits: ['food', 'overtime'],
    licences: ['HMV licence'],
    responsibilities: 'Drive company trucks on given routes\nDaily vehicle check',
    requirements: 'Valid HMV licence\n3+ years driving experience',
  },
  electrician: {
    title: 'Electrician (ITI)',
    qualifications: ['ITI'],
    payMin: '20000',
    payMax: '25000',
    benefits: ['pf_esi'],
    responsibilities: 'Maintain plant wiring and panels\nFault finding',
    requirements: 'ITI Electrician\nWireman licence preferred',
  },
  helper: {
    title: 'Helper',
    payMin: '550',
    payMax: '600',
    payPeriod: 'day',
    experience: 'fresher',
    benefits: ['food'],
    responsibilities: 'Loading and unloading\nHousekeeping',
    requirements: 'Physically fit',
  },
  fitter: {
    title: 'Fitter (ITI)',
    qualifications: ['ITI'],
    payMin: '17000',
    payMax: '21000',
    benefits: ['pf_esi'],
    responsibilities: 'Fitting and maintenance of machines',
    requirements: 'ITI Fitter',
  },
};

interface Draft {
  title: string;
  trade?: Trade;
  openings: string;
  jobType: JobType;
  contractLength: string;
  walkDate?: string;
  walkTime?: string;
  walkEndTime?: string;
  walkAddress: string;
  walkContact: string;
  walkBring: string;
  siteName: string;
  city: string;
  state?: string;
  address: string;
  pincode: string;
  shift: Shift;
  workHours: string;
  payPeriod: PayPeriod;
  payMin: string;
  payMax: string;
  payType: PayType;
  experience?: ExperienceBand;
  qualifications: string[];
  licences: string[];
  benefits: Benefit[];
  responsibilities: string;
  requirements: string;
  deadline?: string;
  hrPhone: string;
  allowCalls: boolean;
  callHours: string;
}

const BLANK: Draft = {
  title: '',
  openings: '1',
  jobType: 'full_time',
  contractLength: '',
  walkAddress: '',
  walkContact: '',
  walkBring: '',
  siteName: '',
  city: '',
  address: '',
  pincode: '',
  shift: 'day',
  workHours: '',
  payPeriod: 'month',
  payMin: '',
  payMax: '',
  payType: 'in_hand',
  qualifications: [],
  licences: [],
  benefits: [],
  responsibilities: '',
  requirements: '',
  hrPhone: '',
  allowCalls: true,
  callHours: '',
};

const STEPS = ['Basics', 'Place & time', 'Pay & needs', 'Review'];
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const num = (s: string) => (s.trim() ? Number(s) : undefined);

export const PostJobWizardScreen: React.FC = () => {
  const navigation = useNavigation();
  const jobId = (useRoute().params as { jobId?: string } | undefined)?.jobId;
  const editing = !!jobId;
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [f, setF] = useState<Draft>({ ...BLANK, deadline: inDays(30) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [noFee, setNoFee] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const set = (changes: Partial<Draft>) => setF((p) => ({ ...p, ...changes }));

  const company = useQuery({ queryKey: queryKeys.employer.company, queryFn: () => employerApi.getCompany() });
  const existing = useQuery({
    queryKey: queryKeys.employer.job(jobId ?? ''),
    queryFn: () => employerApi.getJob(jobId!),
    enabled: editing,
  });

  // New job: start from the company's details (not sample data). Edit: fill from the saved job. Each runs once.
  const [filled, setFilled] = useState(false);
  if (!filled) {
    if (editing && existing.data) {
      const j = existing.data;
      setFilled(true);
      setF({
        title: j.title,
        trade: j.trade,
        openings: String(j.openings),
        jobType: j.jobType,
        contractLength: j.contractLength ?? '',
        walkDate: j.walkIn?.date,
        walkTime: j.walkIn?.time,
        walkEndTime: j.walkIn?.endTime,
        walkAddress: j.walkIn?.address ?? '',
        walkContact: j.walkIn?.contactPerson ?? '',
        walkBring: j.walkIn?.bring ?? '',
        siteName: j.siteName ?? '',
        city: j.location.city,
        state: j.location.state,
        address: j.address ?? '',
        pincode: j.pincode ?? '',
        shift: j.shift,
        workHours: j.workHours ?? '',
        payPeriod: j.payPeriod,
        payMin: j.payMin ? String(j.payMin) : '',
        payMax: j.payMax ? String(j.payMax) : '',
        payType: j.payType ?? 'in_hand',
        experience: j.experience,
        qualifications: j.qualifications,
        licences: j.licences ?? [],
        benefits: j.benefits,
        responsibilities: j.responsibilities.join('\n'),
        requirements: j.requirements.join('\n'),
        deadline: j.deadline,
        hrPhone: j.hrPhone ?? '',
        allowCalls: j.allowCalls,
        callHours: j.callHours ?? '',
      });
      setNoFee(true); // they already confirmed this when they first posted it
    } else if (!editing && company.data) {
      const c = company.data;
      setFilled(true);
      setF((p) => ({
        ...p,
        city: c.location.city,
        state: c.location.state || undefined,
        address: c.address ?? '',
        pincode: c.pincode ?? '',
        hrPhone: c.hrPhone ?? '',
      }));
    }
  }

  const status = existing.data?.status;

  const save = useMutation({
    mutationFn: (target: 'active' | 'draft') => {
      // Saving an active or closed job keeps its status; only drafts change when published.
      const keep = editing && status && status !== 'draft' ? status : target;
      const payload = {
        title: f.title.trim(),
        trade: f.trade!,
        sector: company.data?.sector ?? 'metals',
        location: { city: f.city.trim(), state: f.state ?? '' },
        siteName: f.siteName.trim() || undefined,
        address: f.address.trim() || undefined,
        pincode: f.pincode || undefined,
        openings: Number(f.openings) || 1,
        jobType: f.jobType,
        contractLength: f.jobType === 'contract' ? f.contractLength.trim() || undefined : undefined,
        walkIn:
          f.jobType === 'walk_in'
            ? {
                date: f.walkDate!,
                time: f.walkTime,
                endTime: f.walkEndTime,
                address: f.walkAddress.trim(),
                contactPerson: f.walkContact.trim() || undefined,
                bring: f.walkBring.trim() || undefined,
              }
            : undefined,
        shift: f.shift,
        workHours: f.workHours.trim() || undefined,
        payPeriod: f.payPeriod,
        payMin: num(f.payMin),
        payMax: num(f.payMax),
        payType: f.payType,
        experience: f.experience!,
        qualifications: f.qualifications,
        licences: f.licences,
        benefits: f.benefits,
        responsibilities: lines(f.responsibilities),
        requirements: lines(f.requirements),
        deadline: f.jobType === 'walk_in' ? undefined : f.deadline,
        hrPhone: f.hrPhone || undefined,
        allowCalls: f.allowCalls,
        callHours: f.allowCalls ? f.callHours.trim() || undefined : undefined,
        status: keep,
      } as JobInput;
      return editing ? employerApi.updateJob(jobId!, payload) : employerApi.createJob(payload);
    },
    onSuccess: (_d, target) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      qc.invalidateQueries({ queryKey: queryKeys.jobs() });
      showToast(
        editing ? t('Changes saved') : target === 'active' ? t('Job published! Workers can see it now.') : t('Saved as draft'),
        'success'
      );
      navigation.goBack();
    },
    onError: (e: Error) => showToast(errorText(e, 'Could not save the job. Try again.'), 'error'),
  });

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (f.title.trim().length < 3) e.title = t('Enter a job title, like "Welder (ITI)".');
      if (!f.trade) e.trade = t('Choose the trade.');
      const n = Number(f.openings);
      if (!Number.isInteger(n) || n < 1 || n > 1000) e.openings = t('Enter how many people you need, from 1 to 1000.');
      if (f.jobType === 'contract' && !f.contractLength.trim()) e.contractLength = t('Say how long the contract is, like "6 months".');
      if (f.jobType === 'walk_in') {
        if (!f.walkDate) e.walkDate = t('Choose the walk-in date.');
        else if (f.walkDate < today()) e.walkDate = t('The walk-in date cannot be in the past.');
        if (!f.walkTime) e.walkTime = t('Choose the start time.');
        if (f.walkTime && f.walkEndTime && f.walkEndTime <= f.walkTime) e.walkEndTime = t('The end time must be after the start time.');
        if (f.walkAddress.trim().length < 5) e.walkAddress = t('Enter the address where workers should come.');
      }
    }
    if (s === 1) {
      if (f.city.trim().length < 2) e.city = t('Enter the work site city.');
      if (!f.state) e.state = t('Choose the state.');
      if (f.pincode && !/^\d{6}$/.test(f.pincode)) e.pincode = t('Enter a 6-digit pincode, or leave it empty.');
      if (f.jobType !== 'walk_in') {
        if (!f.deadline) e.deadline = t('Choose the last date to apply.');
        else if (f.deadline < today()) e.deadline = t('The last date cannot be in the past.');
      }
    }
    if (s === 2) {
      const min = num(f.payMin);
      const max = num(f.payMax);
      const [lo, hi] = f.payPeriod === 'month' ? [5000, 500000] : [200, 10000];
      if (!min) e.payMin = t('Enter the lowest pay.');
      else if (min < lo || min > hi) e.payMin = t('This looks too {size}. Check the amount.', { size: min < lo ? t('low') : t('high') });
      if (max !== undefined && min && max < min) e.payMax = t('The highest pay cannot be lower than the lowest.');
      else if (max !== undefined && max > hi) e.payMax = t('This looks too high. Check the amount.');
      if (!f.experience) e.experience = t('Choose the experience you need.');
      if (lines(f.responsibilities).length === 0) e.responsibilities = t('Write at least one line about the work.');
      if (!isValidPhone(f.hrPhone)) e.hrPhone = t('Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.');
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    setStep(step + 1);
  };

  const fee = findFeeWording(f.title, f.responsibilities, f.requirements, f.walkBring, f.contractLength);

  const publish = () => {
    // Check every step again, in case an earlier one was changed after leaving it.
    for (const s of [0, 1, 2]) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return showToast(t('Please fix the highlighted fields.'), 'warning');
      }
    }
    if (fee.length) return showToast(t('Remove the wording that asks workers for money before you publish.'), 'warning');
    save.mutate('active');
  };

  const saveDraft = () => {
    if (f.title.trim().length < 3 || !f.trade) {
      setStep(0);
      setErrors(validate(0));
      return showToast(t('Add a title and trade to save a draft.'), 'warning');
    }
    save.mutate('draft');
  };

  const back = () => {
    if (step > 0) return setStep(step - 1);
    const dirty = JSON.stringify(f) !== JSON.stringify({ ...BLANK, deadline: inDays(30) });
    if (!dirty || editing) return navigation.goBack();
    Alert.alert(t('Leave without saving?'), t('What you entered will be lost.'), [
      { text: t('Keep editing'), style: 'cancel' },
      { text: t('Leave'), style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const previewJob = {
    id: 'preview',
    companyId: user?.companyId || 'preview',
    companyName: company.data?.name || user?.companyName || 'Your company',
    companyVerified: company.data?.verification === 'approved',
    postedAt: new Date().toISOString(),
    applicantsCount: 0,
    newApplicantsCount: 0,
    saved: false,
    title: f.title || 'Job title',
    trade: f.trade ?? 'other',
    sector: company.data?.sector ?? 'metals',
    location: { city: f.city, state: f.state ?? '' },
    payMin: num(f.payMin),
    payMax: num(f.payMax),
    payPeriod: f.payPeriod,
    shift: f.shift,
    jobType: f.jobType,
    openings: Number(f.openings) || 1,
    experience: f.experience ?? 'fresher',
    qualifications: f.qualifications,
    benefits: f.benefits,
    responsibilities: lines(f.responsibilities),
    requirements: lines(f.requirements),
    allowCalls: f.allowCalls,
    siteName: f.siteName,
    status: 'active' as const,
  };

  const applyTemplate = (k: Trade) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    set({ trade: k, ...TEMPLATES[k] });
    setShowTemplates(false);
  };

  const publishLabel = editing && status !== 'draft' ? t('Save changes') : t('Publish job');

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t('Back')} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.ink }]}>{editing ? t('Edit job') : t('Post a job')}</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
          {step + 1} / {STEPS.length}
        </Text>
      </View>

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
                  <Text style={{ color: active ? colors.primary : colors.inkMuted, fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                )}
              </View>
              <Text numberOfLines={1} style={[styles.stepHeaderText, { color: active ? colors.ink : colors.inkMuted, fontWeight: active ? '700' : '500' }]}>
                {t(s)}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View>
            {company.data && company.data.verification !== 'approved' ? <VerificationBanner onCompanyScreen /> : null}

            {!editing && (
              <View style={styles.templateWrap}>
                <Pressable onPress={() => setShowTemplates(!showTemplates)} style={styles.templateLink} accessibilityRole="button">
                  <Sparkles size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15 }}>
                    {showTemplates ? t('Hide templates') : t('Use a template to start faster')}
                  </Text>
                </Pressable>
                {showTemplates ? (
                  <Chips
                    options={(Object.keys(TEMPLATES) as Trade[]).map((k) => ({ key: k, label: t(TRADE_LABEL[k]) }))}
                    value={undefined}
                    onPick={(k) => applyTemplate(k as Trade)}
                  />
                ) : null}
              </View>
            )}

            <Input label={`${t('Job title')} *`} value={f.title} onChangeText={(title) => set({ title })} placeholder="Welder (ITI)" error={errors.title} />
            <Label text={`${t('Trade')} *`} />
            <Chips
              options={(Object.keys(TRADE_LABEL) as Trade[]).map((k) => ({ key: k, label: t(TRADE_LABEL[k]) }))}
              value={f.trade}
              onPick={(k) => set({ trade: k as Trade })}
              error={errors.trade}
            />
            <Input
              label={`${t('Number of openings')} *`}
              value={f.openings}
              onChangeText={(v) => set({ openings: v.replace(/\D/g, '').slice(0, 4) })}
              keyboardType="number-pad"
              error={errors.openings}
            />
            <Label text={t('Job type')} />
            <Chips
              options={(['full_time', 'contract', 'walk_in'] as JobType[]).map((k) => ({ key: k, label: t(JOB_TYPE_LABEL[k]) }))}
              value={f.jobType}
              onPick={(k) => set({ jobType: k as JobType })}
            />

            {f.jobType === 'contract' && (
              <Input
                label={`${t('Contract length')} *`}
                value={f.contractLength}
                onChangeText={(contractLength) => set({ contractLength })}
                placeholder={t('e.g. 6 months')}
                error={errors.contractLength}
              />
            )}

            {f.jobType === 'walk_in' && (
              <View style={[styles.box, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.boxTitle, { color: colors.ink }]}>{t('Walk-in details')}</Text>
                <DateField label={`${t('Date')} *`} value={f.walkDate} onChange={(walkDate) => set({ walkDate })} minimumDate={new Date()} error={errors.walkDate} />
                <View style={styles.row2}>
                  <DateField style={styles.flex} mode="time" label={`${t('From')} *`} value={f.walkTime} onChange={(walkTime) => set({ walkTime })} error={errors.walkTime} />
                  <DateField style={styles.flex} mode="time" label={t('Until')} value={f.walkEndTime} onChange={(walkEndTime) => set({ walkEndTime })} error={errors.walkEndTime} />
                </View>
                <Input label={`${t('Address')} *`} value={f.walkAddress} onChangeText={(walkAddress) => set({ walkAddress })} multiline error={errors.walkAddress} placeholder={t('Gate, road, landmark')} />
                <Input label={t('Ask for')} value={f.walkContact} onChangeText={(walkContact) => set({ walkContact })} placeholder={t('Name of the person at the gate')} />
                <Input label={t('What to bring')} value={f.walkBring} onChangeText={(walkBring) => set({ walkBring })} placeholder={t('ID proof, certificates, 2 photos')} />
              </View>
            )}
          </View>
        )}

        {step === 1 && (
          <View>
            <Input label={t('Site or plant name')} value={f.siteName} onChangeText={(siteName) => set({ siteName })} placeholder="Plant 2" />
            {(company.data?.sites ?? []).length > 0 && (
              <Chips
                options={(company.data?.sites ?? []).map((k) => ({ key: k, label: k }))}
                value={f.siteName}
                onPick={(siteName) => set({ siteName })}
              />
            )}
            <Input label={`${t('Work site city')} *`} value={f.city} onChangeText={(city) => set({ city })} error={errors.city} />
            <Label text={`${t('State')} *`} />
            <Chips options={INDIA_STATES.map((k) => ({ key: k, label: k }))} value={f.state} onPick={(state) => set({ state })} error={errors.state} />
            <Input label={t('Address')} value={f.address} onChangeText={(address) => set({ address })} multiline placeholder={t('Area, road or plant gate')} />
            <Input
              label={t('Pincode')}
              value={f.pincode}
              onChangeText={(v) => set({ pincode: v.replace(/\D/g, '').slice(0, 6) })}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pincode}
            />
            <Label text={t('Shift')} />
            <Chips
              options={(['day', 'night', 'rotational'] as Shift[]).map((k) => ({ key: k, label: t(SHIFT_LABEL[k]) }))}
              value={f.shift}
              onPick={(k) => set({ shift: k as Shift })}
            />
            <Input label={t('Working hours')} value={f.workHours} onChangeText={(workHours) => set({ workHours })} placeholder={t('e.g. 8 hours, 6 days a week')} />
            {f.jobType !== 'walk_in' && (
              <DateField
                label={`${t('Last date to apply')} *`}
                value={f.deadline}
                onChange={(deadline) => set({ deadline })}
                minimumDate={new Date()}
                error={errors.deadline}
              />
            )}
          </View>
        )}

        {step === 2 && (
          <View>
            <Label text={t('Pay is paid')} />
            <Chips
              options={[
                { key: 'month', label: t('Per month') },
                { key: 'day', label: t('Per day') },
              ]}
              value={f.payPeriod}
              onPick={(k) => set({ payPeriod: k as PayPeriod })}
            />
            <View style={styles.row2}>
              <Input
                containerStyle={styles.flex}
                label={`${t('Lowest pay')} (₹) *`}
                value={f.payMin}
                onChangeText={(v) => set({ payMin: v.replace(/\D/g, '').slice(0, 7) })}
                keyboardType="number-pad"
                error={errors.payMin}
                placeholder="18000"
              />
              <Input
                containerStyle={styles.flex}
                label={`${t('Highest pay')} (₹)`}
                value={f.payMax}
                onChangeText={(v) => set({ payMax: v.replace(/\D/g, '').slice(0, 7) })}
                keyboardType="number-pad"
                error={errors.payMax}
                placeholder="22000"
              />
            </View>
            <Label text={t('Pay type')} />
            <Chips
              options={[
                { key: 'in_hand', label: t('In-hand') },
                { key: 'ctc', label: t('Before PF/ESI') },
              ]}
              value={f.payType}
              onPick={(k) => set({ payType: k as PayType })}
            />
            <Label text={`${t('Experience needed')} *`} />
            <Chips
              options={(Object.keys(EXPERIENCE_LABEL) as ExperienceBand[]).map((k) => ({ key: k, label: t(EXPERIENCE_LABEL[k]) }))}
              value={f.experience}
              onPick={(k) => set({ experience: k as ExperienceBand })}
              error={errors.experience}
            />
            <Label text={t('Education')} />
            <Chips
              multi
              options={QUALIFICATIONS.map((k) => ({ key: k, label: k }))}
              values={f.qualifications}
              onPick={(k) => set({ qualifications: toggle(f.qualifications, k) })}
            />
            <Label text={t('Licences or certificates')} />
            <Chips
              multi
              options={LICENCES.map((k) => ({ key: k, label: k }))}
              values={f.licences}
              onPick={(k) => set({ licences: toggle(f.licences, k) })}
            />
            <Label text={t('Facilities and benefits')} />
            <Chips
              multi
              options={(Object.keys(BENEFIT_LABEL) as Benefit[]).map((k) => ({ key: k, label: t(BENEFIT_LABEL[k]) }))}
              values={f.benefits}
              onPick={(k) => set({ benefits: toggle(f.benefits, k) as Benefit[] })}
            />
            <Input
              label={`${t('What the worker will do')} *`}
              value={f.responsibilities}
              onChangeText={(responsibilities) => set({ responsibilities })}
              multiline
              placeholder={t('One line for each task')}
              error={errors.responsibilities}
            />
            <Input
              label={t('What the worker needs')}
              value={f.requirements}
              onChangeText={(requirements) => set({ requirements })}
              multiline
              placeholder={t('One line for each need')}
            />
            <Input
              label={`${t('Mobile number for shortlisted workers')} *`}
              value={f.hrPhone}
              onChangeText={(v) => set({ hrPhone: v.replace(/\D/g, '').slice(0, 10) })}
              keyboardType="number-pad"
              maxLength={10}
              error={errors.hrPhone}
            />
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '600' }}>{t('Allow calls from workers')}</Text>
                <Text style={{ color: colors.inkSecondary, fontSize: 13, marginTop: 2 }}>{t('Shortlisted workers can call this number.')}</Text>
              </View>
              <Switch value={f.allowCalls} onValueChange={(allowCalls) => set({ allowCalls })} />
            </View>
            {f.allowCalls && (
              <Input label={t('Best time to call')} value={f.callHours} onChangeText={(callHours) => set({ callHours })} placeholder={t('e.g. 10 AM to 5 PM')} />
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.previewHeading, { color: colors.ink }]}>{t('How workers will see this job')}</Text>
            <View pointerEvents="none">
              <JobCard job={previewJob as never} onPress={() => {}} />
            </View>

            {fee.length > 0 && (
              <View style={[styles.warn, { backgroundColor: colors.dangerBg }]} accessibilityRole="alert">
                <AlertTriangle size={18} color={colors.dangerFg} />
                <View style={styles.flex}>
                  <Text style={{ color: colors.dangerFg, fontWeight: '700', fontSize: 15 }}>{t('This text asks workers for money')}</Text>
                  <Text style={{ color: colors.dangerFg, fontSize: 14, marginTop: 2, lineHeight: 20 }}>
                    {t('Found: {words}. Workers must never pay to get a job. Remove this wording to publish.', { words: fee.join(', ') })}
                  </Text>
                  <Pressable onPress={() => setStep(0)} hitSlop={8} style={{ marginTop: 6 }}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('Edit the job')}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => setNoFee(!noFee)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: noFee }}
              style={[styles.zeroFee, { backgroundColor: colors.surfaceMuted, borderColor: noFee ? colors.primary : colors.border }]}
            >
              <View style={[styles.checkbox, { backgroundColor: noFee ? colors.primary : 'transparent', borderColor: noFee ? colors.primary : colors.borderStrong }]}>
                {noFee && <Check size={12} color="#FFF" strokeWidth={3} />}
              </View>
              <View style={styles.flex}>
                <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>{t('Zero fee guarantee')}</Text>
                <Text style={{ color: colors.inkSecondary, fontSize: 14, marginTop: 2, lineHeight: 20 }}>
                  {t('I confirm our company will never ask candidates for money, security deposit or "registration" fee.')}
                </Text>
              </View>
            </Pressable>

            {company.data && company.data.verification !== 'approved' ? (
              <Text style={[styles.note, { color: colors.warningFg, backgroundColor: colors.warningBg }]}>
                {t('Your company is not approved yet. You can save this job as a draft and publish it after approval.')}
              </Text>
            ) : null}

            <View style={styles.actions}>
              {(!editing || status === 'draft') && (
                <Button label={t('Save draft')} variant="outline" onPress={saveDraft} disabled={save.isPending} style={styles.flex} />
              )}
              <Button
                label={publishLabel}
                onPress={publish}
                loading={save.isPending}
                disabled={!noFee || fee.length > 0}
                style={styles.flex}
              />
            </View>
          </View>
        )}

        {step < 3 && (
          <Button
            label={t('Next')}
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            iconPosition="right"
            onPress={next}
            style={{ marginTop: 12 }}
          />
        )}
      </ScrollView>
    </Screen>
  );
};

function toggle<T extends string>(list: T[], key: string): T[] {
  return (list.includes(key as T) ? list.filter((x) => x !== key) : [...list, key as T]) as T[];
}

const Label: React.FC<{ text: string }> = ({ text }) => {
  const colors = useUiStore((s) => s.colors);
  return <Text style={[styles.label, { color: colors.inkSecondary }]}>{text}</Text>;
};

const Chips: React.FC<{
  options: { key: string; label: string }[];
  value?: string;
  values?: string[];
  multi?: boolean;
  onPick: (key: string) => void;
  error?: string;
}> = ({ options, value, values, multi, onPick, error }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.chipsWrap}>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = multi ? !!values?.includes(o.key) : value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onPick(o.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, { backgroundColor: on ? colors.primarySoft : colors.surface, borderColor: on ? colors.primary : colors.border }]}
            >
              <Text style={{ color: on ? colors.primary : colors.ink, fontWeight: on ? '700' : '500', fontSize: 14 }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={{ color: colors.dangerFg, fontSize: 13, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { padding: 6 },
  topBarTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  stepperWrap: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  stepHeaderItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepHeaderText: { fontSize: 11 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  templateWrap: { marginBottom: 12 },
  templateLink: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  chipsWrap: { marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  row2: { flexDirection: 'row', gap: 12 },
  box: { padding: 14, borderRadius: 16, marginTop: 4 },
  boxTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  previewHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  warn: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, marginTop: 16 },
  zeroFee: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, marginTop: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  note: { fontSize: 14, lineHeight: 20, padding: 12, borderRadius: 12, marginTop: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
