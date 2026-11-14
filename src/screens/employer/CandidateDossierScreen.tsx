import { ErrorState } from '../../components/ui/ErrorState';
import { GradientFill } from '../../components/ui/GradientFill';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { DocumentViewer } from '../../components/domain/DocumentViewer';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
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
} from '../../components/ui/icons';
import * as Haptics from 'expo-haptics';
import type { EmployerStackParamList } from '../../navigation/types';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { Screen } from '../../components/layout/Screen';
import { Avatar } from '../../components/ui/Avatar';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import {
  AVAILABILITY_LABEL,
  DOC_TYPE_LABEL,
  EXPERIENCE_LABEL,
  STAGE_LABEL,
  TRADE_LABEL,
} from '../../lib/labels';
import { formatBytes, formatPhone, timeAgo, formatDate, formatDateTime, formatNumber } from '../../lib/format';
import { ageOf } from '../../lib/dob';
import { errorText } from '../../lib/errors';
import { InterviewSheet, OfferSheet, RejectSheet, JoinedSheet } from '../../components/domain/PipelineSheets';
import { openContact } from '../../lib/contact';
import { t } from '../../lib/i18n';
import type { ApplicationStage, WorkerDocument } from '../../types';
import { shadows } from '../../theme/shadows';

type Props = NativeStackScreenProps<EmployerStackParamList, 'CandidateDossier'>;

