import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Check, ChevronRight, FileText } from '../ui/icons';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { PressableScale } from '../ui/PressableScale';
import { useUiStore } from '../../store/uiStore';
import { EXPERIENCE_LABEL, STAGE_LABEL, TRADE_LABEL } from '../../lib/labels';
import { timeAgo, formatNumber } from '../../lib/format';
import { ageOf } from '../../lib/dob';
import type { ThemeColors } from '../../theme/colors';
import type { ApplicationStage, Candidate } from '../../types';
import { shadows } from '../../theme/shadows';

/** One colour per stage, used for chips, dots and badges (web: STAGE_CHIP / COLUMN). */
export function stageTone(stage: ApplicationStage, c: ThemeColors): { bg: string; fg: string; dot: string } {
  switch (stage) {
    case 'shortlisted':
      return { bg: c.primarySoft, fg: c.primary, dot: c.primary };
    case 'interview':
      return { bg: c.tiles.purple.bg, fg: c.tiles.purple.text, dot: c.tiles.purple.text };
    case 'offer':
      return { bg: c.tiles.yellow.bg, fg: c.tiles.yellow.text, dot: c.accent };
    case 'hired':
      return { bg: c.tiles.green.bg, fg: c.tiles.green.text, dot: c.tiles.green.text };
    case 'rejected':
      return { bg: c.tiles.rose.bg, fg: c.tiles.rose.text, dot: c.dangerFg };
    case 'withdrawn':
      return { bg: c.surfaceStrong, fg: c.inkMuted, dot: c.inkMuted };
    default:
      return { bg: c.surfaceStrong, fg: c.inkSecondary, dot: c.inkMuted };
  }
}

export const StageBadge: React.FC<{ stage: ApplicationStage }> = ({ stage }) => {
  const colors = useUiStore((s) => s.colors);
  const tone = stageTone(stage, colors);
  return (
    <View style={[styles.stageBadge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.stageBadgeText, { color: tone.fg }]}>{STAGE_LABEL[stage]}</Text>
    </View>
  );
};

interface Props {
  candidate: Candidate;
  onPress: () => void;
  /** Show the job they applied to (all-candidates list). Hidden on a single job's list. */
  showJob?: boolean;
  /** Optional quick button, e.g. "Shortlist". */
  action?: { label: string; onPress: () => void; disabled?: boolean };
  /** Selection mode: shows a tick box instead of the arrow. */
  selecting?: { selected: boolean };
}

export const CandidateRow: React.FC<Props> = ({ candidate: c, onPress, showJob = true, action, selecting }) => {
  const colors = useUiStore((s) => s.colors);
  const w = c.worker;
  const chips = [...w.qualifications.slice(0, 2), ...w.licences.slice(0, 1)];
  const isNew = c.stage === 'applied' && c.timeline.length <= 1;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${w.name}, ${STAGE_LABEL[c.stage]}`}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.top}>
        <Avatar name={w.name} src={w.photoUrl} size="md" />
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
              {w.name}
            </Text>
            {isNew && <View style={[styles.newDot, { backgroundColor: colors.primary }]} accessibilityLabel="Not seen yet" />}
          </View>
          <Text style={[styles.meta, { color: colors.inkSecondary }]} numberOfLines={1}>
            {[w.trade && TRADE_LABEL[w.trade], w.experience && EXPERIENCE_LABEL[w.experience], w.location?.city]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={[styles.meta, { color: colors.inkMuted }]} numberOfLines={1}>
            {[
              w.dob ? `${ageOf(w.dob)} yrs` : undefined,
              w.expectedPay ? `₹${formatNumber(w.expectedPay)}/mo` : undefined,
              w.availability === 'immediate' ? 'Can join now' : w.availability === '15_days' ? 'Joins in 15 days' : w.availability === '30_days' ? 'Joins in 30 days' : undefined,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <View style={styles.side}>
          <Text style={[styles.time, { color: colors.inkMuted }]}>{timeAgo(c.updatedAt)}</Text>
          {selecting ? (
            <View style={[styles.tick, { borderColor: selecting.selected ? colors.primary : colors.borderStrong, backgroundColor: selecting.selected ? colors.primary : 'transparent' }]}>
              {selecting.selected ? <Check size={14} color="#FFF" strokeWidth={3} /> : null}
            </View>
          ) : (
            <ChevronRight size={18} color={colors.inkMuted} />
          )}
        </View>
      </View>

      {chips.length > 0 && (
        <View style={styles.chips}>
          {chips.map((q, i) => {
            const lic = i >= Math.min(2, w.qualifications.length);
            return (
              <View
                key={q}
                style={[styles.chip, { backgroundColor: lic ? colors.tiles.yellow.bg : colors.primarySoft }]}
              >
                <Text style={[styles.chipText, { color: lic ? colors.tiles.yellow.text : colors.primary }]} numberOfLines={1}>
                  {q}
                </Text>
              </View>
            );
          })}
          {c.sentWith === 'document' && (
            <View style={[styles.chip, styles.chipIcon, { backgroundColor: colors.surfaceMuted }]}>
              <FileText size={11} color={colors.inkSecondary} />
              <Text style={[styles.chipText, { color: colors.inkSecondary }]}>Resume</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.foot, { borderTopColor: colors.border }]}>
        <View style={styles.footLeft}>
          <StageBadge stage={c.stage} />
          {c.match !== undefined && c.match >= 70 ? (
            <View style={[styles.stageBadge, { backgroundColor: colors.tiles.green.bg }]}>
              <Text style={[styles.stageBadgeText, { color: colors.tiles.green.text }]}>{c.match}% fit</Text>
            </View>
          ) : null}
          {showJob && (
            <Text style={[styles.job, { color: colors.inkMuted }]} numberOfLines={1}>
              {c.jobTitle}
            </Text>
          )}
        </View>
        {action && (
          <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            hitSlop={6}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: pressed ? colors.primaryHover : colors.primary, opacity: action.disabled ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  row: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, ...shadows.card },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  main: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  tick: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  newDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { fontSize: 13 },
  side: { alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, maxWidth: '100%' },
  chipIcon: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: 11, fontWeight: '700' },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  job: { fontSize: 12, flex: 1 },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  stageBadgeText: { fontSize: 11, fontWeight: '700' },
  action: { height: 34, borderRadius: 17, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
