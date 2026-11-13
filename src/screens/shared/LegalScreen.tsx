import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Text } from '../../components/ui/Text';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';

export type LegalKind = 'terms' | 'privacy' | 'nofees';

// PLACEHOLDER TEXT: replace with the approved legal wording before launch.
const PAGES: Record<LegalKind, { title: string; points: string[] }> = {
  terms: {
    title: 'Terms of use',
    points: [
      'IndustriaLink helps workers find jobs and helps employers find workers.',
      'Give true information. Accounts with false details can be removed.',
      'Employers must be approved before they can post jobs or contact workers.',
      'We are not a party to any job offer. Check the terms of the job before you join.',
    ],
  },
  privacy: {
    title: 'Privacy',
    points: [
      'We keep your name, mobile number, work details and documents to run the service.',
      'Employers see your profile when you apply. They see your mobile number only after they shortlist you.',
      'Your ID proof is shown to an employer only after they shortlist you.',
      'You can delete your account from Settings at any time.',
    ],
  },
  nofees: {
    title: 'No fees policy',
    points: [
      'Workers never pay to apply, to get shortlisted or to get a job.',
      'If anyone asks you for money, do not pay. Report the job from its page.',
      'Employers must not ask workers for deposits, training fees or registration fees.',
    ],
  },
};

export const LegalScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const { params } = useRoute<RouteProp<{ Legal: { kind: LegalKind } }, 'Legal'>>();
  const page = PAGES[params.kind];
  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t(page.title)} showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.note, { backgroundColor: colors.warningBg }]}>
          <Text style={{ color: colors.warningFg, fontSize: 13 }}>{t('Draft text. The final wording will replace this.')}</Text>
        </View>
        {page.points.map((p) => (
          <Text key={p} style={[styles.point, { color: colors.ink }]}>
            {'•  '}
            {t(p)}
          </Text>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 12 },
  note: { padding: 12, borderRadius: 12 },
  point: { fontSize: 16, lineHeight: 24 },
});
