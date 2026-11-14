import { errorText } from '../../lib/errors';
import { GradientFill } from '../ui/GradientFill';
import { Chip } from '../ui/Chip';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from '../ui/icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/Text';
import { Sheet } from '../ui/Sheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  TRADE_LABEL,
  EXPERIENCE_LABEL,
  SHIFT_LABEL,
  AVAILABILITY_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  QUALIFICATIONS,
  LICENCES,
  LANGUAGES,
  INDIA_STATES,
} from '../../lib/labels';
import { t } from '../../lib/i18n';
import { splitDob, joinDob, ageOf, MIN_AGE } from '../../lib/dob';
import type { WorkerProfile, WorkHistoryItem, Trade, ExperienceBand, Shift, Availability } from '../../types';
import { shadows } from '../../theme/shadows';

export type ProfileSection = 'work' | 'personal' | 'preferences';

interface Props {
  section: ProfileSection | null;
  profile: WorkerProfile;
  onClose: () => void;
}

const TITLES: Record<ProfileSection, string> = {
  work: 'Edit work',
  personal: 'Edit personal details',
  preferences: 'Edit job preferences',
};

/** One bottom sheet for the three profile sections. Saves the section in one go. */
export const ProfileEditSheets: React.FC<Props> = ({ section, profile, onClose }) =>
  // The form remounts per section so its fields always start from the saved profile.
  section ? <EditForm key={section} section={section} profile={profile} onClose={onClose} /> : null;

