import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Clock, AlertTriangle, FileUp } from '../ui/icons';
import { Text } from '../ui/Text';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';

/**
 * Tells a hiring manager where the company stands with the admin team, and the one next step.
 * Nothing is shown once the company is approved.
 */
export const VerificationBanner: React.FC<{ onCompanyScreen?: boolean }> = ({ onCompanyScreen }) => {
  const colors = useUiStore((s) => s.colors);
  const navigation = useNavigation<any>();
  const { data: company } = useQuery({ queryKey: queryKeys.employer.company, queryFn: () => employerApi.getCompany() });
  const { data: docs } = useQuery({ queryKey: queryKeys.employer.companyDocs, queryFn: () => employerApi.getCompanyDocuments() });
  if (!company || company.verification === 'approved') return null;

  const hasDocs = (docs?.length ?? 0) > 0;
  let tone: 'warning' | 'danger' = 'warning';
  let Icon = Clock;
  let title = 'Waiting for approval';
  let body = 'Our team is checking your company. You can save jobs as drafts. Publishing and finding workers open after approval.';
  let action: string | undefined;

  if (company.verification === 'rejected') {
    tone = 'danger';
    Icon = AlertTriangle;
    title = 'Your company needs changes';
    body = `${company.rejectionReason ?? 'Please check your details.'} Fix it and send it again.`;
    action = 'Fix and send again';
  } else if (!hasDocs) {
    Icon = FileUp;
    title = 'Add your GST certificate';
    body = 'Upload one company document so our team can approve you. Until then you can save jobs as drafts.';
    action = 'Add document';
  }

  const bg = tone === 'danger' ? colors.dangerBg : colors.warningBg;
  const fg = tone === 'danger' ? colors.dangerFg : colors.warningFg;

  return (
    <View style={[styles.box, { backgroundColor: bg }]} accessibilityRole="alert">
      <Icon size={20} color={fg} />
      <View style={styles.flex}>
        <Text style={[styles.title, { color: fg }]}>{title}</Text>
        <Text style={[styles.body, { color: fg }]}>{body}</Text>
        {action && !onCompanyScreen ? (
          <Pressable onPress={() => navigation.navigate('Company')} hitSlop={8} style={styles.action}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16 },
  flex: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: 14, lineHeight: 20 },
  action: { marginTop: 8, minHeight: 32, justifyContent: 'center' },
});
