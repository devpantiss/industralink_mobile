import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { queryKeys } from '../../api/keys';
import { useOpenLink } from '../../lib/appLinks';
import { t } from '../../lib/i18n';
import { getPushState, pushDataOf, registerPhone, sendToken, turnOnPush } from '../../lib/push';
import { storage } from '../../lib/storage';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';

/** Taps already handled, so a redraw (e.g. a language change) never opens the screen twice. */
const handled = new Set<string>();

/**
 * Phone notifications for the logged-in person. Rendered inside the navigation, once logged in,
 * only where push works (see pushSupported):
 * - registers this phone with the backend (and again if Firebase changes its id)
 * - asks once, with a short explanation, before Android's own permission dialog
 * - opens the right screen when a notification is tapped, also when it started the app
 * - refreshes the bell and the chat list when something arrives while the app is open
 */
export const PushNotifications: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  const session = useAuthStore((s) => s.token);
  const openLink = useOpenLink();
  const qc = useQueryClient();
  const colors = useUiStore((s) => s.colors);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!session) return;
    let active = true;
    (async () => {
      const state = await getPushState();
      if (state === 'on') await registerPhone();
      else if (state === 'ask' && !(await storage.getFlag('pushAsked')) && active) setAsking(true);
    })().catch(() => {});

    const tokenChange = Notifications.addPushTokenListener(({ data }) => {
      sendToken(String(data)).catch(() => {});
    });
    return () => {
      active = false;
      tokenChange.remove();
    };
  }, [session]);

  useEffect(() => {
    const arrived = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
      qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
    });
    return () => arrived.remove();
  }, [qc]);

  const tapped = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!tapped) return;
    const id = tapped.notification.request.identifier;
    if (handled.has(id)) return;
    handled.add(id);
    openLink(pushDataOf(tapped.notification).link);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [tapped, openLink]);

  const answer = async (turnOn: boolean) => {
    setAsking(false);
    await storage.setFlag('pushAsked', true);
    if (turnOn) await turnOnPush().catch(() => {});
  };

  return (
    <Sheet
      visible={asking}
      onClose={() => answer(false)}
      title={t('Turn on notifications')}
      scroll={false}
      footer={
        <View style={styles.actions}>
          <Button label={t('Not now')} variant="secondary" onPress={() => answer(false)} style={styles.flex} />
          <Button label={t('Turn on')} onPress={() => answer(true)} style={styles.flex} />
        </View>
      }
    >
      <Text style={[typography.body, { color: colors.inkSecondary }]}>
        {role === 'worker'
          ? t('Get messages from HR and updates on your applications right away, even when the app is closed.')
          : 'Get new messages and applicant updates right away, even when the app is closed.'}
      </Text>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
