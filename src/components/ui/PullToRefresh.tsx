import React, { useState } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';
import { useUiStore } from '../../store/uiStore';

/** Shortest time the spinner shows. On iOS, a spinner that starts and stops at once can stay stuck. */
const MIN_SPIN_MS = 500;

type Props = Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> & {
  /** Loads the screen again. The spinner stays until it is done. */
  onRefresh: () => Promise<unknown>;
};

/**
 * Pull-to-refresh for every screen. The spinner shows only while your own pull is loading,
 * never for background updates (live chat, timers, other screens). Those used to show the
 * spinner by themselves, and on iOS it could stay stuck when coming back to the screen.
 *
 * Use it as `refreshControl={<PullToRefresh onRefresh={...} />}`. Other props are passed on,
 * which Android needs (the scroll view is placed inside it).
 */
export const PullToRefresh: React.FC<Props> = ({ onRefresh, ...rest }) => {
  const colors = useUiStore((s) => s.colors);
  const [refreshing, setRefreshing] = useState(false);

  const pull = async () => {
    setRefreshing(true);
    try {
      await Promise.all([onRefresh(), new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS))]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RefreshControl
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={colors.surface}
      {...rest}
      refreshing={refreshing}
      onRefresh={() => void pull()}
    />
  );
};
