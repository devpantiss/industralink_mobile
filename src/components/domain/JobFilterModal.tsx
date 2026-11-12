import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Trade, Shift } from '../../types';
import { Button } from '../ui/Button';
import { useUiStore } from '../../store/uiStore';
import { spacing, radii } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface FilterValues {
  trade: string;
  shift: string;
  minPay: number;
}

interface JobFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  currentFilters: FilterValues;
}

export const JobFilterModal: React.FC<JobFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const { colors } = useUiStore();
  const [trade, setTrade] = useState(currentFilters.trade);
  const [shift, setShift] = useState(currentFilters.shift);
  const [minPay, setMinPay] = useState(currentFilters.minPay);

  const trades = ['All', 'Welder', 'Fitter', 'Electrician', 'Machinist', 'Driver', 'Operator'];
  const shifts = ['All', 'Day', 'Night', 'Rotational'];
  const payBands = [
    { label: 'Any Salary', value: 0 },
    { label: '₹20,000+ / mo', value: 20000 },
    { label: '₹25,000+ / mo', value: 25000 },
    { label: '₹30,000+ / mo', value: 30000 },
  ];

  const handleReset = () => {
    setTrade('All');
    setShift('All');
    setMinPay(0);
  };

  const handleApply = () => {
    onApply({ trade, shift, minPay });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[typography.h2, { color: colors.ink }]}>Filter Jobs</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Trade Filter */}
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
              Trade Category
            </Text>
            <View style={styles.chipsRow}>
              {trades.map((t) => {
                const selected = trade.toLowerCase() === t.toLowerCase();
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTrade(t)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.small,
                        { color: selected ? '#FFFFFF' : colors.ink, fontWeight: '600' },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Shift Filter */}
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
              Shift Schedule
            </Text>
            <View style={styles.chipsRow}>
              {shifts.map((s) => {
                const selected = shift.toLowerCase() === s.toLowerCase();
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setShift(s)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.small,
                        { color: selected ? '#FFFFFF' : colors.ink, fontWeight: '600' },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Min Salary Filter */}
            <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
              Minimum Monthly Salary
            </Text>
            <View style={styles.payList}>
              {payBands.map((band) => {
                const selected = minPay === band.value;
                return (
                  <TouchableOpacity
                    key={band.value}
                    onPress={() => setMinPay(band.value)}
                    style={[
                      styles.payRow,
                      {
                        backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.body,
                        { color: selected ? colors.primary : colors.ink, fontWeight: '600' },
                      ]}
                    >
                      {band.label}
                    </Text>
                    {selected && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              label="Reset"
              variant="outline"
              onPress={handleReset}
              style={styles.footerBtn}
            />
            <Button
              label="Apply Filters"
              onPress={handleApply}
              style={[styles.footerBtn, { flex: 2 }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  body: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  payList: {
    gap: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
  },
});

