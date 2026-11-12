import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const OfflineBanner: React.FC = () => {
  const { colors } = useUiStore();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warningBg, borderBottomColor: colors.warningFg }]}>
      <WifiOff size={16} color={colors.warningFg} />
      <Text style={[typography.caption, styles.text, { color: colors.warningFg }]}>
        Offline Mode — Showing cached jobs. Actions will sync once connected.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    zIndex: 999,
  },
  text: {
    marginLeft: 6,
    fontWeight: '600',
  },
});

