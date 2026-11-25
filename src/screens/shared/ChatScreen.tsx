import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, CheckCheck, Lock, Send } from '../../components/ui/icons';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { ErrorState } from '../../components/ui/ErrorState';
import { TypingBubble } from '../../components/ui/TypingBubble';
import { inboxApi, type InboxRole } from '../../api/inboxApi';
import { sendTyping, useAppActive, useIsTyping, useLiveConnected } from '../../api/liveChat';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { errorText } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { t } from '../../lib/i18n';
import { gradients } from '../../theme/effects';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Message, MessagePage } from '../../types';

const WORKER_QUICK = ['I will be there on time', 'Please share the exact location', 'What time should I report?', 'I have all my documents ready'];
const HR_QUICK = ['Please bring your original documents', 'Can you join this week?', 'Please confirm you will attend', 'Thank you for your reply'];

/** Longest message the server accepts. */
const MAX_LENGTH = 1000;
/** Id of the message shown while it is being sent. */
const SENDING_ID = 'sending';

/** A message being sent. The clientId is made once, so retries are saved only once. */
interface Draft {
  body: string;
  clientId: string;
}

const newClientId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/** No answer from the server at all (bad network), as opposed to an error it sent back. */
const isNetworkError = (error: unknown) => !(error as { response?: unknown })?.response;

