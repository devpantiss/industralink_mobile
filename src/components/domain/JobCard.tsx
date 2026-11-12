import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Bookmark, BadgeCheck, CheckCircle2, CalendarClock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { JobForWorker } from '../../types';
import { CompanyLogo } from './CompanyLogo';
import { payShort } from './JobBits';
import { EXPERIENCE_LABEL, SECTOR_LABEL, SHIFT_LABEL } from '../../lib/labels';
import { formatDate, timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';

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

  const handleSaveToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onToggleSave) {
      onToggleSave(job);
    }
  };

  const previewSnippet = [job.responsibilities?.[0], job.requirements?.[0]].filter(Boolean).join('. ');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.surface : colors.surfaceMuted,
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
          <TouchableOpacity
            onPress={handleSaveToggle}
            disabled={saving}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.saveBtn}
          >
            <Bookmark
              size={18}
              color={job.saved ? colors.primary : colors.inkSecondary}
              fill={job.saved ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Characteristic Badges/Pills Row */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {pay ? (
            <Text style={[styles.pillText, { color: colors.ink }]}>
              {pay.range}
              <Text style={[styles.pillTextMuted, { color: colors.inkMuted }]}> {pay.per}</Text>
            </Text>
          ) : (
            <Text style={[styles.pillTextMuted, { color: colors.inkMuted }]}>
              {t('Pay not shown')}
            </Text>
          )}
        </View>

        <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.pillText, { color: colors.ink }]}>
            {t(SHIFT_LABEL[job.shift]).replace(/ shift$/i, '')}
          </Text>
        </View>

        <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: spacing.md,
  },
  selectedShadow: {
    shadowColor: '#2454E6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
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
  saveBtn: {
    padding: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
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
