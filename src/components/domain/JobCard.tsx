import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { BadgeCheck, CheckCircle2, CalendarClock, Banknote, Clock, Award } from '../ui/icons';
import { SaveButton } from './SaveButton';
import type { JobForWorker } from '../../types';
import { CompanyLogo } from './CompanyLogo';
import { payShort } from './JobBits';
import { EXPERIENCE_LABEL, SECTOR_LABEL, SHIFT_LABEL } from '../../lib/labels';
import { formatDate, timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import { PressableScale } from '../ui/PressableScale';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface JobCardProps {
  job: JobForWorker;
  onPress: () => void;
  onToggleSave?: (job: JobForWorker) => void;
  saving?: boolean;
  selected?: boolean;
  style?: ViewStyle;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onToggleSave,
  saving,
  selected,
  style,
}) => {
  const { colors } = useUiStore();
  const closed = job.status !== 'active';
  const pay = payShort(job);

  const handleSaveToggle = () => onToggleSave?.(job);

  const previewSnippet = [job.responsibilities?.[0], job.requirements?.[0]].filter(Boolean).join('. ');

  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: closed ? 0.7 : 1,
        },
        selected && styles.selectedShadow,
        style,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <CompanyLogo job={job} size="md" />
        <View style={styles.headerContent}>
          <Text style={[styles.companyName, { color: colors.inkSecondary }]} numberOfLines={1}>
            {job.companyName}
          </Text>
          <Text style={[styles.jobTitle, { color: colors.ink }]} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={[styles.metaSubtitle, { color: colors.inkMuted }]} numberOfLines={1}>
            {job.location.city} · {t(SECTOR_LABEL[job.sector])}
          </Text>
        </View>

        {onToggleSave && (
          <SaveButton saved={!!job.saved} onPress={handleSaveToggle} disabled={saving} />
        )}
      </View>

      {/* Characteristic Badges/Pills Row */}
      <View style={styles.pillsRow}>
        {/* Pay first and in colour: it is what workers scan for. */}
        <View style={[styles.pill, { backgroundColor: pay ? colors.tiles.green.bg : colors.surfaceMuted, borderColor: 'transparent' }]}>
          {pay ? (
            <>
              <Banknote size={15} color={colors.tiles.green.text} weight="duotone" duotoneOpacity={0.35} />
              <Text style={[styles.payText, { color: colors.tiles.green.text }]}>
                {pay.range}
                <Text style={[styles.pillTextMuted, { color: colors.tiles.green.text }]}> {pay.per}</Text>
              </Text>
            </>
          ) : (
            <Text style={[styles.pillTextMuted, { color: colors.inkMuted }]}>
              {t('Pay not shown')}
            </Text>
          )}
        </View>

        <View style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Clock size={14} color={colors.inkSecondary} />
          <Text style={[styles.pillText, { color: colors.ink }]}>
            {t(SHIFT_LABEL[job.shift]).replace(/ shift$/i, '')}
          </Text>
        </View>

        <View style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Award size={14} color={colors.inkSecondary} />
          <Text style={[styles.pillText, { color: colors.ink }]}>
            {t(EXPERIENCE_LABEL[job.experience])}
          </Text>
        </View>
      </View>

      {/* 2-line snippet preview */}
      {previewSnippet.length > 0 && (
        <Text style={[styles.snippetText, { color: colors.inkMuted }]} numberOfLines={2}>
          {previewSnippet}.
        </Text>
      )}

      {/* Bottom Status / Footer Bar */}
      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <View style={styles.footerLeft}>
          {closed ? (
            <Text style={[styles.footerStatusText, { color: colors.inkMuted }]}>
              {t('Closed')}
            </Text>
          ) : job.appliedApplicationId ? (
            <View style={styles.inlineBadge}>
              <CheckCircle2 size={14} color={colors.successFg} />
              <Text style={[styles.footerStatusText, { color: colors.successFg, fontWeight: '700' }]}>
                {t('Applied')}
              </Text>
            </View>
          ) : job.jobType === 'walk_in' && job.walkIn ? (
            <View style={styles.inlineBadge}>
              <CalendarClock size={14} color={colors.tiles.purple.text} />
              <Text style={[styles.footerStatusText, { color: colors.tiles.purple.text, fontWeight: '700' }]}>
                {t('Walk-in')} · {formatDate(job.walkIn.date)}
              </Text>
            </View>
          ) : job.companyVerified ? (
            <View style={styles.inlineBadge}>
              <BadgeCheck size={14} color={colors.primary} />
              <Text style={[styles.footerStatusText, { color: colors.primary, fontWeight: '700' }]}>
                {t('Verified employer')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.footerStatusText, { color: colors.inkMuted }]}>
              {t('Not yet verified')}
            </Text>
          )}
        </View>

        <Text style={[styles.timeAgoText, { color: colors.inkMuted }]}>
          {timeAgo(job.postedAt)}
        </Text>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  // Small neutral shadow only (no coloured glow).
  selectedShadow: {
    shadowColor: '#15191E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  metaSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  pill: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payText: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.1 },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  pillTextMuted: {
    fontSize: 12,
    fontWeight: '500',
  },
  snippetText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeAgoText: {
    fontSize: 12,
  },
});
