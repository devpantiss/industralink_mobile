import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { accountApi } from '../api/accountApi';
import { storage } from './storage';

/**
 * Phone notifications, sent by the backend through Firebase.
 *
 * Android only for now: there the phone gives a Firebase token, which the backend sends to.
 * An iPhone gives an Apple token instead; that comes with the iPhone step (my-notes/PUSH_PLAN.md).
 * Never in Expo Go: it cannot receive push, and the library stops the app there on purpose.
 */
export const pushSupported = Platform.OS === 'android' && !isRunningInExpoGo();

/**
 * - on: allowed, and not turned off in our Settings
 * - ask: the phone has not asked yet
 * - blocked: turned off in the phone's own settings (we can only send people there)
 * - off: turned off in our Settings, or not supported on this phone yet
 */
export type PushState = 'on' | 'ask' | 'blocked' | 'off';

/** What the backend puts in every push (all strings). */
export interface PushData {
  channel?: 'messages' | 'updates';
  /** The screen to open, as a dashboard address (see appLinks.ts). */
  link?: string;
  /** "chat-<applicationId>" for chat messages. */
  group?: string;
}

/** The backend's data, wherever this Android version put it. */
export function pushDataOf(notification: Notifications.Notification): PushData {
  const trigger = notification.request.trigger as { remoteMessage?: { data?: Record<string, string> } } | null;
  return { ...trigger?.remoteMessage?.data, ...(notification.request.content.data as PushData | null) };
}

/** The chat on screen right now: its messages don't pop up as notifications. */
let openChatId: string | null = null;

export function setOpenChat(applicationId: string | null) {
  openChatId = applicationId;
}

// While the app is open: show notifications as usual, except for the chat being read.
if (pushSupported) Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const show = !openChatId || pushDataOf(notification).group !== `chat-${openChatId}`;
    return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
  },
});

/**
 * The two kinds the backend sends (PushData.channel). People can mute each one in the
 * phone's settings. Must exist before asking for permission or a token on Android 13+.
 */
async function createChannels() {
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    description: 'New chat messages',
    importance: AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync('updates', {
    name: 'Job updates',
    description: 'Shortlisted, interview, offer and other updates',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function getPushState(): Promise<PushState> {
  if (!pushSupported || (await storage.getFlag('pushOff'))) return 'off';
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return 'on';
  return permission.canAskAgain ? 'ask' : 'blocked';
}

/** The token the backend already has for this login, so it is sent only once. */
let sentToken: string | null = null;

/** Tells the backend where to send this account's notifications (a new or changed token). */
export async function sendToken(token: string): Promise<void> {
  if (token === sentToken || (await getPushState()) !== 'on' || token === sentToken) return;
  // Claimed before the request, so a second call at the same moment doesn't send it again.
  sentToken = token;
  try {
    await accountApi.savePushToken(token);
  } catch (error) {
    sentToken = null;
    throw error;
  }
}

/** Registers this phone for the logged-in account. Safe to call often. */
export async function registerPhone(): Promise<void> {
  if ((await getPushState()) !== 'on') return;
  await createChannels();
  const { data } = await Notifications.getDevicePushTokenAsync();
  await sendToken(String(data));
}

/** Asks the phone for permission (Android shows its own dialog once), then registers. */
export async function turnOnPush(): Promise<PushState> {
  await storage.setFlag('pushOff', false);
  await createChannels();
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return permission.canAskAgain ? 'ask' : 'blocked';
  await registerPhone();
  return 'on';
}

/** Our own off switch: the backend stops sending to this phone. */
export async function turnOffPush(): Promise<void> {
  await storage.setFlag('pushOff', true);
  await accountApi.removePushToken();
  sentToken = null;
}

/**
 * At logout (also on a shared phone): the previous person's notifications leave the tray,
 * and the phone's token is thrown away, so nothing more arrives for that account even if
 * the backend could not be told. The next login gets a new token.
 */
export async function forgetPhone(): Promise<void> {
  sentToken = null;
  if (!pushSupported) return;
  await Promise.allSettled([
    Notifications.dismissAllNotificationsAsync(),
    Notifications.clearLastNotificationResponseAsync(),
    Notifications.unregisterForNotificationsAsync(),
  ]);
}

/** Removes a chat's notifications from the phone once the chat is open. */
export async function clearChatNotifications(applicationId: string): Promise<void> {
  if (!pushSupported) return;
  const shown = await Notifications.getPresentedNotificationsAsync();
  const group = `chat-${applicationId}`;
  await Promise.all(
    shown
      .filter((notification) => pushDataOf(notification).group === group)
      .map((notification) => Notifications.dismissNotificationAsync(notification.request.identifier)),
  );
}
