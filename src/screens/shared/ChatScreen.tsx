import { errorText } from '../../lib/errors';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/effects';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, Send } from '../../components/ui/icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { ErrorState } from '../../components/ui/ErrorState';
import { inboxApi, type InboxRole } from '../../api/inboxApi';
import { sendTyping, useIsTyping, useLiveConnected } from '../../api/liveChat';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../lib/format';
import { t } from '../../lib/i18n';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Message } from '../../types';
import { shadows } from '../../theme/shadows';

const WORKER_QUICK = ['I will be there on time', 'Please share the exact location', 'What time should I report?', 'I have all my documents ready'];
const HR_QUICK = ['Please bring your original documents', 'Can you join this week?', 'Please confirm you will attend', 'Thank you for your reply'];

/** A message being sent. The clientId is made once, so retries are saved only once. */
interface Draft {
  body: string;
  clientId: string;
}

/** A unique id for a message (only needs to be unique for this user). */
const newClientId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/** No answer from the server at all (bad network), as opposed to an error it sent back. */
const isNetworkError = (error: unknown) => !(error as { response?: unknown })?.response;

/** One conversation between a worker and HR about an application. */
export const ChatScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const theme = useUiStore((s) => s.theme);
  const showToast = useUiStore((s) => s.showToast);
  const role = useAuthStore((s) => s.role) as InboxRole;
  const { threadId, recipientName } = (useRoute().params ?? {}) as { threadId: string; recipientName?: string };
  const qc = useQueryClient();
  const listRef = useRef<FlatList<Message>>(null);
  const [text, setText] = useState('');

  const live = useLiveConnected();
  const typing = useIsTyping(threadId);
  // New messages come live; the timer is only a fallback, slower while connected.
  const q = useQuery({
    queryKey: [...queryKeys.messages.thread(threadId), role],
    queryFn: () => inboxApi.thread(role, threadId),
    refetchInterval: live ? 60_000 : 8_000,
  });

  const send = useMutation({
    mutationFn: ({ body, clientId }: Draft) => inboxApi.send(role, threadId, body, clientId),
    // Retry only when the network failed. The same clientId makes sure it is saved once.
    retry: (count, error) => count < 2 && isNetworkError(error),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: queryKeys.messages.thread(threadId) });
      qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
    },
    onError: (e) => showToast(errorText(e, 'Could not send. Check your connection and try again.'), 'error'),
  });

  // Opening the chat marks it read on the server: refresh the inbox list and the tab badge.
  useEffect(() => {
    if (q.dataUpdatedAt) qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
  }, [q.dataUpdatedAt, qc]);

  const messages = q.data?.messages ?? [];
  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const submit = (value?: string) => {
    const v = (value ?? text).trim();
    if (!v || send.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    send.mutate({ body: v, clientId: newClientId() });
  };

  const quick = role === 'worker' ? WORKER_QUICK : HR_QUICK;
  const title = recipientName ?? q.data?.thread.otherName ?? t('Chat');

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={title} showBack />
      {q.isError ? (
        <ErrorState onRetry={() => void q.refetch()} message={q.error instanceof Error ? q.error.message : undefined} />
      ) : (
        <>
          <FlatList
        keyboardDismissMode="on-drag"
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              q.data ? (
                <Text style={[typography.caption, styles.context, { color: colors.inkMuted }]}>
                  {q.data.thread.jobTitle} · {q.data.thread.companyName}
                </Text>
              ) : undefined
            }
            renderItem={({ item: m }) => {
              const isMe = m.fromRole === role;
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
                        {formatDateTime(m.at)}
                      </Text>
                      {isMe && m.seen !== undefined && (
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
            ListFooterComponent={
              typing ? (
                <Text style={[typography.caption, styles.typing, { color: colors.primary }]} accessibilityLiveRegion="polite">
                  {t('typing…')}
                </Text>
              ) : undefined
            }
            ListEmptyComponent={
              q.isLoading ? undefined : (
                <Text style={[typography.body, styles.empty, { color: colors.inkSecondary }]}>
                  {t('No messages yet. Say hello.')}
                </Text>
              )
            }
          />

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
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 20 },
  context: { textAlign: 'center', marginBottom: 12 },
  empty: { textAlign: 'center', marginTop: 24 },
  bubbleWrapper: { marginVertical: 4, maxWidth: '82%' },
  right: { alignSelf: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, overflow: 'hidden', ...shadows.card },
  // A tighter corner on the side of the sender, like most chat apps.
  mine: { borderBottomRightRadius: 6 },
  theirs: { borderBottomLeftRadius: 6 },
  timeRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  typing: { marginTop: 6, marginLeft: 4, fontStyle: 'italic' },
  quickBar: { paddingVertical: 6, borderTopWidth: 1 },
  quickScroll: { paddingHorizontal: spacing.lg, gap: 6 },
  quickChip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  inputBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, borderTopWidth: 1 },
  textInput: { marginBottom: 0 },
});
