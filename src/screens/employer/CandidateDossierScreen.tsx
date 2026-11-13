import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  Award,
  FileText,
  Briefcase,
  XCircle,
  ChevronLeft,
  CalendarClock,
  Gift,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { EmployerStackParamList } from '../../navigation/types';
import { Sheet } from '../../components/ui/Sheet';
import { Screen } from '../../components/layout/Screen';
import { Avatar } from '../../components/ui/Avatar';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import {
  DOC_TYPE_LABEL,
  EXPERIENCE_LABEL,
  STAGE_LABEL,
  TRADE_LABEL,
} from '../../lib/labels';
import { formatBytes, formatPhone, timeAgo } from '../../lib/format';
import { openContact } from '../../lib/contact';
import { t } from '../../lib/i18n';
import type { ApplicationStage } from '../../types';

type Props = NativeStackScreenProps<EmployerStackParamList, 'CandidateDossier'>;

export const CandidateDossierScreen: React.FC<Props> = ({ route, navigation }) => {
  const { candidateId } = route.params;
  const { colors, showToast } = useUiStore();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');

  // Modals for stage progression
  const [interviewModal, setInterviewModal] = useState(false);
  const [interviewAt, setInterviewAt] = useState('2026-11-20T10:30');
  const [interviewPlace, setInterviewPlace] = useState('Gate 3, Plant Site, Kalinganagar');

  const [offerModal, setOfferModal] = useState(false);
  const [offerPay, setOfferPay] = useState('22000');
  const [offerJoiningDate, setOfferJoiningDate] = useState('2026-12-01');

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: candidates, isLoading } = useQuery({
    queryKey: queryKeys.employer.allCandidates({}),
    queryFn: () => employerApi.getAllCandidates({}),
  });

  const candidate = candidates?.find((c) => c.id === candidateId) || candidates?.[0];

  const updateStageMutation = useMutation({
    mutationFn: ({ stage, payload }: { stage: ApplicationStage; payload?: any }) =>
      employerApi.updateStage(candidate!.id, stage, payload),
    onSuccess: (_data, { stage }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      showToast(t(`Candidate stage updated to {stage}`, { stage: STAGE_LABEL[stage] }), 'success');
      setInterviewModal(false);
      setOfferModal(false);
      setRejectModal(false);
    },
  });

  if (isLoading || !candidate) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const w = candidate.worker;

  const handleCall = () => {
    openContact('call', w.phone);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceMuted }]}
          accessibilityLabel={t('Back')}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.ink }]} numberOfLines={1}>
          {w.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Worker Profile Header Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <Avatar name={w.name} src={w.photoUrl} size="lg" />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.workerName, { color: colors.ink }]}>{w.name}</Text>
              </View>
              <Text style={[styles.workerTrade, { color: colors.inkSecondary }]}>
                {w.trade ? TRADE_LABEL[w.trade] : '—'} · {w.experience ? EXPERIENCE_LABEL[w.experience] : '—'}
              </Text>
              <Text style={[styles.workerLoc, { color: colors.inkMuted }]}>
                {w.location ? `${w.location.city}, ${w.location.state}` : '—'}
              </Text>
            </View>
          </View>

          {/* Quick Call Button */}
          <TouchableOpacity onPress={handleCall} style={[styles.callBtn, { backgroundColor: colors.primary }]}>
            <Phone size={16} color="#FFF" />
            <Text style={styles.callBtnText}>{formatPhone(w.phone)} · Call Candidate</Text>
          </TouchableOpacity>

          {/* Messages open once the worker is shortlisted */}
          {['shortlisted', 'interview', 'offer', 'hired'].includes(candidate.stage) && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatThread', { threadId: candidate.id, recipientName: w.name })}
              style={[styles.msgBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
            >
              <MessageCircle size={16} color={colors.primary} />
              <Text style={[styles.msgBtnText, { color: colors.primary }]}>Message {w.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Applied For & Stage Badge */}
        <View style={[styles.appliedBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appliedForLabel, { color: colors.inkMuted }]}>Applied for</Text>
            <Text style={[styles.appliedForTitle, { color: colors.ink }]}>{candidate.jobTitle}</Text>
          </View>
          <View
            style={[
              styles.stageBadge,
              {
                backgroundColor:
                  candidate.stage === 'interview'
                    ? colors.tiles.purple.bg
                    : candidate.stage === 'offer' || candidate.stage === 'hired'
                    ? colors.tiles.green.bg
                    : candidate.stage === 'shortlisted'
                    ? colors.primarySoft
                    : colors.surfaceStrong,
              },
            ]}
          >
            <Text
              style={[
                styles.stageBadgeText,
                {
                  color:
                    candidate.stage === 'interview'
                      ? colors.tiles.purple.text
                      : candidate.stage === 'offer' || candidate.stage === 'hired'
                      ? colors.tiles.green.text
                      : candidate.stage === 'shortlisted'
                      ? colors.primary
                      : colors.inkSecondary,
                },
              ]}
            >
              {STAGE_LABEL[candidate.stage]}
            </Text>
          </View>
        </View>

        {/* Pipeline Stage Movement Actions */}
        <View style={styles.stageActionsWrap}>
          <Text style={[styles.stageActionsTitle, { color: colors.ink }]}>Next step</Text>
          <View style={styles.actionButtonsRow}>
            {candidate.stage === 'applied' && (
              <TouchableOpacity
                onPress={() => updateStageMutation.mutate({ stage: 'shortlisted' })}
                style={[styles.stageActionBtn, { backgroundColor: colors.primary }]}
              >
                <CheckCircle2 size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Shortlist')}</Text>
              </TouchableOpacity>
            )}

            {(candidate.stage === 'applied' || candidate.stage === 'shortlisted') && (
              <TouchableOpacity
                onPress={() => setInterviewModal(true)}
                style={[styles.stageActionBtn, { backgroundColor: colors.tiles.purple.text }]}
              >
                <CalendarClock size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Schedule Interview')}</Text>
              </TouchableOpacity>
            )}

            {candidate.stage === 'interview' && (
              <TouchableOpacity
                onPress={() => setOfferModal(true)}
                style={[styles.stageActionBtn, { backgroundColor: colors.primary }]}
              >
                <Gift size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Send Offer')}</Text>
              </TouchableOpacity>
            )}

            {candidate.stage === 'offer' && (
              <TouchableOpacity
                onPress={() => updateStageMutation.mutate({ stage: 'hired' })}
                style={[styles.stageActionBtn, { backgroundColor: colors.successFg }]}
              >
                <CheckCircle2 size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Mark Hired')}</Text>
              </TouchableOpacity>
            )}

            {candidate.stage !== 'rejected' && (
              <TouchableOpacity
                onPress={() => setRejectModal(true)}
                style={[styles.stageActionBtnSecondary, { borderColor: colors.border }]}
              >
                <XCircle size={15} color={colors.dangerFg} />
                <Text style={[styles.stageActionBtnSecondaryText, { color: colors.dangerFg }]}>
                  {t('Reject')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabsWrap, { backgroundColor: colors.surfaceMuted }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            style={[styles.tabBtn, activeTab === 'profile' && { backgroundColor: colors.inkFill }]}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'profile' ? colors.onInk : colors.inkSecondary }]}>
              {t('Profile & Skills')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('documents')}
            style={[styles.tabBtn, activeTab === 'documents' && { backgroundColor: colors.inkFill }]}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'documents' ? colors.onInk : colors.inkSecondary }]}>
              {t('Documents')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Profile & Skills */}
        {activeTab === 'profile' ? (
          <View style={{ gap: 14 }}>
            {/* Key Qualifications */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Qualifications & Licences')}</Text>
              <View style={styles.chipRow}>
                {w.qualifications.map((q) => (
                  <View key={q} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.chipText, { color: colors.primary }]}>{q}</Text>
                  </View>
                ))}
                {w.licences.map((lic) => (
                  <View key={lic} style={[styles.chip, { backgroundColor: colors.tiles.yellow.bg }]}>
                    <Text style={[styles.chipText, { color: colors.tiles.yellow.text }]}>{lic}</Text>
                  </View>
                ))}
              </View>

              {w.safetyTrainingHours ? (
                <Text style={[styles.trainingText, { color: colors.inkSecondary }]}>
                  {t('{n} hours safety training', { n: w.safetyTrainingHours })}
                </Text>
              ) : null}
            </View>

            {/* Skills */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Skills')}</Text>
              <View style={styles.chipRow}>
                {w.skills.map((s) => (
                  <View key={s} style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.chipText, { color: colors.ink }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Past Work History */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Past Work Experience')}</Text>
              {w.workHistory?.length ? (
                w.workHistory.map((item, idx) => (
                  <View key={idx} style={styles.workHistoryItem}>
                    <Briefcase size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.whRole, { color: colors.ink }]}>{item.role}</Text>
                      <Text style={[styles.whCompany, { color: colors.inkSecondary }]}>
                        {item.company} · {item.from}–{item.to || 'Present'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.inkMuted }}>No work history provided.</Text>
              )}
            </View>
          </View>
        ) : (
          /* Tab 2: Documents the worker shared */
          <View style={{ gap: 10 }}>
            {candidate.documents.length === 0 ? (
              <View style={[styles.docItem, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <FileText size={22} color={colors.inkMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docName, { color: colors.ink }]}>No files shared</Text>
                  <Text style={[styles.docMeta, { color: colors.inkSecondary }]}>
                    {w.name.split(' ')[0]} applied with their profile. Ask them to bring certificates to the interview.
                  </Text>
                </View>
              </View>
            ) : (
              candidate.documents.map((d) => (
                <View
                  key={d.id}
                  style={[styles.docItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {d.type === 'resume' ? (
                    <FileText size={22} color={colors.primary} />
                  ) : (
                    <Award size={22} color={colors.tiles.yellow.text} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.docName, { color: colors.ink }]} numberOfLines={1}>
                      {DOC_TYPE_LABEL[d.type]}
                    </Text>
                    <Text style={[styles.docMeta, { color: colors.inkMuted }]} numberOfLines={1}>
                      {d.name} · {formatBytes(d.sizeBytes)} · {timeAgo(d.uploadedAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Schedule Interview Modal */}
      <Sheet
        visible={interviewModal}
        onClose={() => setInterviewModal(false)}
        title={t('Schedule interview')}
        subtitle={`Invite ${w.name} for an on-site interview.`}
        footer={
          <View style={styles.modalBtnRow}>
          <TouchableOpacity
            onPress={() => setInterviewModal(false)}
            style={[styles.modalBtnSecondary, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              updateStageMutation.mutate({
                stage: 'interview',
                payload: { at: interviewAt, place: interviewPlace },
              })
            }
            style={[styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Schedule')}</Text>
          </TouchableOpacity>
          </View>
        }
      >

        <TextInput
          value={interviewAt}
          onChangeText={setInterviewAt}
          placeholder="Date & Time (YYYY-MM-DDTHH:MM)"
          style={[styles.modalInput, { borderColor: colors.border, color: colors.ink }]}
        />

        <TextInput
          value={interviewPlace}
          onChangeText={setInterviewPlace}
          placeholder="Interview Location / Plant Gate"
          style={[styles.modalInput, { borderColor: colors.border, color: colors.ink }]}
        />

      </Sheet>

      {/* Send Offer Modal */}
      <Sheet
        visible={offerModal}
        onClose={() => setOfferModal(false)}
        title={t('Send Job Offer')}
        subtitle={`Make an official offer to ${w.name}.`}
        footer={
          <View style={styles.modalBtnRow}>
          <TouchableOpacity
            onPress={() => setOfferModal(false)}
            style={[styles.modalBtnSecondary, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              updateStageMutation.mutate({
                stage: 'offer',
                payload: { pay: parseInt(offerPay, 10), joiningDate: offerJoiningDate },
              })
            }
            style={[styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Send Offer')}</Text>
          </TouchableOpacity>
          </View>
        }
      >

        <TextInput
          value={offerPay}
          onChangeText={setOfferPay}
          placeholder="Monthly Pay (₹)"
          keyboardType="numeric"
          style={[styles.modalInput, { borderColor: colors.border, color: colors.ink }]}
        />

        <TextInput
          value={offerJoiningDate}
          onChangeText={setOfferJoiningDate}
          placeholder="Joining Date (YYYY-MM-DD)"
          style={[styles.modalInput, { borderColor: colors.border, color: colors.ink }]}
        />

      </Sheet>

      {/* Reject Modal */}
      <Sheet
        visible={rejectModal}
        onClose={() => setRejectModal(false)}
        title={t('Reject Candidate?')}
        subtitle={`Candidate will be notified politely that they were not selected this time.`}
        footer={
          <View style={styles.modalBtnRow}>
          <TouchableOpacity
            onPress={() => setRejectModal(false)}
            style={[styles.modalBtnSecondary, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateStageMutation.mutate({ stage: 'rejected' })}
            style={[styles.modalBtnPrimary, { backgroundColor: colors.dangerFg }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Reject')}</Text>
          </TouchableOpacity>
          </View>
        }
      >

        <TextInput
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="Reason (e.g. Position filled, experience required)"
          style={[styles.modalInput, { borderColor: colors.border, color: colors.ink }]}
        />

      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 44,
    height: 44,
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
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  workerTrade: {
    fontSize: 13,
    marginTop: 2,
  },
  workerLoc: {
    fontSize: 12,
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  msgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  msgBtnText: { fontSize: 14, fontWeight: '700' },
  callBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  appliedForLabel: {
    fontSize: 11.5,
  },
  appliedForTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageActionsWrap: {
    gap: 8,
  },
  stageActionsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 20,
  },
  stageActionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stageActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
  },
  stageActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabsWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 22,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trainingText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  workHistoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  whRole: {
    fontSize: 14,
    fontWeight: '700',
  },
  whCompany: {
    fontSize: 12.5,
    marginTop: 1,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
  },
  docMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
  },
  modalInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalBtnPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
