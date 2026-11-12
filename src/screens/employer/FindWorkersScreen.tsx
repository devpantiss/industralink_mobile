import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Send,
  MapPin,
  EyeOff,
  UserSearch,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import {
  AVAILABILITY_LABEL,
  EXPERIENCE_LABEL,
  TRADE_LABEL,
} from '../../lib/labels';
import { formatNumber } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { ExperienceBand, TalentProfile, Trade } from '../../types';

export const FindWorkersScreen: React.FC = () => {
  const { colors, showToast } = useUiStore();
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [trade, setTrade] = useState<Trade | ''>('');
  const [city, setCity] = useState('');
  const [invitingWorker, setInvitingWorker] = useState<TalentProfile | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const { data: workers, isLoading, refetch } = useQuery({
    queryKey: queryKeys.employer.talent({ trade: trade || undefined, city: city || undefined }),
    queryFn: () => employerApi.searchTalent({ trade: trade || undefined, city: city || undefined }),
  });

  const { data: activeJobs } = useQuery({
    queryKey: queryKeys.employer.jobs('active'),
    queryFn: () => employerApi.getJobs('active'),
  });

  const inviteMutation = useMutation({
    mutationFn: ({ workerId, jobId }: { workerId: string; jobId: string }) =>
      employerApi.inviteTalent(workerId, jobId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['employer', 'talent'] });
      showToast(t('Invitation sent! Worker notified via push and SMS.'), 'success');
      setInvitingWorker(null);
    },
  });

  const filtered = (workers ?? []).filter((w) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      w.name.toLowerCase().includes(s) ||
      (w.skills && w.skills.some((sk) => sk.toLowerCase().includes(s))) ||
      (w.licences && w.licences.some((l) => l.toLowerCase().includes(s)))
    );
  });

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('Find workers')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
            {t('Search workers who want to be found, and invite them to apply.')}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Search size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('Skill, licence or name (e.g. MIG, DGMS)')}
            placeholderTextColor={colors.inkMuted}
            style={[styles.searchInput, { color: colors.ink }]}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')}>
              <Text style={{ color: colors.inkMuted, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Trade Filter Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tradesRow}
        >
          <TouchableOpacity
            onPress={() => setTrade('')}
            style={[
              styles.tradeChip,
              {
                backgroundColor: !trade ? colors.primary : colors.surfaceMuted,
                borderColor: !trade ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ color: !trade ? '#FFF' : colors.inkSecondary, fontWeight: '600', fontSize: 13 }}>
              {t('Any trade')}
            </Text>
          </TouchableOpacity>
          {(Object.keys(TRADE_LABEL) as Trade[]).map((tr) => (
            <TouchableOpacity
              key={tr}
              onPress={() => setTrade(trade === tr ? '' : tr)}
              style={[
                styles.tradeChip,
                {
                  backgroundColor: trade === tr ? colors.primary : colors.surfaceMuted,
                  borderColor: trade === tr ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: trade === tr ? '#FFF' : colors.inkSecondary, fontWeight: '600', fontSize: 13 }}>
                {TRADE_LABEL[tr]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Privacy Note */}
        <View style={[styles.privacyBox, { backgroundColor: colors.surfaceMuted }]}>
          <EyeOff size={16} color={colors.inkMuted} />
          <Text style={[styles.privacyText, { color: colors.inkMuted }]}>
            {t('Phone numbers and documents stay hidden until a worker applies to your job.')}
          </Text>
        </View>

        {/* Workers List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
            <UserSearch size={36} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>{t('No workers match')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.inkSecondary }]}>
              {t('Try fewer filters, or search another trade.')}
            </Text>
          </View>
        ) : (
          filtered.map((w) => (
            <View
              key={w.userId}
              style={[styles.workerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.workerTopRow}>
                <Avatar name={w.name} src={w.photoUrl} size="md" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workerName, { color: colors.ink }]}>{w.name}</Text>
                  <Text style={[styles.workerTrade, { color: colors.inkSecondary }]}>
                    {w.trade ? TRADE_LABEL[w.trade] : 'Trade not given'} · {w.experience ? EXPERIENCE_LABEL[w.experience] : '—'}
                  </Text>
                  <Text style={[styles.workerLocation, { color: colors.inkMuted }]}>
                    {w.location ? `${w.location.city}, ${w.location.state}` : '—'}
                    {w.willingToRelocate ? ' · ready to move' : ''}
                  </Text>
                </View>
                {w.expectedPay ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.payValue, { color: colors.ink }]}>
                      ₹{formatNumber(w.expectedPay)}
                    </Text>
                    <Text style={[styles.payUnit, { color: colors.inkMuted }]}>expects / mo</Text>
                  </View>
                ) : null}
              </View>

              {/* Badges */}
              <View style={styles.badgesRow}>
                {[...w.qualifications, ...w.licences].map((badge) => (
                  <View key={badge} style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
                  </View>
                ))}
                {w.safetyTrainingHours ? (
                  <View style={[styles.badge, { backgroundColor: colors.tiles.green.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.tiles.green.text }]}>
                      {w.safetyTrainingHours}h safety training
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Skills */}
              {w.skills.length > 0 && (
                <Text style={[styles.skillsText, { color: colors.inkSecondary }]} numberOfLines={1}>
                  {w.skills.join(' · ')}
                </Text>
              )}

              {/* Footer Row */}
              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.availabilityText, { color: colors.inkMuted }]}>
                  {AVAILABILITY_LABEL[w.availability]}
                </Text>

                <TouchableOpacity
                  onPress={() => setInvitingWorker(w)}
                  style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
                >
                  <Send size={14} color="#FFF" />
                  <Text style={styles.inviteBtnText}>{t('Invite to apply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Invite Modal */}
      {invitingWorker && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.ink }]}>
                  {t('Invite {name} to apply', { name: invitingWorker.name })}
                </Text>
                <TouchableOpacity onPress={() => setInvitingWorker(null)}>
                  <X size={20} color={colors.inkMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalDesc, { color: colors.inkSecondary }]}>
                {t("They'll get a notification with a direct link to this job.")}
              </Text>

              <Text style={[styles.selectJobLabel, { color: colors.ink }]}>{t('Which job?')}</Text>
              <View style={{ gap: 8 }}>
                {activeJobs?.map((j) => {
                  const isSelected = selectedJobId === j.id;
                  return (
                    <TouchableOpacity
                      key={j.id}
                      onPress={() => setSelectedJobId(j.id)}
                      style={[
                        styles.jobSelectOption,
                        {
                          backgroundColor: isSelected ? colors.primarySoft : colors.surfaceMuted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.jobOptionTitle, { color: colors.ink }]}>{j.title}</Text>
                      <Text style={[styles.jobOptionMeta, { color: colors.inkMuted }]}>
                        {j.location.city} · {j.openings} openings
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setInvitingWorker(null)}
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    inviteMutation.mutate({
                      workerId: invitingWorker.userId,
                      jobId: selectedJobId || activeJobs?.[0]?.id || '',
                    })
                  }
                  disabled={inviteMutation.isPending}
                  style={[styles.modalSendBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Send invite')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 14,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
  },
  searchBar: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tradesRow: {
    gap: 8,
  },
  tradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  workerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  workerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  workerName: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  workerTrade: {
    fontSize: 12.5,
    marginTop: 2,
  },
  workerLocation: {
    fontSize: 11.5,
    marginTop: 1,
  },
  payValue: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  payUnit: {
    fontSize: 10.5,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skillsText: {
    fontSize: 12.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  availabilityText: {
    fontSize: 12,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
  },
  inviteBtnText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectJobLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 4,
  },
  jobSelectOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 2,
  },
  jobOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  jobOptionMeta: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSendBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
