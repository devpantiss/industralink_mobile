import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  UtensilsCrossed,
  Home,
  Bus,
  Landmark,
  Timer,
  ShieldAlert,
  Pickaxe,
  Factory,
  Ship,
  Fuel,
  Truck,
  Car,
} from 'lucide-react-native';
import type { Benefit, Job, JobForWorker, Sector } from '../../types';
import { BENEFIT_LABEL, JOB_TYPE_LABEL } from '../../lib/labels';
import { formatCompact, formatDate, formatNumber } from '../../lib/format';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../store/uiStore';

export const SECTOR_ICONS: Record<Sector, any> = {
  mining: Pickaxe,
  metals: Factory,
  shipping: Ship,
  petroleum: Fuel,
  logistics: Truck,
  automotive: Car,
};

const BENEFIT_ICONS: Record<Benefit, any> = {
  food: UtensilsCrossed,
  stay: Home,
  transport: Bus,
  pf_esi: Landmark,
  overtime: Timer,
  hazard_pay: ShieldAlert,
};

/** "₹18k–22k" plus the period, for pills and tiles. */
export function payShort(job: Pick<JobForWorker, 'payMin' | 'payMax' | 'payPeriod'>) {
  const { payMin: a, payMax: b } = job;
  if (!a && !b) return null;
  const range = a && b && a !== b ? `₹${formatCompact(a)}–${formatCompact(b)}` : `₹${formatCompact((a || b)!)}`;
  return { range, per: job.payPeriod === 'day' ? '/day' : '/mo' };
}

/** "₹18,000 – 22,000" for full rows. */
export function payLong(job: Pick<JobForWorker, 'payMin' | 'payMax'>) {
  const { payMin: a, payMax: b } = job;
  if (!a && !b) return null;
  return a && b && a !== b ? `₹${formatNumber(a)} – ${formatNumber(b)}` : `₹${formatNumber((a || b)!)}`;
}

/** "Contract · 6 months", or just the job type. */
export function jobTypeText(job: Pick<Job, 'jobType' | 'contractLength'>) {
  const base = t(JOB_TYPE_LABEL[job.jobType]);
  return job.jobType === 'contract' && job.contractLength ? `${base} · ${job.contractLength}` : base;
}

/** "12 Nov – 14 Nov, 09:00 – 13:00" for a walk-in. */
export function walkInWhen(w: NonNullable<Job['walkIn']>) {
  const days = w.endDate && w.endDate !== w.date ? `${formatDate(w.date)} – ${formatDate(w.endDate)}` : formatDate(w.date);
  const time = w.time ? (w.endTime ? `${w.time} – ${w.endTime}` : w.time) : '';
  return [days, time].filter(Boolean).join(', ');
}

export function BenefitChips({
  benefits,
  max,
  style,
}: {
  benefits: Benefit[];
  max?: number;
  style?: ViewStyle;
}) {
  const { colors } = useUiStore();
  const shown = max ? benefits.slice(0, max) : benefits;
  const rest = benefits.length - shown.length;
  if (!benefits.length) return null;

  return (
    <View style={[styles.chipsContainer, style]}>
      {shown.map((b) => {
        const Icon = BENEFIT_ICONS[b];
        return (
          <View
            key={b}
            style={[
              styles.chip,
              { backgroundColor: colors.successBg },
            ]}
          >
            {Icon && <Icon size={12} color={colors.successFg} />}
            <Text style={[styles.chipText, { color: colors.successFg }]}>
              {t(BENEFIT_LABEL[b])}
            </Text>
          </View>
        );
      })}
      {rest > 0 && (
        <View style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.chipText, { color: colors.inkMuted }]}>
            +{rest} more
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

