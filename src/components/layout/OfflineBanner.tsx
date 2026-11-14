import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

/**
 * Offline strip above the whole app. It sits in the status-bar area itself (padded by the top
 * inset), so the screens below are told the top inset is already taken: no double gap, and
 * the strip never collides with the clock / notch.
 */
export const OfflineBanner: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { colors } = useUiStore();
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  // Same tree online and offline (only the banner and the inset value change), so the
  // navigator below never remounts and keeps its state.
  return (
    <>
      {isOffline && (
        <View
          style={[
            styles.banner,
            { backgroundColor: colors.warningBg, borderBottomColor: colors.warningFg, paddingTop: insets.top + 6 },
          ]}
        >
          <WifiOff size={16} color={colors.warningFg} />
          <Text style={[typography.caption, styles.text, { color: colors.warningFg }]}>
            Offline Mode — Showing cached jobs. Actions will sync once connected.
          </Text>
        </View>
      )}
      <SafeAreaInsetsContext.Provider value={isOffline ? { ...insets, top: 0 } : insets}>{children}</SafeAreaInsetsContext.Provider>
    </>
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