const EditForm: React.FC<{ section: ProfileSection; profile: WorkerProfile; onClose: () => void }> = ({
  section,
  profile,
  onClose,
}) => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const updateUser = useAuthStore((s) => s.updateUser);
  const qc = useQueryClient();
  const [d, setD] = useState<WorkerProfile>(() => ({ ...profile }));
  const [dob, setDob] = useState(() => splitDob(profile.dob));
  const [pay, setPay] = useState(profile.expectedPay ? String(profile.expectedPay) : '');
  const [hours, setHours] = useState(profile.safetyTrainingHours ? String(profile.safetyTrainingHours) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const set = (changes: Partial<WorkerProfile>) => {
    setDirty(true);
    setD((prev) => ({ ...prev, ...changes }));
  };

  const save = useMutation({
    mutationFn: (changes: Partial<WorkerProfile>) => workerApi.updateProfile(changes),
    onSuccess: (_res, changes) => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      updateUser({
        ...(changes.name ? { name: changes.name } : {}),
        ...(changes.trade ? { trade: changes.trade } : {}),
        ...(changes.location?.city ? { city: changes.location.city } : {}),
      });
      showToast(t('Saved'), 'success');
      finish();
    },
    onError: (e) => showToast(errorText(e, 'Could not save. Check your connection and try again.'), 'error'),
  });

  const [open, setOpen] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  // Slide the sheet out first, then tell the parent.
  const finish = () => {
    setOpen(false);
    timer.current = setTimeout(onClose, 220);
  };

  const close = () => {
    if (!dirty) return finish();
    Alert.alert(t('Discard changes?'), t('What you changed will not be saved.'), [
      { text: t('Keep editing'), style: 'cancel' },
      { text: t('Discard'), style: 'destructive', onPress: finish },
    ]);
  };

  const submit = () => {
    const e: Record<string, string> = {};
    let changes: Partial<WorkerProfile> = {};

    if (section === 'work') {
      const h = hours.trim() ? Number(hours) : undefined;
      if (h !== undefined && (!Number.isFinite(h) || h < 0 || h > 5000)) e.hours = t('Enter the number of hours, like 40.');
      const badRow = (d.workHistory ?? []).findIndex((w) => !w.role.trim() || !w.company.trim());
      if (badRow >= 0) e.history = t('Fill the job title and company, or remove the empty row.');
      const badYears = (d.workHistory ?? []).some((w) => w.from && w.to && w.to < w.from);
      if (badYears) e.history = t('The end year cannot be before the start year.');
      changes = {
        trade: d.trade,
        experience: d.experience,
        qualifications: d.qualifications,
        licences: d.licences,
        languages: d.languages,
        skills: d.skills,
        safetyTrainingHours: h,
        workHistory: (d.workHistory ?? []).filter((w) => w.role.trim() || w.company.trim()),
      };
    } else if (section === 'personal') {
      if (d.name.trim().length < 2) e.name = t('Enter your full name.');
      if (d.email && !/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = t('Enter a valid email, or leave it empty.');
      const iso = joinDob(dob);
      if (iso === 'invalid') e.dob = t('Enter a real date, like 15 / 08 / 1998.');
      else if (iso && ageOf(iso) < MIN_AGE) e.dob = t('You must be at least 18 years old.');
      if (d.pincode && !/^\d{6}$/.test(d.pincode)) e.pincode = t('Enter a 6-digit pincode, or leave it empty.');
      changes = {
        pincode: d.pincode || undefined,
        address: d.address?.trim() || undefined,
        name: d.name.trim(),
        email: d.email?.trim() || undefined,
        dob: iso && iso !== 'invalid' ? iso : undefined,
        gender: d.gender,
        location: d.location?.city?.trim() ? { city: d.location.city.trim(), state: d.location.state?.trim() ?? '' } : undefined,
        about: d.about?.trim() || undefined,
      };
    } else {
      const p = pay.trim() ? Number(pay) : undefined;
      if (p !== undefined && (!Number.isFinite(p) || p <= 0 || p > 500000)) e.pay = t('Enter the monthly pay in rupees, like 25000.');
      changes = {
        expectedPay: p,
        shiftPreference: d.shiftPreference,
        employmentType: d.employmentType,
        willingToRelocate: d.willingToRelocate,
        availability: d.availability,
      };
    }

    setErrors(e);
    if (Object.keys(e).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    save.mutate(changes);
  };

  return (
    <Sheet
      visible={open}
      onClose={close}
      title={t(TITLES[section])}
      maxHeight={0.94}
      footer={
        <View style={styles.footer}>
          <Button label={t('Cancel')} variant="ghost" onPress={close} />
          <Button label={t('Save')} onPress={submit} loading={save.isPending} style={styles.flex} />
        </View>
      }
    >
      <>
        {section === 'work' && (
          <>
            <Group label={t('Trade')}>
              <ChipRow
                options={(Object.keys(TRADE_LABEL) as Trade[]).map((k) => ({ key: k, label: t(TRADE_LABEL[k]) }))}
                selected={d.trade ? [d.trade] : []}
                onToggle={(k) => set({ trade: k as Trade })}
              />
            </Group>
            <Group label={t('Experience')}>
              <ChipRow
                options={(Object.keys(EXPERIENCE_LABEL) as ExperienceBand[]).map((k) => ({ key: k, label: t(EXPERIENCE_LABEL[k]) }))}
                selected={d.experience ? [d.experience] : []}
                onToggle={(k) => set({ experience: k as ExperienceBand })}
              />
            </Group>
            <Group label={t('Education')}>
              <ChipRow
                options={QUALIFICATIONS.map((k) => ({ key: k, label: k }))}
                selected={d.qualifications}
                onToggle={(k) => set({ qualifications: toggle(d.qualifications, k) })}
              />
            </Group>
            <Group label={t('Licences / certificates')}>
              <ChipRow
                options={LICENCES.map((k) => ({ key: k, label: k }))}
                selected={d.licences}
                onToggle={(k) => set({ licences: toggle(d.licences, k) })}
              />
            </Group>
            <Input
              label={t('Safety training (hours)')}
              value={hours}
              onChangeText={(v) => {
                setDirty(true);
                setHours(v.replace(/\D/g, ''));
              }}
              keyboardType="number-pad"
              error={errors.hours}
            />
            <Group label={t('Languages I speak')}>
              <ChipRow
                options={LANGUAGES.map((k) => ({ key: k, label: k }))}
                selected={d.languages ?? []}
                onToggle={(k) => set({ languages: toggle(d.languages ?? [], k) })}
              />
            </Group>
            <SkillsEditor skills={d.skills} onChange={(skills) => set({ skills })} />
            <HistoryEditor
              items={d.workHistory ?? []}
              onChange={(workHistory) => set({ workHistory })}
              error={errors.history}
            />
          </>
        )}

        {section === 'personal' && (
          <>
            <Input label={t('Name')} value={d.name} onChangeText={(v) => set({ name: v })} error={errors.name} autoComplete="name" />
            <View style={styles.readonly}>
              <Text style={[styles.readonlyLabel, { color: colors.inkMuted }]}>{t('Mobile')}</Text>
              <Text style={[styles.readonlyValue, { color: colors.ink }]}>{d.phone}</Text>
              <Text style={[styles.hint, { color: colors.inkMuted }]}>
                {t('To change your mobile number, contact help.')}
              </Text>
            </View>
            <Input
              label={t('Email')}
              value={d.email ?? ''}
              onChangeText={(v) => set({ email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <Group label={t('Date of birth')}>
              <View style={styles.dobRow}>
                <Input
                  containerStyle={styles.dobDay}
                  value={dob.d}
                  onChangeText={(v) => {
                    setDirty(true);
                    setDob({ ...dob, d: v.replace(/\D/g, '').slice(0, 2) });
                  }}
                  placeholder={t('Day')}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Input
                  containerStyle={styles.dobDay}
                  value={dob.m}
                  onChangeText={(v) => {
                    setDirty(true);
                    setDob({ ...dob, m: v.replace(/\D/g, '').slice(0, 2) });
                  }}
                  placeholder={t('Month')}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Input
                  containerStyle={styles.dobYear}
                  value={dob.y}
                  onChangeText={(v) => {
                    setDirty(true);
                    setDob({ ...dob, y: v.replace(/\D/g, '').slice(0, 4) });
                  }}
                  placeholder={t('Year')}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              {errors.dob ? <Text style={[styles.error, { color: colors.dangerFg }]}>{errors.dob}</Text> : null}
            </Group>
            <Group label={t('Gender')}>
              <ChipRow
                options={[
                  { key: 'male', label: t('Male') },
                  { key: 'female', label: t('Female') },
                  { key: 'other', label: t('Other') },
                ]}
                selected={d.gender ? [d.gender] : []}
                onToggle={(k) => set({ gender: k as WorkerProfile['gender'] })}
              />
            </Group>
            <Input
              label={t('City')}
              value={d.location?.city ?? ''}
              onChangeText={(v) => set({ location: { city: v, state: d.location?.state ?? '' } })}
            />
            <Group label={t('State')}>
              <ChipRow
                options={INDIA_STATES.map((k) => ({ key: k, label: k }))}
                selected={d.location?.state ? [d.location.state] : []}
                onToggle={(k) => set({ location: { city: d.location?.city ?? '', state: k } })}
              />
            </Group>
            <Input
              label={t('Pincode')}
              value={d.pincode ?? ''}
              onChangeText={(v) => set({ pincode: v.replace(/\D/g, '').slice(0, 6) })}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pincode}
            />
            <Input
              label={t('Address')}
              value={d.address ?? ''}
              onChangeText={(v) => set({ address: v.slice(0, 200) })}
              multiline
              containerStyle={styles.about}
            />
            <Input
              label={t('About me')}
              value={d.about ?? ''}
              onChangeText={(v) => set({ about: v.slice(0, 300) })}
              multiline
              placeholder={t('Tell employers about your work in one or two lines.')}
              containerStyle={styles.about}
            />
            <Text style={[styles.hint, { color: colors.inkMuted, textAlign: 'right' }]}>{(d.about ?? '').length}/300</Text>
          </>
        )}

        {section === 'preferences' && (
          <>
            <Input
              label={t('Expected pay (₹ per month)')}
              value={pay}
              onChangeText={(v) => {
                setDirty(true);
                setPay(v.replace(/\D/g, ''));
              }}
              keyboardType="number-pad"
              placeholder="25000"
              error={errors.pay}
            />
            <Group label={t('Shift')}>
              <ChipRow
                options={(Object.keys(SHIFT_LABEL) as (Shift | 'any')[]).map((k) => ({ key: k, label: t(SHIFT_LABEL[k]) }))}
                selected={d.shiftPreference ? [d.shiftPreference] : []}
                onToggle={(k) => set({ shiftPreference: k as Shift | 'any' })}
              />
            </Group>
            <Group label={t('Looking for')}>
              <ChipRow
                options={(Object.keys(EMPLOYMENT_TYPE_LABEL) as ('permanent' | 'contract' | 'any')[]).map((k) => ({
                  key: k,
                  label: t(EMPLOYMENT_TYPE_LABEL[k]),
                }))}
                selected={d.employmentType ? [d.employmentType] : []}
                onToggle={(k) => set({ employmentType: k as WorkerProfile['employmentType'] })}
              />
            </Group>
            <Group label={t('Ready to move')}>
              <ChipRow
                options={[
                  { key: 'yes', label: t('Yes') },
                  { key: 'no', label: t('No') },
                ]}
                selected={[d.willingToRelocate ? 'yes' : 'no']}
                onToggle={(k) => set({ willingToRelocate: k === 'yes' })}
              />
            </Group>
            <Group label={t('When can you join')}>
              <ChipRow
                options={(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => ({ key: k, label: t(AVAILABILITY_LABEL[k]) }))}
                selected={[d.availability]}
                onToggle={(k) => set({ availability: k as Availability })}
              />
            </Group>
          </>
        )}
      </>
    </Sheet>
  );
};

/* ---------- small pieces ---------- */

const Group: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.inkSecondary }]}>{label}</Text>
      {children}
    </View>
  );
};

