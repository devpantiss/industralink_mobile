import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MapPin, Clock, Bookmark, BadgeCheck, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { JobForWorker } from '../../types';
import { CompanyLogo } from './CompanyLogo';
import { payLong } from './JobBits';
import { JOB_TYPE_LABEL, SHIFT_LABEL } from '../../lib/labels';
import { timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';

interface JobRowProps {
  job: JobForWorker;
  onPress: () => void;
  onToggleSave?: (job: JobForWorker) => void;
  saving?: boolean;
  style?: ViewStyle;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  onPress,
  onToggleSave,
  saving,
  style,
}) => {
  const { colors } = useUiStore();
  const closed = job.status !== 'active';
  const pay = payLong(job);
  const isFresh = Date.now() - new Date(job.postedAt).getTime() < 86_400_000;

  const handleSaveToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onToggleSave) {
      onToggleSave(job);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: closed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <CompanyLogo job={job} size="lg" />
        <View style={styles.topContent}>
          <Text style={[styles.title, { color: colors.ink }]} numberOfLines={2}>
            {job.title}
          </Text>

          <View style={styles.companyMetaRow}>
            <Text style={[styles.companyText, { color: colors.inkSecondary }]}>
              {job.companyName}
            </Text>
            {job.companyVerified && (
              <BadgeCheck size={15} color={colors.primary} />
            )}
          </View>

          {/* Tag row */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: colors.tiles.yellow.bg }]}>
              <Text style={[styles.tagText, { color: colors.tiles.yellow.text }]}>
                {t(JOB_TYPE_LABEL[job.jobType === 'walk_in' ? 'full_time' : job.jobType])}
              </Text>
            </View>

            {job.jobType === 'walk_in' && (
              <View style={[styles.tag, { backgroundColor: colors.tiles.purple.bg }]}>
                <Text style={[styles.tagText, { color: colors.tiles.purple.text }]}>
                  {t('Walk-in')}
                </Text>
              </View>
            )}

            {isFresh && !closed && (
              <View style={[styles.tag, { backgroundColor: colors.tiles.rose.bg }]}>
                <Text style={[styles.tagText, { color: colors.tiles.rose.text }]}>
                  {t('New')}
                </Text>
              </View>
            )}

            {job.appliedApplicationId && (
              <View style={[styles.tag, { backgroundColor: colors.successBg, flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                <CheckCircle2 size={11} color={colors.successFg} />
                <Text style={[styles.tagText, { color: colors.successFg }]}>
                  {t('Applied')}
                </Text>
              </View>
            )}
          </View>
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

      {/* Bullets */}
      {job.responsibilities && job.responsibilities.length > 0 && (
        <View style={styles.bulletsList}>
          {job.responsibilities.slice(0, 2).map((r, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={[styles.bulletDot, { color: colors.inkMuted }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.inkSecondary }]} numberOfLines={1}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Pay & Shift */}
      <View style={styles.payShiftRow}>
        {pay ? (
          <Text style={[styles.payText, { color: colors.ink }]}>
            {pay}
            <Text style={[styles.payPeriodText, { color: colors.inkSecondary }]}>
              {' '}{t(job.payPeriod === 'day' ? 'per day' : 'per month')}
            </Text>
          </Text>
        ) : (
          <Text style={[styles.payPeriodText, { color: colors.inkMuted }]}>
            {t('Salary not disclosed')}
          </Text>
        )}
        <Text style={[styles.payPeriodText, { color: colors.inkSecondary }]}>
          {' '}· {t(SHIFT_LABEL[job.shift])}
        </Text>
      </View>

      {/* Footer: City & Time */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.metaItem}>
          <MapPin size={13} color={colors.inkSecondary} />
          <Text style={[styles.metaText, { color: colors.ink }]}>
            {job.location.city}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Clock size={13} color={colors.inkMuted} />
          <Text style={[styles.metaMutedText, { color: colors.inkMuted }]}>
            {timeAgo(job.postedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  topContent: {
    flex: 1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  companyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  companyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveBtn: {
    padding: 4,
  },
  bulletsList: {
    marginTop: 10,
    gap: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 16,
  },
  bulletText: {
    fontSize: 13,
    flex: 1,
  },
  payShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  payText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  payPeriodText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  metaMutedText: {
    fontSize: 12,
  },
});

