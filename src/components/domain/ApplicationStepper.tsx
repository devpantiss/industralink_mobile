import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { ApplicationStage } from '../../types';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface ApplicationStepperProps {
  currentStage: ApplicationStage;
}

export const ApplicationStepper: React.FC<ApplicationStepperProps> = ({ currentStage }) => {
  const { colors } = useUiStore();

  const stages: { key: ApplicationStage; label: string }[] = [
    { key: 'applied', label: 'Applied' },
    { key: 'shortlisted', label: 'Review' },
    { key: 'interview', label: 'Interview' },
    { key: 'offer', label: 'Offer' },
    { key: 'hired', label: 'Hired' },
  ];

  const getStageIndex = (stage: ApplicationStage) => {
    switch (stage) {
      case 'applied': return 0;
      case 'shortlisted': return 1;
      case 'interview': return 2;
      case 'offer': return 3;
      case 'hired': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {stages.map((item, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={item.key}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isDone
                        ? colors.successFg
                        : isCurrent
                        ? colors.primary
                        : colors.surfaceStrong,
                      borderColor: isCurrent ? colors.accent : 'transparent',
                      borderWidth: isCurrent ? 2 : 0,
                    },
                  ]}
                >
                  {isDone ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <View
                      style={[
                        styles.innerDot,
                        {
                          backgroundColor: isCurrent ? '#FFFFFF' : 'transparent',
                        },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    typography.tiny,
                    styles.label,
                    {
                      color: isCurrent
                        ? colors.primary
                        : isDone
                        ? colors.ink
                        : colors.inkMuted,
                      fontWeight: isCurrent ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>

              {idx < stages.length - 1 && (
                <View
                  style={[
                    styles.trackLine,
                    {
                      backgroundColor: idx < currentIndex ? colors.successFg : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    width: 52,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    textAlign: 'center',
  },
  trackLine: {
    flex: 1,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 2,
  },
});