/** Joins two lists of messages without copies (the newer copy wins), oldest first. */
function mergeMessages(older: Message[], newer: Message[]): Message[] {
  const byId = new Map(older.map((m) => [m.id, m]));
  for (const m of newer) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

/** One conversation between a worker and HR about an application. */
export const ChatScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const showToast = useUiStore((s) => s.showToast);
  const role = useAuthStore((s) => s.role) as InboxRole;
  const { threadId, recipientName } = (useRoute().params ?? {}) as { threadId: string; recipientName?: string };
  const qc = useQueryClient();
  const listRef = useRef<FlatList<Message>>(null);
  const atBottom = useRef(true);
  const [text, setText] = useState('');

  const live = useLiveConnected();
  const typing = useIsTyping(threadId);
  const focused = useIsFocused();
  const appActive = useAppActive();

  // Loading the chat marks it read, so it only loads while it is really on screen.
  const threadKey = [...queryKeys.messages.thread(threadId), role];
  const q = useQuery({
    queryKey: threadKey,
    queryFn: () => inboxApi.thread(role, threadId),
    enabled: focused && appActive,
    refetchInterval: live ? 60_000 : 8_000,
  });

  // Older pages from "Load earlier messages". Everything shown so far is kept too,
  // so nothing drops out of the list as new messages arrive.
  const [older, setOlder] = useState<{ messages: Message[]; hasMore: boolean } | null>(null);
  const loadOlder = useMutation({
    mutationFn: (before: string) => inboxApi.thread(role, threadId, before),
    onSuccess: (page: MessagePage) =>
      setOlder((prev) => ({
        messages: mergeMessages(page.messages, mergeMessages(prev?.messages ?? [], q.data?.messages ?? [])),
        hasMore: page.hasMore,
      })),
    onError: (e) => showToast(errorText(e, 'Could not load messages. Try again.'), 'error'),
  });

  const send = useMutation({
    mutationFn: ({ body, clientId }: Draft) => inboxApi.send(role, threadId, body, clientId),
    retry: (count, error) => count < 2 && isNetworkError(error),
    onMutate: async ({ body }) => {
      await qc.cancelQueries({ queryKey: threadKey });
      const prev = qc.getQueryData<MessagePage>(threadKey);
      if (prev) {
        const sending: Message = {
          id: SENDING_ID,
          applicationId: threadId,
          fromUserId: '',
          fromRole: role === 'worker' ? 'worker' : 'employer',
          text: body,
          at: new Date().toISOString(),
        };
        qc.setQueryData<MessagePage>(threadKey, { ...prev, messages: [...prev.messages, sending] });
      }
      setText('');
      return { prev };
    },
    onError: (e, { body }, ctx) => {
      if (ctx?.prev) qc.setQueryData(threadKey, ctx.prev);
      setText(body);
      showToast(errorText(e, 'Could not send. Check your connection and try again.'), 'error');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages.thread(threadId) });
      qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
    },
  });

  // Loading the chat marked it read: refresh the inbox list and the tab badge.
  useEffect(() => {
    if (q.dataUpdatedAt) qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
  }, [q.dataUpdatedAt, qc]);

  const messages = useMemo(() => mergeMessages(older?.messages ?? [], q.data?.messages ?? []), [older, q.data]);
  const hasMore = older ? older.hasMore : (q.data?.hasMore ?? false);
  const canSend = q.data?.thread.canSend ?? false;

  // The list is inverted (newest at the bottom, like every chat app), so it opens at the
  // newest message by itself and older pages are added at the top without a jump.
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const lastId = messages.at(-1)?.id;
  const lastIsMine = messages.at(-1)?.fromRole === role;
  // Go to the bottom for your own new message, or for any new one / the typing bubble
  // when you were already there. Reading older messages is never interrupted.
  useEffect(() => {
    if (lastId && (lastIsMine || atBottom.current)) listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [lastId, lastIsMine]);
  useEffect(() => {
    if (typing && atBottom.current) listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [typing]);

  const submit = (value?: string) => {
    const v = (value ?? text).trim();
    if (!v || send.isPending || !canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    send.mutate({ body: v, clientId: newClientId() });
  };

  const quick = role === 'worker' ? WORKER_QUICK : HR_QUICK;
  const title = recipientName || q.data?.thread.otherName || t('Chat');
  const job = q.data ? `${q.data.thread.jobTitle} · ${q.data.thread.companyName}` : undefined;

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={title} subtitle={typing ? t('typing…') : job} subtitleHighlight={typing} showBack />
      {q.isError ? (
        <ErrorState onRetry={() => void q.refetch()} message={q.error instanceof Error ? q.error.message : undefined} />
      ) : (
        <>
          <FlatList
            ref={listRef}
            inverted
            data={newestFirst}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.scroll}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScroll={({ nativeEvent }) => {
              atBottom.current = nativeEvent.contentOffset.y < 80;
            }}
            scrollEventThrottle={100}
            ListHeaderComponent={typing ? <TypingBubble /> : undefined}
            ListFooterComponent={
              hasMore ? (
                <Pressable
                  onPress={() => loadOlder.mutate(messages[0].id)}
                  disabled={loadOlder.isPending}
                  accessibilityRole="button"
                  style={[styles.loadOlder, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                    {loadOlder.isPending ? t('Loading…') : t('Load earlier messages')}
                  </Text>
                </Pressable>
              ) : undefined
            }
            renderItem={({ item: m }) => {
              const isMe = m.fromRole === role;
              const sending = m.id === SENDING_ID;
              return (
                <View style={[styles.bubbleWrapper, isMe ? styles.right : styles.left]}>
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.mine : styles.theirs,
                      { backgroundColor: isMe ? 'transparent' : colors.surface, borderColor: isMe ? 'transparent' : colors.border },
                    ]}
                  >
                    {isMe && (
                      <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    )}
                    <Text style={[typography.body, { color: isMe ? '#FFFFFF' : colors.ink }]}>{m.text}</Text>
                    <View style={styles.timeRow}>
                      <Text style={[typography.tiny, { color: isMe ? 'rgba(255,255,255,0.75)' : colors.inkMuted }]}>
                        {sending ? t('Sending…') : formatDateTime(m.at)}
                      </Text>
                      {isMe && !sending && m.seen !== undefined && (
                        <View accessible accessibilityLabel={m.seen ? t('Seen') : t('Sent')}>
                          {m.seen ? (
                            <CheckCheck size={14} color="#FFFFFF" weight="bold" />
                          ) : (
                            <Check size={14} color="rgba(255,255,255,0.75)" />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              q.isLoading ? undefined : (
                <Text style={[typography.body, styles.empty, { color: colors.inkSecondary }]}>
                  {t('No messages yet. Say hello.')}
                </Text>
              )
            }
          />

          {q.data && !canSend ? (
            <View style={[styles.closedBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <Lock size={16} color={colors.inkMuted} />
              <Text style={[typography.caption, { color: colors.inkMuted }]}>{t('This conversation is closed.')}</Text>
            </View>
          ) : (
            <>
              <View style={[styles.quickBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <FlatList
                  horizontal
                  data={quick}
                  keyExtractor={(r) => r}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickScroll}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item: r }) => (
                    <Pressable
                      onPress={() => submit(r)}
                      style={[styles.quickChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                    >
                      <Text style={[typography.caption, { color: colors.ink, fontWeight: '600' }]}>{t(r)}</Text>
                    </Pressable>
                  )}
                />
              </View>

              <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <Input
                  placeholder={t('Type a message')}
                  value={text}
                  onChangeText={(value) => {
                    setText(value);
                    if (value.trim()) sendTyping(threadId);
                  }}
                  onSubmitEditing={() => submit()}
                  maxLength={MAX_LENGTH}
                  returnKeyType="send"
                  containerStyle={styles.textInput}
                  rightIcon={
                    <Pressable onPress={() => submit()} accessibilityLabel={t('Send')} hitSlop={10} disabled={!text.trim() || send.isPending}>
                      <Send size={20} color={text.trim() ? colors.primary : colors.inkMuted} />
                    </Pressable>
                  }
                />
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  loadOlder: { alignSelf: 'center', marginBottom: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  empty: { textAlign: 'center', marginTop: 24 },
  bubbleWrapper: { marginVertical: 4, maxWidth: '82%' },
  right: { alignSelf: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, overflow: 'hidden', ...shadows.card },
  // A tighter corner on the side of the sender, like most chat apps.
  mine: { borderBottomRightRadius: 6 },
  theirs: { borderBottomLeftRadius: 6 },
  timeRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  closedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1 },
  quickBar: { paddingVertical: 6, borderTopWidth: 1 },
  quickScroll: { paddingHorizontal: spacing.lg, gap: 6 },
  quickChip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  inputBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, borderTopWidth: 1 },
  textInput: { marginBottom: 0 },
});
