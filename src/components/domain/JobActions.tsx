import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { Sheet } from '../ui/Sheet';
import { t } from '../../lib/i18n';
import type { ReportReason } from '../../types';
import { formatPhone } from '../../lib/format';
import { errorText } from '../../lib/errors';
import { useNavigation } from '@react-navigation/native';

interface ApplyModalProps {
  visible: boolean;
  onClose: () => void;
  jobId: string;
  title: string;
  onTrackApplication?: (applicationId: string) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  visible,
  onClose,
  jobId,
  title,
  onTrackApplication,
}) => {
  const { colors, showToast } = useUiStore();
  const qc = useQueryClient();
  const [choice, setChoice] = useState<'profile' | string>('profile');
  const [doneId, setDoneId] = useState<string>();
  const [incomplete, setIncomplete] = useState<string>();
  const navigation = useNavigation<any>();

  const { data: profile } = useQuery({
    queryKey: queryKeys.worker.profile,
    queryFn: () => workerApi.getProfile(),
    enabled: visible,
  });

  const { data: docs } = useQuery({
    queryKey: queryKeys.worker.documents,
    queryFn: () => workerApi.getDocuments(),
    enabled: visible,
  });

  const resumes = docs?.filter((d) => d.type === 'resume') ?? [];

  const applyMutation = useMutation({
    mutationFn: () =>
      workerApi.applyJob(
        jobId,
        choice === 'profile' ? { sentWith: 'profile' } : { sentWith: 'document', documentId: choice }
      ),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDoneId(res.id);
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
    },
    // Closed job, already applied, incomplete profile...: say why in plain words.
    onError: (e: Error & { code?: string }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (e.code === 'PROFILE_INCOMPLETE') return setIncomplete(e.message);
      showToast(errorText(e, 'Could not apply. Try again.'), 'warning');
    },
  });

  const handleClose = () => {
    setDoneId(undefined);
    setIncomplete(undefined);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={doneId ? t('Applied!') : t('Apply Now')}
      subtitle={doneId ? undefined : title}
    >
          {doneId ? (
            <View style={styles.successBody}>
              <View style={[styles.successIconCircle, { backgroundColor: colors.successBg }]}>
                <CheckCircle2 size={44} color={colors.successFg} />
              </View>
              <Text style={[styles.successTitle, { color: colors.ink }]}>
                {t('Application sent')}
              </Text>
              <Text style={[styles.successDesc, { color: colors.inkSecondary }]}>
                {t("We'll notify you when the employer replies. You can track it in Applications.")}
              </Text>

              <View style={styles.successActions}>
                {onTrackApplication && (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      handleClose();
                      onTrackApplication(doneId);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>{t('Track application')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>{t('Done')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={[styles.fieldTitle, { color: colors.ink }]}>
                {t('What should we send?')}
              </Text>

              {/* Profile Choice */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setChoice('profile')}
                style={[
                  styles.optionCard,
                  {
                    borderColor: choice === 'profile' ? colors.primary : colors.border,
                    backgroundColor: choice === 'profile' ? colors.primarySoft : colors.surface,
                  },
                ]}
              >
                <View style={[styles.radioCircle, { borderColor: choice === 'profile' ? colors.primary : colors.borderStrong }]}>
                  {choice === 'profile' && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.ink }]}>
                    {t('My IndustriaLink profile')}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.inkSecondary }]}>
                    {t('Your trade, experience, skills and documents. Recommended.')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Resumes */}
              {resumes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.8}
                  onPress={() => setChoice(r.id)}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: choice === r.id ? colors.primary : colors.border,
                      backgroundColor: choice === r.id ? colors.primarySoft : colors.surface,
                    },
                  ]}
                >
                  <View style={[styles.radioCircle, { borderColor: choice === r.id ? colors.primary : colors.borderStrong }]}>
                    {choice === r.id && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: colors.ink }]}>{r.name}</Text>
                    <Text style={[styles.optionDesc, { color: colors.inkSecondary }]}>
                      {r.isDefaultResume ? t('Your default resume') : t('Resume')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Verified Phone Callout */}
              <View style={[styles.phoneCallout, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.phoneLabel, { color: colors.inkMuted }]}>
                  {t('Employer will call you on')}
                </Text>
                <Text style={[styles.phoneNumber, { color: colors.ink }]}>
                  {profile?.phone ? formatPhone(profile.phone) : '...'} <Text style={{ color: colors.successFg }}>✓ {t('verified')}</Text>
                </Text>
              </View>

              {incomplete ? (
                <View style={[styles.phoneCallout, { backgroundColor: colors.warningBg, marginTop: 12 }]}>
                  <Text style={{ color: colors.warningFg, fontSize: 14, lineHeight: 20 }}>{incomplete}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      handleClose();
                      navigation.navigate('WorkerTabs', { screen: 'WorkerProfile' });
                    }}
                    style={{ marginTop: 8 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{t('Complete my profile')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                disabled={applyMutation.isPending}
                onPress={() => applyMutation.mutate()}
              >
                {applyMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('Send application')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
    </Sheet>
  );
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  jobId: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'asks_money', label: 'They asked me for money' },
  { value: 'fake', label: 'Job looks fake' },
  { value: 'wrong_details', label: 'Pay or details are wrong' },
  { value: 'unsafe', label: 'Unsafe work' },
  { value: 'other', label: 'Something else' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, jobId }) => {
  const { colors, showToast } = useUiStore();
  const [reason, setReason] = useState<ReportReason>('asks_money');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const send = useMutation({
    mutationFn: () => workerApi.reportJob(jobId, reason, details),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 1500);
    },
    onError: (e: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(e.message || t('Could not send the report. Try again.'), 'warning');
    },
  });
  const handleSubmit = () => send.mutate();

  return (
    <Sheet visible={visible} onClose={onClose} title={t('Report this job')}>
          {submitted ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <CheckCircle2 size={36} color={colors.successFg} />
              <Text style={[styles.optionTitle, { color: colors.ink, marginTop: 8 }]}>
                {t('Thanks. Our team will check this job.')}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[styles.reportDesc, { color: colors.inkSecondary }]}>
                {t("Our team checks every report. The company won't see your name.")}
              </Text>

              <View style={{ gap: 8, marginVertical: 12 }}>
                {REPORT_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    style={[
                      styles.reasonOption,
                      {
                        borderColor: reason === r.value ? colors.primary : colors.border,
                        backgroundColor: reason === r.value ? colors.primarySoft : colors.surface,
                      },
                    ]}
                  >
                    <View style={[styles.radioCircle, { borderColor: reason === r.value ? colors.primary : colors.borderStrong }]}>
                      {reason === r.value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={[styles.reasonText, { color: colors.ink }]}>{t(r.label)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder={t('What happened? (optional)')}
                placeholderTextColor={colors.inkMuted}
                multiline
                numberOfLines={3}
                style={[
                  styles.detailsInput,
                  { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surfaceMuted },
                ]}
              />

              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.dangerFg, flex: 1 }]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.primaryBtnText}>{t('Send report')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sheetBody: {
    padding: 20,
  },
  fieldTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 16,
  },
  phoneCallout: {
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  phoneLabel: {
    fontSize: 12,
  },
  phoneNumber: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  successBody: {
    padding: 28,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  successDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  successActions: {
    width: '100%',
    gap: 10,
    marginTop: 24,
  },
  reportCard: {
    margin: 20,
    borderRadius: 18,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  reportDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13.5,
    textAlignVertical: 'top',
    height: 80,
    marginTop: 10,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});