function ChipRow({
  options,
  selected,
  onToggle,
}: {
  options: { key: string; label: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        return <Chip key={o.key} label={o.label} selected={on} onPress={() => onToggle(o.key)} />;
      })}
    </View>
  );
}

const SkillsEditor: React.FC<{ skills: string[]; onChange: (s: string[]) => void }> = ({ skills, onChange }) => {
  const colors = useUiStore((s) => s.colors);
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v || skills.some((s) => s.toLowerCase() === v.toLowerCase())) return setText('');
    onChange([...skills, v]);
    setText('');
  };
  return (
    <Group label={t('Skills')}>
      <View style={styles.chips}>
        {skills.map((s) => (
          <Pressable
            key={s}
            onPress={() => onChange(skills.filter((x) => x !== s))}
            accessibilityLabel={`${t('Remove')} ${s}`}
            style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            <Text style={[styles.chipText, { color: colors.ink }]}>{s}</Text>
            <X size={14} color={colors.inkMuted} />
          </Pressable>
        ))}
      </View>
      <View style={styles.addRow}>
        <Input
          containerStyle={styles.flex}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          returnKeyType="done"
          placeholder={t('Add a skill, like TIG welding')}
        />
        <Pressable onPress={add} accessibilityLabel={t('Add')} style={[styles.addBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
          <GradientFill />
          <Plus size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </Group>
  );
};

const HistoryEditor: React.FC<{ items: WorkHistoryItem[]; onChange: (v: WorkHistoryItem[]) => void; error?: string }> = ({
  items,
  onChange,
  error,
}) => {
  const colors = useUiStore((s) => s.colors);
  const update = (i: number, changes: Partial<WorkHistoryItem>) =>
    onChange(items.map((h, j) => (j === i ? { ...h, ...changes } : h)));
  return (
    <Group label={t('Past jobs')}>
      {items.map((h, i) => (
        <View key={i} style={[styles.historyCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.historyHead}>
            <Text style={[styles.groupLabel, { color: colors.inkSecondary }]}>
              {t('Job')} {i + 1}
            </Text>
            <Pressable
              onPress={() => onChange(items.filter((_, j) => j !== i))}
              hitSlop={10}
              accessibilityLabel={t('Remove')}
            >
              <X size={18} color={colors.inkMuted} />
            </Pressable>
          </View>
          <Input value={h.role} onChangeText={(v) => update(i, { role: v })} placeholder={t('Job title, like Welder')} />
          <Input value={h.company} onChangeText={(v) => update(i, { company: v })} placeholder={t('Company')} />
          <View style={styles.dobRow}>
            <Input
              containerStyle={styles.flex}
              value={h.from}
              onChangeText={(v) => update(i, { from: v.replace(/\D/g, '').slice(0, 4) })}
              placeholder={t('From year')}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Input
              containerStyle={styles.flex}
              value={h.to ?? ''}
              onChangeText={(v) => update(i, { to: v.replace(/\D/g, '').slice(0, 4) || undefined })}
              placeholder={t('To year (empty = now)')}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>
      ))}
      {error ? <Text style={[styles.error, { color: colors.dangerFg }]}>{error}</Text> : null}
      <Button
        label={t('Add a past job')}
        variant="outline"
        icon={<Plus size={16} color={colors.primary} />}
        textStyle={{ color: colors.primary }}
        onPress={() => onChange([...items, { role: '', company: '', from: '' }])}
      />
    </Group>
  );
};

/* ---------- helpers ---------- */

function toggle(list: string[], key: string) {
  return list.includes(key) ? list.filter((x) => x !== key) : [...list, key];
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { marginBottom: 14 },
  groupLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: { fontSize: 13.5 },
  dobRow: { flexDirection: 'row', gap: 8 },
  dobDay: { flex: 1 },
  dobYear: { flex: 1.4 },
  about: { marginBottom: 0 },
  readonly: { marginBottom: 14 },
  readonlyLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  readonlyValue: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 4 },
  error: { fontSize: 12.5, marginTop: 4, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 },
  addBtn: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10, ...shadows.card },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 8 },
});

