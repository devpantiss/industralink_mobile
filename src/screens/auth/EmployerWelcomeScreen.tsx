import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Building2, Check, ArrowRight } from 'lucide-react-native';
import { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Sector } from '../../types';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmployerWelcome'>;

export const EmployerWelcomeScreen: React.FC<Props> = () => {
  const { colors, showToast } = useUiStore();
  const { updateUser, switchRole } = useAuthStore();

  const [companyName, setCompanyName] = useState('National Heavy Engineering · Heavy Fabrication Div');
  const [sector, setSector] = useState<Sector>('metals');
  const [plantLocation, setPlantLocation] = useState('Kalinganagar, Odisha');
  const [gstin, setGstin] = useState('21AAACT2727Q1ZT');

  const sectors: { key: Sector; label: string }[] = [
    { key: 'metals', label: 'Metals & Steel Fabrication' },
    { key: 'mining', label: 'Mining & Mineral Extraction' },
    { key: 'automotive', label: 'Automotive & Heavy Machinery' },
    { key: 'shipping', label: 'Ports, Cargo & Marine Shipping' },
    { key: 'petroleum', label: 'Petrochemical & Gas Refining' },
    { key: 'logistics', label: 'Industrial Logistics & Warehousing' },
  ];

  const handleFinish = () => {
    updateUser({
      companyName,
      city: plantLocation,
      onboarded: true,
    });
    showToast('Company profile verified! Welcome to Recruiter Portal.', 'success');
    switchRole('employer');
  };

  return (
    <Screen edges={['top']}>
      <AppHeader title="Employer Setup" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={[typography.h1, styles.title, { color: colors.ink }]}>
            Register Factory & Plant
          </Text>
          <Text style={[typography.body, { color: colors.inkSecondary }]}>
            Set up your enterprise profile to start posting industrial jobs and hiring verified ITI technicians.
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            1. Enterprise Details
          </Text>
          <Input
            label="Company / Division Legal Name"
            value={companyName}
            onChangeText={setCompanyName}
          />
          <Input
            label="Plant / Works Location"
            value={plantLocation}
            onChangeText={setPlantLocation}
          />
          <Input
            label="GSTIN Number (For Verification)"
            value={gstin}
            onChangeText={setGstin}
          />
        </Card>

        {/* Sector Selection */}
        <Card style={styles.card}>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.ink }]}>
            2. Primary Industrial Sector
          </Text>
          <View style={styles.sectorList}>
            {sectors.map((s) => {
              const selected = sector === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setSector(s.key)}
                  style={[
                    styles.sectorTile,
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
                    {s.label}
                  </Text>
                  {selected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button
          label="Save & Open Recruiter Dashboard"
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
  sectorList: {
    gap: spacing.sm,
  },
  sectorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  finishBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});

