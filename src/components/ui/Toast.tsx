import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react-native';
import { useUiStore } from '../../store/uiStore';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toasts, dismissToast, colors } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + spacing.sm }]}>
      {toasts.map((toast) => {
        let bg: string = colors.surface;
        let border: string = colors.border;
        let Icon = Info;
        let iconColor: string = colors.infoFg;

        switch (toast.type) {
          case 'success':
            Icon = CheckCircle2;
            iconColor = colors.successFg;
            border = colors.successBg;
            break;
          case 'warning':
            Icon = AlertTriangle;
            iconColor = colors.warningFg;
            border = colors.warningBg;
            break;
          case 'error':
            Icon = AlertCircle;
            iconColor = colors.dangerFg;
            border = colors.dangerBg;
            break;
        }

        return (
          <View
            key={toast.id}
            style={[
              styles.toast,
              {
                backgroundColor: bg,
                borderColor: border,
              },
            ]}
          >
            <Icon size={18} color={iconColor} style={styles.icon} />
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.inkMuted} />
            </TouchableOpacity>
          </View>
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontWeight: '500',
  },
});
