import { errorText } from '../../lib/errors';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { TRADE_LABEL, EXPERIENCE_LABEL, AVAILABILITY_LABEL, INDIA_STATES } from '../../lib/labels';
import { joinDob, ageOf, MIN_AGE } from '../../lib/dob';
import { t } from '../../lib/i18n';
import type { Trade, ExperienceBand, Availability, WorkerProfile } from '../../types';

const STEPS = 3;

/** Three short screens. Nothing is pre-selected; every answer is saved to the worker profile. */
export const WorkerWelcomeScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [trade, setTrade] = useState<Trade | undefined>();
  const [experience, setExperience] = useState<ExperienceBand | undefined>();
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [city, setCity] = useState('');
  const [state, setState] = useState<string | undefined>();
  const [availability, setAvailability] = useState<Availability | undefined>();
  const [pay, setPay] = useState('');
  const [error, setError] = useState<string | undefined>();

  const save = useMutation({
    mutationFn: (changes: Partial<WorkerProfile>) => workerApi.updateProfile(changes),
    onSuccess: (_r, changes) => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      completeOnboarding({ trade: changes.trade, city: changes.location?.city });
      showToast(t('Your profile is ready.'), 'success');
    },
    onError: (e) => showToast(errorText(e, 'Could not save. Check your connection and try again.'), 'error'),
  });

  const validate = (): string | undefined => {
    if (step === 0) {
      if (!trade) return t('Choose your trade.');
      if (!experience) return t('Choose how much experience you have.');
    }
    if (step === 1) {
      const iso = joinDob(dob);
      if (!iso) return t('Enter your date of birth.');
      if (iso === 'invalid') return t('Enter a real date, like 15 / 08 / 1998.');
      if (ageOf(iso) < MIN_AGE) return t('You must be at least 18 years old.');
      if (city.trim().length < 2) return t('Enter your city or district.');
      if (!state) return t('Choose your state.');
    }
    if (step === 2) {
      if (!availability) return t('Choose when you can join.');
      const p = pay.trim() ? Number(pay) : undefined;
      if (p !== undefined && (p < 1000 || p > 500000)) return t('Enter the monthly pay in rupees, like 25000.');
    }
    return undefined;
  };

  const next = () => {
    const e = validate();
    setError(e);
    if (e) return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (step < STEPS - 1) return setStep(step + 1);
    const iso = joinDob(dob);
    save.mutate({
      trade,
      experience,
      dob: iso === 'invalid' ? undefined : iso,
      location: { city: city.trim(), state: state! },
      availability,
      expectedPay: pay.trim() ? Number(pay) : undefined,
    });
  };

  const back = () => {
    setError(undefined);
    setStep(step - 1);
  };

  const titles = [t('What work do you do?'), t('A few details about you'), t('When can you start?')];
  const hints = [
    t('Employers search by trade and experience.'),
    t('We need this to match you with jobs near you.'),
    t('You can change all of this later in your profile.'),
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.top}>
        {step > 0 ? (
          <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Back')} style={styles.back}>
            <ChevronLeft size={24} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <View style={styles.dots} accessibilityLabel={`${t('Step')} ${step + 1} / ${STEPS}`}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.ink }]}>{titles[step]}</Text>
        <Text style={[styles.hint, { color: colors.inkSecondary }]}>{hints[step]}</Text>

        {step === 0 && (
          <>
            <Label text={t('Your trade')} />
            <Chips
              options={(Object.keys(TRADE_LABEL) as Trade[]).map((k) => ({ key: k, label: t(TRADE_LABEL[k]) }))}
              value={trade}
              onPick={(k) => setTrade(k as Trade)}
            />
            <Label text={t('Experience')} />
            <Chips
              options={(Object.keys(EXPERIENCE_LABEL) as ExperienceBand[]).map((k) => ({ key: k, label: t(EXPERIENCE_LABEL[k]) }))}
              value={experience}
              onPick={(k) => setExperience(k as ExperienceBand)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Label text={t('Date of birth')} />
            <View style={styles.dobRow}>
              <Input
                containerStyle={styles.dobSmall}
                value={dob.d}
                onChangeText={(v) => setDob({ ...dob, d: v.replace(/\D/g, '').slice(0, 2) })}
                placeholder={t('Day')}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Input
                containerStyle={styles.dobSmall}
                value={dob.m}
                onChangeText={(v) => setDob({ ...dob, m: v.replace(/\D/g, '').slice(0, 2) })}
                placeholder={t('Month')}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Input
                containerStyle={styles.dobYear}
                value={dob.y}
                onChangeText={(v) => setDob({ ...dob, y: v.replace(/\D/g, '').slice(0, 4) })}
                placeholder={t('Year')}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <Input label={t('City or district')} value={city} onChangeText={setCity} placeholder={t('Where you live now')} />
            <Label text={t('State')} />
            <Chips options={INDIA_STATES.map((k) => ({ key: k, label: k }))} value={state} onPick={setState} />
          </>
        )}

        {step === 2 && (
          <>
            <Label text={t('I can join')} />
            <Chips
              options={(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => ({ key: k, label: t(AVAILABILITY_LABEL[k]) }))}
              value={availability}
              onPick={(k) => setAvailability(k as Availability)}
            />
            <Input
              label={t('Expected pay (₹ per month), optional')}
              value={pay}
              onChangeText={(v) => setPay(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="25000"
            />
          </>
        )}

        {error ? <Text style={[styles.error, { color: colors.dangerFg }]}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === STEPS - 1 ? t('Finish') : t('Continue')}
          icon={step === STEPS - 1 ? undefined : <ArrowRight size={18} color="#FFFFFF" />}
          iconPosition="right"
          onPress={next}
          loading={save.isPending}
        />
      </View>
    </Screen>
  );
};

const Label: React.FC<{ text: string }> = ({ text }) => {
  const colors = useUiStore((s) => s.colors);
  return <Text style={[styles.label, { color: colors.inkSecondary }]}>{text}</Text>;
};

const Chips: React.FC<{
  options: { key: string; label: string }[];
  value?: string;
  onPick: (key: string) => void;
}> = ({ options, value, onPick }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = value === o.key;
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
            <Text style={{ color: on ? colors.primary : colors.ink, fontWeight: on ? '700' : '500', fontSize: 15 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 28, height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  hint: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, justifyContent: 'center' },
  dobRow: { flexDirection: 'row', gap: 8 },
  dobSmall: { flex: 1 },
  dobYear: { flex: 1.5 },
  error: { fontSize: 14, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
