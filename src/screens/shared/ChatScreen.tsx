import { errorText } from '../../lib/errors';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { ErrorState } from '../../components/ui/ErrorState';
import { inboxApi, type InboxRole } from '../../api/inboxApi';
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

/** One conversation between a worker and HR about an application. */
export const ChatScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const role = useAuthStore((s) => s.role) as InboxRole;
  const { threadId, recipientName } = (useRoute().params ?? {}) as { threadId: string; recipientName?: string };
  const qc = useQueryClient();
  const listRef = useRef<FlatList<Message>>(null);
  const [text, setText] = useState('');

  const q = useQuery({
    queryKey: [...queryKeys.messages.thread(threadId), role],
    queryFn: () => inboxApi.thread(role, threadId),
    refetchInterval: 8000,
  });

  const send = useMutation({
    mutationFn: (msg: string) => inboxApi.send(role, threadId, msg),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: queryKeys.messages.thread(threadId) });
      qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
    },
    onError: (e) => showToast(errorText(e, 'Could not send. Check your connection and try again.'), 'error'),
  });

  const messages = q.data?.messages ?? [];
  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const submit = (value?: string) => {
    const v = (value ?? text).trim();
    if (!v || send.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    send.mutate(v);
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
                      { backgroundColor: isMe ? colors.primary : colors.surface, borderColor: isMe ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[typography.body, { color: isMe ? '#FFFFFF' : colors.ink }]}>{m.text}</Text>
                    <Text style={[typography.tiny, styles.time, { color: isMe ? 'rgba(255,255,255,0.75)' : colors.inkMuted }]}>
                      {formatDateTime(m.at)}
                    </Text>
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
              onChangeText={setText}
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
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, ...shadows.card },
  time: { marginTop: 4, textAlign: 'right' },
  quickBar: { paddingVertical: 6, borderTopWidth: 1 },
  quickScroll: { paddingHorizontal: spacing.lg, gap: 6 },
  quickChip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  inputBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, borderTopWidth: 1 },
  textInput: { marginBottom: 0 },
});
