import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Check, ArrowRight } from 'lucide-react-native';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Trade } from '../../types';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const WorkerWelcomeScreen: React.FC = () => {
  const { colors, showToast } = useUiStore();
  const { user, completeOnboarding } = useAuthStore();

  const [trade, setTrade] = useState<Trade>('welder');
  const [experience, setExperience] = useState('3_5');
  const [city, setCity] = useState(user?.city ?? '');

  const trades: { key: Trade; label: string }[] = [
    { key: 'welder', label: 'Welder (MIG/TIG/Arc)' },
    { key: 'fitter', label: 'Mechanical Fitter' },
    { key: 'electrician', label: 'Industrial Electrician' },
    { key: 'machine_operator', label: 'CNC Machine Operator' },
    { key: 'crane_operator', label: 'Crane / Rigger' },
    { key: 'driver', label: 'Heavy Vehicle Driver' },
  ];

  const expBands = [
    { key: 'fresher', label: 'Fresher (ITI Pass)' },
    { key: '1_2', label: '1–2 Years' },
    { key: '3_5', label: '3–5 Years' },
    { key: '5_plus', label: '5+ Years' },
  ];

  const handleFinish = () => {
    completeOnboarding({ trade, city: city.trim() || undefined });
    showToast('Profile setup complete! Welcome to your dashboard.', 'success');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title="Worker Onboarding" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={[typography.h1, styles.title, { color: colors.ink }]}>
            Set up your Trade Profile
          </Text>
          <Text style={[typography.body, { color: colors.inkSecondary }]}>
            Top industrial employers search candidates by trade specialization and certified experience.
          </Text>
        </View>

        {/* Trade Selection */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            1. Select Your Primary Trade
          </Text>
          <View style={styles.optionsGrid}>
            {trades.map((item) => {
              const selected = trade === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setTrade(item.key)}
                  style={[
                    styles.optionTile,
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
                    {item.label}
                  </Text>
                  {selected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Experience Selection */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            2. Total Hands-on Experience
          </Text>
          <View style={styles.expRow}>
            {expBands.map((band) => {
              const selected = experience === band.key;
              return (
                <TouchableOpacity
                  key={band.key}
                  onPress={() => setExperience(band.key)}
                  style={[
                    styles.expChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: selected ? '#FFFFFF' : colors.ink, fontWeight: '600' },
                    ]}
                  >
                    {band.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Location Card */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            3. Current City / District
          </Text>
          <Input
            placeholder="e.g. Jamshedpur, Kalinganagar, Pune"
            value={city}
            onChangeText={setCity}
          />
        </Card>

        <Button
          label="Finish & Enter Dashboard"
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          iconPosition="right"
          onPress={handleFinish}
          style={styles.finishBtn}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
  },
  top: {
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  optionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  expRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  expChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  finishBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});

