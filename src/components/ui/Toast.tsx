import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from './icons';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useUiStore } from '../../store/uiStore';
import { Glass } from './Glass';
import { useToastStore } from '../../store/toastStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useUiStore((s) => s.colors);
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismiss);

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + spacing.sm }]}>
      {toasts.map((toast) => {
        let tint: string = colors.infoBg;
        let Icon = Info;
        let iconColor: string = colors.infoFg;

        switch (toast.type) {
          case 'success':
            Icon = CheckCircle2;
            iconColor = colors.successFg;
            tint = colors.successBg;
            break;
          case 'warning':
            Icon = AlertTriangle;
            iconColor = colors.warningFg;
            tint = colors.warningBg;
            break;
          case 'error':
            Icon = AlertCircle;
            iconColor = colors.dangerFg;
            tint = colors.dangerBg;
            break;
        }

        return (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(160)}
            layout={LinearTransition.duration(200)}
            accessibilityRole="alert"
            style={styles.shadow}
          >
            <Glass style={styles.toast} intensity={60}>
            <View style={[styles.iconChip, { backgroundColor: tint }]}>
              <Icon size={18} color={iconColor} weight="fill" />
            </View>
            <Text
              style={[
                typography.small,
                styles.message,
                { color: colors.ink },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={() => dismissToast(toast.id)}
              accessibilityLabel="Dismiss"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.inkMuted} weight="bold" />
            </TouchableOpacity>
            </Glass>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  shadow: {
    marginBottom: spacing.xs,
    borderRadius: 18,
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: spacing.md,
    borderRadius: 18,
  },
  iconChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  message: {
    flex: 1,
    fontWeight: '500',
  },
});
