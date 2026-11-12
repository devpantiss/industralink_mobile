import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, StyleProp, ViewStyle } from 'react-native';
import { Phone, CheckCircle, XCircle, Award, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Candidate, ApplicationStage } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface CandidateCardProps {
  candidate: Candidate;
  onPress: () => void;
  onStageChange: (candidateId: string, newStage: ApplicationStage) => void;
  style?: StyleProp<ViewStyle>;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onPress,
  onStageChange,
  style,
}) => {
  const { colors, showToast } = useUiStore();
  const worker = candidate.worker;

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${worker.phone}`).catch(() => {
      showToast(`Cannot dial ${worker.phone}`, 'error');
    });
  };

  const handleShortlist = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nextStage: ApplicationStage =
      candidate.stage === 'applied'
        ? 'shortlisted'
        : candidate.stage === 'shortlisted'
        ? 'interview'
        : 'hired';
    onStageChange(candidate.id, nextStage);
    showToast(`Advanced ${worker.name} to ${nextStage.toUpperCase()}!`, 'success');
  };

  const handleReject = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onStageChange(candidate.id, 'rejected');
    showToast(`Candidate ${worker.name} moved to rejected.`, 'info');
  };

  const getStageBadgeVariant = (stage: ApplicationStage) => {
    switch (stage) {
      case 'hired':
        return 'success';
      case 'interview':
        return 'interview';
      case 'shortlisted':
        return 'primary';
      case 'rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[typography.h3, { color: colors.primary }]}>
            {worker.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[typography.h2, { color: colors.ink }]}>{worker.name}</Text>
            <Badge
              label={candidate.stage.toUpperCase()}
              variant={getStageBadgeVariant(candidate.stage)}
              style={styles.stageBadge}
            />
          </View>

          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
            {worker.trade ? worker.trade.toUpperCase() : 'SKILLED WORKER'}
          </Text>

          <View style={styles.metaRow}>
            <MapPin size={12} color={colors.inkMuted} />
            <Text style={[typography.caption, { color: colors.inkSecondary, marginLeft: 3 }]}>
              {worker.location?.city || 'Local Plant'} • {worker.experience || '1-3'} yrs exp
            </Text>
          </View>

          <Text style={[typography.caption, { color: colors.inkMuted, marginTop: 2 }]}>
            Applied for: {candidate.jobTitle}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Button
          label="Call"
          size="sm"
          variant="outline"
          icon={<Phone size={14} color={colors.ink} />}
          onPress={handleCall}
          style={styles.actionBtn}
        />

        {candidate.stage !== 'hired' && candidate.stage !== 'rejected' && (
          <Button
            label={candidate.stage === 'shortlisted' ? 'Set Interview' : 'Shortlist'}
            size="sm"
            variant="primary"
            icon={<CheckCircle size={14} color="#FFFFFF" />}
            onPress={handleShortlist}
            style={styles.actionBtn}
          />
        )}

        {candidate.stage !== 'rejected' && (
          <Button
            label="Reject"
            size="sm"
            variant="danger"
            icon={<XCircle size={14} color="#FFFFFF" />}
            onPress={handleReject}
            style={styles.actionBtn}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stageBadge: {
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
  },
});

