import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Send,
  EyeOff,
  UserSearch,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
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
import type { TalentProfile, Trade } from '../../types';

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['employer', 'talent'] });
      showToast(`Invite sent to ${invitingWorker?.name ?? 'the worker'}`, 'success');
      setInvitingWorker(null);
    },
    onError: () => showToast('Could not send the invite. Please try again.', 'error'),
  });

  const openInvite = (w: TalentProfile) => {
    const first = activeJobs?.find((j) => !w.appliedTo.includes(j.id) && !w.invitedTo.includes(j.id));
    setSelectedJobId(first?.id ?? '');
    setInvitingWorker(w);
  };

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
          <ListSkeleton />
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

                {w.invitedTo.length > 0 ? (
                  <View style={[styles.inviteBtn, { backgroundColor: colors.successBg }]}>
                    <CheckCircle2 size={14} color={colors.successFg} />
                    <Text style={[styles.inviteBtnText, { color: colors.successFg }]}>Invited</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => openInvite(w)}
                    style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
                  >
                    <Send size={14} color="#FFF" />
                    <Text style={styles.inviteBtnText}>{t('Invite to apply')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Invite sheet */}
      <Sheet
        visible={!!invitingWorker}
        onClose={() => setInvitingWorker(null)}
        title={invitingWorker ? `Invite ${invitingWorker.name} to apply` : ''}
        subtitle="They get a message with a link to the job. Their phone number stays hidden until they apply."
        footer={
          <View style={styles.sheetActions}>
            <Button label="Cancel" variant="secondary" onPress={() => setInvitingWorker(null)} style={styles.flex} />
            <Button
              label="Send invite"
              icon={<Send size={16} color="#FFF" />}
              disabled={!selectedJobId}
              loading={inviteMutation.isPending}
              onPress={() =>
                invitingWorker && inviteMutation.mutate({ workerId: invitingWorker.userId, jobId: selectedJobId })
              }
              style={styles.flex}
            />
          </View>
        }
      >
        <Text style={[styles.selectJobLabel, { color: colors.ink }]}>Which job?</Text>
        <View style={styles.jobOptions}>
          {activeJobs?.map((j) => {
            const isSelected = selectedJobId === j.id;
            const applied = invitingWorker?.appliedTo.includes(j.id);
            const invited = invitingWorker?.invitedTo.includes(j.id);
            return (
              <TouchableOpacity
                key={j.id}
                disabled={applied || invited}
                onPress={() => setSelectedJobId(j.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: applied || invited }}
                style={[
                  styles.jobSelectOption,
                  {
                    backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    opacity: applied || invited ? 0.55 : 1,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={[styles.jobOptionTitle, { color: colors.ink }]}>{j.title}</Text>
                  <Text style={[styles.jobOptionMeta, { color: colors.inkMuted }]}>
                    {applied ? 'Already applied' : invited ? 'Already invited' : `${j.location.city} · ${j.openings} openings`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: isSelected ? colors.primary : colors.borderStrong },
                  ]}
                >
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  jobOptions: { gap: 8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
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
  selectJobLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  jobSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  jobOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  jobOptionMeta: {
    fontSize: 12,
  },
});