export const CandidateDossierScreen: React.FC<Props> = ({ route, navigation }) => {
  const { candidateId } = route.params;
  const { colors, showToast } = useUiStore();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');
  const [viewDoc, setViewDoc] = useState<WorkerDocument | null>(null);

  // Sheets for stage progression. The key restarts a sheet's fields every time it opens.
  const [sheet, setSheet] = useState<null | 'interview' | 'offer' | 'reject' | 'joined'>(null);
  const [sheetKey, setSheetKey] = useState(0);
  const openSheet = (k: 'interview' | 'offer' | 'reject' | 'joined') => {
    setSheetKey((n) => n + 1);
    setSheet(k);
  };
  const [note, setNote] = useState<string | undefined>();

  const { data: candidates, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.employer.allCandidates({}),
    queryFn: () => employerApi.getAllCandidates({}),
  });

  const candidate = candidates?.find((c) => c.id === candidateId);

  // Opening a candidate tells the worker "Seen by employer" (once).
  const viewedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!candidate || viewedFor.current === candidate.id) return;
    viewedFor.current = candidate.id;
    employerApi.markViewed(candidate.id).then(() => qc.invalidateQueries({ queryKey: queryKeys.employer.all })).catch(() => {});
  }, [candidate, qc]);

  const updateStageMutation = useMutation({
    mutationFn: ({ stage, payload }: { stage: ApplicationStage; payload?: any }) =>
      employerApi.updateStage(candidate!.id, stage, payload),
    onSuccess: (_data, { stage }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      showToast(t(`Candidate stage updated to {stage}`, { stage: STAGE_LABEL[stage] }), 'success');
      setSheet(null);
    },
    onError: (e: Error) => showToast(errorText(e, 'Could not update. Try again.'), 'error'),
  });

  const company = useQuery({ queryKey: queryKeys.employer.company, queryFn: () => employerApi.getCompany() });
  const saveNote = useMutation({
    mutationFn: (text: string) => employerApi.saveNote(candidate!.id, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employer.all });
      showToast(t('Note saved'), 'success');
    },
    onError: (e: Error) => showToast(errorText(e, 'Could not save the note.'), 'error'),
  });

  if (isError || (!isLoading && !candidate)) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ErrorState
            onRetry={() => void refetch()}
            message={isError ? undefined : t('This application is not available. It may have been withdrawn or removed.')}
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12, padding: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('Go back')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

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

      <KeyboardScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity onPress={handleCall} style={[styles.callBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
            <GradientFill />
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
                style={[styles.stageActionBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}
              >
                <GradientFill />
                <CheckCircle2 size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Shortlist')}</Text>
              </TouchableOpacity>
            )}

            {(candidate.stage === 'applied' || candidate.stage === 'shortlisted') && (
              <TouchableOpacity
                onPress={() => openSheet('interview')}
                style={[styles.stageActionBtn, { backgroundColor: colors.tiles.purple.text }]}
              >
                <CalendarClock size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Schedule Interview')}</Text>
              </TouchableOpacity>
            )}

            {candidate.stage === 'interview' && (
              <>
                <TouchableOpacity onPress={() => openSheet('offer')} style={[styles.stageActionBtn, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                  <GradientFill />
                  <Gift size={15} color="#FFF" />
                  <Text style={styles.stageActionBtnText}>{t('Send Offer')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openSheet('interview')} style={[styles.stageActionBtnSecondary, { borderColor: colors.border }]}>
                  <CalendarClock size={15} color={colors.ink} />
                  <Text style={[styles.stageActionBtnSecondaryText, { color: colors.ink }]}>{t('Change interview')}</Text>
                </TouchableOpacity>
              </>
            )}

            {candidate.stage === 'offer' && (
              <TouchableOpacity onPress={() => openSheet('joined')} style={[styles.stageActionBtn, { backgroundColor: colors.successFg }]}>
                <CheckCircle2 size={15} color="#FFF" />
                <Text style={styles.stageActionBtnText}>{t('Mark joined')}</Text>
              </TouchableOpacity>
            )}

            {['applied', 'shortlisted', 'interview', 'offer'].includes(candidate.stage) && (
              <TouchableOpacity onPress={() => openSheet('reject')} style={[styles.stageActionBtnSecondary, { borderColor: colors.border }]}>
                <XCircle size={15} color={colors.dangerFg} />
                <Text style={[styles.stageActionBtnSecondaryText, { color: colors.dangerFg }]}>{t('Reject')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* What the worker said, and the key facts HR needs */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Key facts')}</Text>
          <Fact label={t('Age')} value={w.dob ? `${ageOf(w.dob)} ${t('years')}` : undefined} />
          <Fact label={t('Expected pay')} value={w.expectedPay ? `₹${formatNumber(w.expectedPay)} ${t('a month')}` : undefined} />
          <Fact label={t('Can join')} value={w.availability ? t(AVAILABILITY_LABEL[w.availability]) : undefined} />
          <Fact label={t('Languages')} value={w.languages?.length ? w.languages.join(', ') : undefined} />
          {candidate.match !== undefined ? <Fact label={t('Fit for this job')} value={`${candidate.match}%`} /> : null}
        </View>

        {candidate.interview ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Interview')}</Text>
            <Fact label={t('When')} value={formatDateTime(candidate.interview.at)} />
            <Fact label={t('Where')} value={candidate.interview.place} />
            <Fact label={t('Ask for')} value={candidate.interview.contactPerson} />
            <Fact label={t('Bring')} value={candidate.interview.bring} />
            <Fact
              label={t('Worker reply')}
              value={
                candidate.interview.response === 'attending'
                  ? t('Will attend')
                  : candidate.interview.response === 'cant_attend'
                    ? `${t('Cannot attend')}${candidate.interview.responseNote ? `: ${candidate.interview.responseNote}` : ''}`
                    : t('No reply yet')
              }
              tone={candidate.interview.response === 'cant_attend' ? 'bad' : candidate.interview.response === 'attending' ? 'good' : undefined}
            />
          </View>
        ) : null}

        {candidate.offer ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Offer')}</Text>
            <Fact label={t('Pay')} value={`₹${formatNumber(candidate.offer.pay)} ${candidate.offer.payPeriod === 'day' ? t('a day') : t('a month')}`} />
            <Fact label={t('Joining date')} value={candidate.offer.joiningDate ? formatDate(candidate.offer.joiningDate) : undefined} />
            <Fact label={t('Reply by')} value={candidate.offer.replyBy ? formatDate(candidate.offer.replyBy) : undefined} />
            <Fact
              label={t('Worker reply')}
              value={candidate.offerResponse === 'accepted' ? t('Accepted') : candidate.offerResponse === 'declined' ? t('Declined') : t('No reply yet')}
              tone={candidate.offerResponse === 'accepted' ? 'good' : candidate.offerResponse === 'declined' ? 'bad' : undefined}
            />
          </View>
        ) : null}

        {candidate.stage === 'hired' && candidate.joinedAt ? (
          <View style={[styles.infoCard, { backgroundColor: colors.tiles.green.bg, borderColor: colors.border }]}>
            <Text style={{ color: colors.tiles.green.text, fontWeight: '700' }}>{t('Joined on {date}', { date: formatDate(candidate.joinedAt) })}</Text>
          </View>
        ) : null}

        {candidate.stage === 'withdrawn' ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={{ color: colors.inkSecondary }}>{t('The worker withdrew this application.')}</Text>
          </View>
        ) : null}

        {/* Tab Switcher */}
        <SegmentedTabs
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'profile', label: t('Profile & Skills') },
            { key: 'documents', label: t('Documents') },
          ]}
        />

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
                <TouchableOpacity
                  key={d.id}
                  activeOpacity={0.8}
                  onPress={() => setViewDoc(d)}
                  accessibilityRole="button"
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
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.ink }]}>{t('Private note')}</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{t('Only you and your team can see this.')}</Text>
          <TextInput
            value={note ?? candidate.hrNote ?? ''}
            onChangeText={setNote}
            multiline
            maxLength={500}
            placeholder={t('e.g. Good welding test, call back on Monday')}
            placeholderTextColor={colors.placeholder}
            style={[styles.modalInput, { borderColor: colors.border, color: colors.ink, minHeight: 72, textAlignVertical: 'top' }]}
          />
          {note !== undefined && note !== (candidate.hrNote ?? '') ? (
            <TouchableOpacity onPress={() => saveNote.mutate(note)} style={[styles.modalBtnPrimary, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
              <GradientFill />
              <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Save note')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardScrollView>

      <DocumentViewer
        doc={viewDoc ? { ...viewDoc, typeLabel: DOC_TYPE_LABEL[viewDoc.type] } : null}
        audience="hr"
        onClose={() => setViewDoc(null)}
      />

      <InterviewSheet
        key={`i${sheetKey}`}
        visible={sheet === 'interview'}
        onClose={() => setSheet(null)}
        loading={updateStageMutation.isPending}
        name={w.name}
        sites={company.data?.sites ?? []}
        defaultPlace={candidate.interview?.place ?? company.data?.address ?? company.data?.sites?.[0]}
        rescheduling={candidate.stage === 'interview'}
        onSubmit={(payload) => updateStageMutation.mutate({ stage: 'interview', payload })}
      />
      <OfferSheet
        key={`o${sheetKey}`}
        visible={sheet === 'offer'}
        onClose={() => setSheet(null)}
        loading={updateStageMutation.isPending}
        name={w.name}
        defaultPay={w.expectedPay}
        defaultPlace={company.data?.address ?? company.data?.location.city}
        onSubmit={(payload) => updateStageMutation.mutate({ stage: 'offer', payload })}
      />
      <RejectSheet
        key={`r${sheetKey}`}
        visible={sheet === 'reject'}
        onClose={() => setSheet(null)}
        loading={updateStageMutation.isPending}
        onSubmit={(payload) => updateStageMutation.mutate({ stage: 'rejected', payload })}
      />
      <JoinedSheet
        key={`j${sheetKey}`}
        visible={sheet === 'joined'}
        onClose={() => setSheet(null)}
        loading={updateStageMutation.isPending}
        name={w.name}
        defaultDate={candidate.offer?.joiningDate}
        onSubmit={(joinedAt) => updateStageMutation.mutate({ stage: 'hired', payload: { joinedAt } })}
      />
    </Screen>
  );
};

const Fact: React.FC<{ label: string; value?: string; tone?: 'good' | 'bad' }> = ({ label, value, tone }) => {
  const colors = useUiStore((s) => s.colors);
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 }}>
      <Text style={{ color: colors.inkMuted, fontSize: 14 }}>{label}</Text>
      <Text
        style={{
          color: tone === 'good' ? colors.successFg : tone === 'bad' ? colors.dangerFg : colors.ink,
          fontSize: 14,
          fontWeight: '600',
          flexShrink: 1,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
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
    ...shadows.card,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    ...shadows.card,
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
    ...shadows.card,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    ...shadows.card,
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
    fontWeight: '700',
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
