import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  PartyPopper,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { WorkerStackParamList } from '../../navigation/types';
import { Dialog } from '../../components/ui/Dialog';
import { Screen } from '../../components/layout/Screen';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { formatDate, formatDateTime, formatNumber, formatPay } from '../../lib/format';
import { PAY_TYPE_LABEL, STAGE_LABEL_WORKER } from '../../lib/labels';
import { openContact } from '../../lib/contact';
import { t } from '../../lib/i18n';
import type { Offer } from '../../types';

type RouteProps = RouteProp<WorkerStackParamList, 'ApplicationDetail'>;
type NavProps = NativeStackNavigationProp<WorkerStackParamList>;

export const ApplicationDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { colors, showToast } = useUiStore();
  const qc = useQueryClient();
  const { applicationId } = route.params;

  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [askingInterview, setAskingInterview] = useState(false);
  const [interviewNote, setInterviewNote] = useState('');
  const [decliningOffer, setDecliningOffer] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const { data: a, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.worker.application(applicationId),
    queryFn: () => workerApi.getApplication(applicationId),
  });

  // Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: () => workerApi.withdrawApplication(applicationId),
    onSuccess: () => {
      setConfirmWithdraw(false);
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      showToast(t('Application withdrawn'), 'info');
      navigation.goBack();
    },
  });

  // Reply to Interview
  const interviewReplyMutation = useMutation({
    mutationFn: (response: 'attending' | 'cant_attend') =>
      workerApi.replyInterview(applicationId, response, response === 'cant_attend' ? interviewNote.trim() : undefined),
    onSuccess: (_d, r) => {
      setAskingInterview(false);
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      showToast(r === 'attending' ? t("HR knows you're coming") : t('HR will suggest a new time'), 'success');
    },
  });

  // Reply to Offer
  const offerReplyMutation = useMutation({
    mutationFn: (response: 'accepted' | 'declined') =>
      workerApi.replyOffer(applicationId, response, declineReason.trim() || undefined),
    onSuccess: (_d, r) => {
      setDecliningOffer(false);
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      showToast(r === 'accepted' ? t('Offer accepted. Congratulations!') : t('Offer declined'), 'success');
    },
  });

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !a) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.ink }]}>{t('Application not found')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryBtnText}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const job = a.job;
  const open = !['hired', 'rejected', 'withdrawn'].includes(a.stage);
  const canMessage = ['shortlisted', 'interview', 'offer', 'hired'].includes(a.stage);

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceMuted }]}
          accessibilityLabel={t('Back')}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.ink }]} numberOfLines={1}>
          {job.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Job Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryTopRow}>
            <CompanyLogo job={job} size="lg" />
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.summaryTitle, { color: colors.ink }]}>{job.title}</Text>
              </View>
              <Text style={[styles.summaryCompany, { color: colors.inkSecondary }]}>
                {job.companyName} · {job.location.city}
              </Text>
              <Text style={[styles.summaryPay, { color: colors.inkMuted }]}>
                {formatPay(job.payMin, job.payMax, job.payPeriod)} · {t('Applied {when}', { when: formatDate(a.appliedAt) })}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryActions, { borderTopColor: colors.border }]}>
            <View style={[styles.stagePill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.stagePillText, { color: colors.primary }]}>
                {t(STAGE_LABEL_WORKER[a.stage])}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
              style={[styles.viewJobBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.viewJobBtnText, { color: colors.ink }]}>{t('View job')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offer Section */}
        {a.stage === 'offer' && (
          <View style={[styles.offerCard, { backgroundColor: colors.surface, borderColor: colors.successFg }]}>
            <View style={styles.offerHeader}>
              <PartyPopper size={22} color={colors.successFg} />
              <Text style={[styles.offerTitle, { color: colors.ink }]}>
                {t('{company} sent you an offer!', { company: job.companyName })}
              </Text>
            </View>

            {a.offer && <OfferDetailsBox offer={a.offer} />}

            <Text style={[styles.offerInstruction, { color: colors.inkSecondary }]}>
              {t("Tell them if you'll take the job. Accept only if you plan to join.")}
            </Text>

            <View style={styles.offerBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  offerReplyMutation.mutate('accepted');
                }}
                disabled={offerReplyMutation.isPending}
                style={[styles.offerAcceptBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.offerAcceptText}>{t('Accept offer')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDecliningOffer(true)}
                style={[styles.offerDeclineBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.offerDeclineText, { color: colors.inkSecondary }]}>
                  {t('Decline')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hired Banner */}
        {a.stage === 'hired' && a.offer && (
          <View style={[styles.bannerSuccess, { backgroundColor: colors.successBg }]}>
            <PartyPopper size={20} color={colors.successFg} />
            <Text style={[styles.bannerSuccessText, { color: colors.successFg }]}>
              {t('Joining date')}: <Text style={{ fontWeight: '800' }}>{formatDate(a.offer.joiningDate)}</Text> · {a.offer.place}
            </Text>
          </View>
        )}

        {/* Interview Card */}
        {a.stage === 'interview' && a.interview && (
          <View style={[styles.interviewCard, { backgroundColor: colors.surface, borderColor: colors.tiles.purple.text }]}>
            <View style={styles.interviewHeader}>
              <CalendarClock size={20} color={colors.tiles.purple.text} />
              <Text style={[styles.interviewHeaderTitle, { color: colors.tiles.purple.text }]}>
                {t('Interview')}
              </Text>
            </View>

            <Text style={[styles.interviewTime, { color: colors.ink }]}>
              {formatDateTime(a.interview.at)}
            </Text>

            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.inkMuted} style={{ marginTop: 2 }} />
              <Text style={[styles.locationText, { color: colors.inkSecondary }]}>
                {a.interview.place}
              </Text>
            </View>

            {a.interview.contactPerson && (
              <Text style={[styles.askForText, { color: colors.inkSecondary }]}>
                {t('Ask for')}: <Text style={{ fontWeight: '700', color: colors.ink }}>{a.interview.contactPerson}</Text>
              </Text>
            )}

            <Text style={[styles.bringText, { color: colors.inkMuted }]}>
              {a.interview.bring
                ? `${t('Bring')}: ${a.interview.bring}`
                : t('Bring your Aadhaar, certificates and 2 passport photos.')}
            </Text>

            {/* Will You Come Buttons */}
            <View style={[styles.rsvpBox, { backgroundColor: colors.surfaceMuted }]}>
              {a.interview.response ? (
                <View style={styles.responseRow}>
                  <CheckCircle2 size={16} color={colors.successFg} />
                  <Text style={[styles.responseText, { color: colors.successFg }]}>
                    {a.interview.response === 'attending'
                      ? t("You confirmed you'll attend")
                      : t("You said you can't attend")}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.rsvpTitle, { color: colors.ink }]}>{t('Will you come?')}</Text>
                  <View style={styles.rsvpBtnRow}>
                    <TouchableOpacity
                      onPress={() => interviewReplyMutation.mutate('attending')}
                      disabled={interviewReplyMutation.isPending}
                      style={[styles.rsvpBtnPrimary, { backgroundColor: colors.primary }]}
                    >
                      <CheckCircle2 size={15} color="#FFFFFF" />
                      <Text style={styles.rsvpBtnPrimaryText}>{t("Yes, I'll attend")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setAskingInterview(!askingInterview)}
                      style={[styles.rsvpBtnSecondary, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.rsvpBtnSecondaryText, { color: colors.ink }]}>
                        {t("Can't make it")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {askingInterview && (
                    <View style={styles.askingBox}>
                      <TextInput
                        value={interviewNote}
                        onChangeText={setInterviewNote}
                        placeholder={t('Tell HR why, or a better time (optional)')}
                        placeholderTextColor={colors.inkMuted}
                        style={[styles.askingInput, { borderColor: colors.border, color: colors.ink }]}
                      />
                      <TouchableOpacity
                        onPress={() => interviewReplyMutation.mutate('cant_attend')}
                        style={[styles.sendNoteBtn, { backgroundColor: colors.inkSecondary }]}
                      >
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>
                          {t('Send to HR')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(a.interview!.place)}`)
              }
              style={[styles.mapBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.mapBtnText, { color: colors.ink }]}>{t('Open in Maps')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact HR Box */}
        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.contactTitle, { color: colors.ink }]}>
            {t('Contact the employer')}
          </Text>

          {canMessage && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ChatThread', {
                  threadId: a.id,
                  recipientName: `${job.companyName} HR`,
                })
              }
              style={[styles.messageHrRow, { backgroundColor: colors.primarySoft }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.messageHrText, { color: colors.ink }]}>
                  {t('Ask HR a question about this job.')}
                </Text>
              </View>
              <View style={[styles.messageHrBtn, { backgroundColor: colors.primary }]}>
                <MessageSquare size={14} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12.5 }}>
                  {t('Message HR')}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {a.contact ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.contactDesc, { color: colors.inkSecondary }]}>
                {t("You're shortlisted, so you can now contact HR.")}
                {a.contact.hours ? ` (${t('Call between')} ${a.contact.hours})` : ''}
              </Text>
              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  onPress={() => openContact('call', a.contact!.phone)}
                  style={[styles.dialBtn, { backgroundColor: colors.primary }]}
                >
                  <Phone size={15} color="#FFF" />
                  <Text style={styles.dialBtnText}>{t('Call HR')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openContact('whatsapp', a.contact!.phone)}
                  style={[styles.dialBtn, { backgroundColor: '#1FA855' }]}
                >
                  <MessageCircle size={15} color="#FFF" />
                  <Text style={styles.dialBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.lockedRow}>
              <Lock size={16} color={colors.inkMuted} style={{ marginTop: 2 }} />
              <Text style={[styles.lockedText, { color: colors.inkSecondary }]}>
                {open
                  ? job.allowCalls
                    ? t("HR's number appears here once you're shortlisted. Until then, the employer will contact you.")
                    : t('This employer contacts candidates directly. Keep your phone reachable.')
                  : t('This application is closed.')}
              </Text>
            </View>
          )}
        </View>

        {/* Withdraw Application */}
        {open && (
          <TouchableOpacity
            onPress={() => setConfirmWithdraw(true)}
            style={styles.withdrawBtn}
          >
            <Text style={[styles.withdrawBtnText, { color: colors.dangerFg }]}>
              {t('Withdraw application')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirm Withdraw Modal */}
      <Dialog
        visible={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        title={t('Withdraw this application?')}
        message={t("The employer will no longer see your application, and you can't apply to this job again.")}
        actions={
          <>
          <TouchableOpacity
            onPress={() => setConfirmWithdraw(false)}
            style={[styles.dialogBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => withdrawMutation.mutate()}
            disabled={withdrawMutation.isPending}
            style={[styles.dialogBtn, { backgroundColor: colors.dangerFg }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Withdraw')}</Text>
          </TouchableOpacity>
          </>
        }
      >
      </Dialog>

      {/* Decline Offer Modal */}
      <Dialog
        visible={decliningOffer}
        onClose={() => setDecliningOffer(false)}
        title={t('Decline this offer?')}
        message={t('The employer will be told, and this application will close.')}
        actions={
          <>
          <TouchableOpacity
            onPress={() => setDecliningOffer(false)}
            style={[styles.dialogBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => offerReplyMutation.mutate('declined')}
            disabled={offerReplyMutation.isPending}
            style={[styles.dialogBtn, { backgroundColor: colors.dangerFg }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Decline offer')}</Text>
          </TouchableOpacity>
          </>
        }
      >
        <TextInput
          value={declineReason}
          onChangeText={setDeclineReason}
          placeholder={t('Reason (optional), e.g. Got a job closer to home')}
          placeholderTextColor={colors.inkMuted}
          style={[styles.askingInput, { borderColor: colors.border, color: colors.ink, marginVertical: 12 }]}
        />
      </Dialog>
    </Screen>
  );
};

function OfferDetailsBox({ offer }: { offer: Offer }) {
  const { colors } = useUiStore();
  return (
    <View style={[styles.offerDetailsBox, { backgroundColor: colors.surfaceMuted }]}>
      <View style={styles.offerDetailItem}>
        <Text style={[styles.offerDetailLabel, { color: colors.inkMuted }]}>{t('Pay')}</Text>
        <Text style={[styles.offerDetailValue, { color: colors.ink }]}>
          ₹{formatNumber(offer.pay)} / {t(offer.payPeriod)}
          {offer.payType ? ` · ${t(PAY_TYPE_LABEL[offer.payType])}` : ''}
        </Text>
      </View>
      <View style={styles.offerDetailItem}>
        <Text style={[styles.offerDetailLabel, { color: colors.inkMuted }]}>{t('Joining date')}</Text>
        <Text style={[styles.offerDetailValue, { color: colors.ink }]}>
          {formatDate(offer.joiningDate)}
        </Text>
      </View>
      <View style={styles.offerDetailItem}>
        <Text style={[styles.offerDetailLabel, { color: colors.inkMuted }]}>{t('Report at')}</Text>
        <Text style={[styles.offerDetailValue, { color: colors.ink }]}>{offer.place}</Text>
      </View>
      {offer.note && (
        <View style={styles.offerDetailItem}>
          <Text style={[styles.offerDetailLabel, { color: colors.inkMuted }]}>{t('Note from HR')}</Text>
          <Text style={[styles.offerDetailValue, { color: colors.ink }]}>{offer.note}</Text>
        </View>
      )}
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
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  summaryCompany: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  summaryPay: {
    fontSize: 12,
    marginTop: 3,
  },
  summaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 14,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewJobBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  viewJobBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  offerDetailsBox: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  offerDetailItem: {
    gap: 2,
  },
  offerDetailLabel: {
    fontSize: 11.5,
  },
  offerDetailValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  offerInstruction: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  offerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  offerAcceptBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerAcceptText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  offerDeclineBtn: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerDeclineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  bannerSuccessText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  interviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  interviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interviewHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  interviewTime: {
    fontSize: 18,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  askForText: {
    fontSize: 13,
  },
  bringText: {
    fontSize: 12,
  },
  rsvpBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 10,
  },
  rsvpTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rsvpBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rsvpBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 20,
  },
  rsvpBtnPrimaryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rsvpBtnSecondary: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rsvpBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  askingBox: {
    gap: 8,
    marginTop: 6,
  },
  askingInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
  },
  sendNoteBtn: {
    height: 44,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mapBtn: {
    height: 44,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  messageHrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  messageHrText: {
    fontSize: 13,
  },
  messageHrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  contactDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 21,
  },
  dialBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lockedText: {
    fontSize: 12.5,
    lineHeight: 17,
    flex: 1,
  },
  withdrawBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  withdrawBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmDialog: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  confirmMsg: {
    fontSize: 13,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  dialogBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});

