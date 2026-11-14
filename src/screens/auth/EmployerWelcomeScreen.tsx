import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/effects';
import { Chip } from '../../components/ui/Chip';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { View, StyleSheet, Pressable } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ArrowRight, ChevronLeft } from '../../components/ui/icons';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { SECTOR_LABEL, HIRING_TYPE_LABEL, INDIA_STATES } from '../../lib/labels';
import { isValidPhone, errorText } from '../../lib/errors';
import { t } from '../../lib/i18n';
import type { Sector, HiringType } from '../../types';

const STEPS = 2;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Two short screens: the company, then where it is and who to call. Documents are added later on the Company page. */
export const EmployerWelcomeScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const showToast = useUiStore((s) => s.showToast);
  const { user, completeOnboarding } = useAuthStore();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.companyName ?? '');
  const [hiringType, setHiringType] = useState<HiringType | undefined>();
  const [sector, setSector] = useState<Sector | undefined>();
  const [gst, setGst] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<string | undefined>();
  const [hrName, setHrName] = useState(user?.name ?? '');
  const [hrPhone, setHrPhone] = useState('');
  const [error, setError] = useState<string | undefined>();

  const save = useMutation({
    mutationFn: () =>
      employerApi.updateCompany({
        name: name.trim(),
        hiringType,
        sector,
        gstNumber: gst || undefined,
        location: { city: city.trim(), state: state! },
        hrName: hrName.trim(),
        hrPhone,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employer.company });
      completeOnboarding({ companyName: name.trim(), city: city.trim() });
      showToast(t('Company saved. Add your GST certificate on the Company page to get approved.'), 'success');
    },
    onError: (e) => showToast(errorText(e, 'Could not save. Check your connection and try again.'), 'error'),
  });

  const validate = (): string | undefined => {
    if (step === 0) {
      if (name.trim().length < 2) return t('Enter your company name.');
      if (!hiringType) return t('Choose how you hire.');
      if (!sector) return t('Choose your industry.');
      if (gst && !GSTIN.test(gst)) return t('A GST number has 15 characters, like 21ABCDE1234F1Z5.');
    } else {
      if (city.trim().length < 2) return t('Enter the city of your main site.');
      if (!state) return t('Choose the state.');
      if (hrName.trim().length < 2) return t('Enter the name of the person to contact.');
      if (!isValidPhone(hrPhone)) return t('Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.');
    }
    return undefined;
  };

  const next = () => {
    const e = validate();
    setError(e);
    if (e) return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (step < STEPS - 1) return setStep(step + 1);
    save.mutate();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.top}>
        {step > 0 ? (
          <Pressable onPress={() => { setError(undefined); setStep(step - 1); }} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Back')} style={styles.back}>
            <ChevronLeft size={24} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <View style={styles.dots} accessibilityLabel={`${t('Step')} ${step + 1} / ${STEPS}`}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: colors.border }]}>
              {i <= step && (
                <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.back} />
      </View>

      <KeyboardScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.ink }]}>{step === 0 ? t('Tell us about your company') : t('Where are you, and who do we call?')}</Text>
        <Text style={[styles.hint, { color: colors.inkSecondary }]}>
          {step === 0
            ? t('Workers see your company name on every job you post.')
            : t('Our team may call to check your company. Workers do not see this number.')}
        </Text>

        {step === 0 ? (
          <>
            <Input label={t('Company name')} value={name} onChangeText={setName} />
            <Label text={t('You hire as')} />
            <Chips
              options={(Object.keys(HIRING_TYPE_LABEL) as HiringType[]).map((k) => ({ key: k, label: t(HIRING_TYPE_LABEL[k]) }))}
              value={hiringType}
              onPick={(k) => setHiringType(k as HiringType)}
            />
            <Label text={t('Industry')} />
            <Chips
              options={(Object.keys(SECTOR_LABEL) as Sector[]).map((k) => ({ key: k, label: t(SECTOR_LABEL[k]) }))}
              value={sector}
              onPick={(k) => setSector(k as Sector)}
            />
            <Input
              label={t('GST number (optional now)')}
              value={gst}
              onChangeText={(g) => setGst(g.toUpperCase())}
              autoCapitalize="characters"
              maxLength={15}
            />
          </>
        ) : (
          <>
            <Input label={t('City of your main site')} value={city} onChangeText={setCity} />
            <Label text={t('State')} />
            <Chips options={INDIA_STATES.map((k) => ({ key: k, label: k }))} value={state} onPick={setState} />
            <Input label={t('Contact person')} value={hrName} onChangeText={setHrName} autoComplete="name" />
            <Input
              label={t('Contact mobile number')}
              value={hrPhone}
              onChangeText={(v) => setHrPhone(v.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </>
        )}

        {error ? <Text style={[styles.error, { color: colors.dangerFg }]}>{error}</Text> : null}
      </KeyboardScrollView>

      <View style={styles.footer}>
        <Button
          label={step === STEPS - 1 ? t('Save company') : t('Continue')}
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

const Chips: React.FC<{ options: { key: string; label: string }[]; value?: string; onPick: (key: string) => void }> = ({ options, value, onPick }) => (
  <View style={styles.chips}>
    {options.map((o) => (
      <Chip key={o.key} label={o.label} selected={value === o.key} onPress={() => onPick(o.key)} style={styles.chipBig} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 28, height: 5, borderRadius: 3, overflow: 'hidden' },
  chipBig: { minHeight: 44, paddingHorizontal: 16 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  hint: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, justifyContent: 'center' },
  error: { fontSize: 14, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
