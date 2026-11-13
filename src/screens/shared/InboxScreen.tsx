import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, MessageCircle } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Avatar } from '../../components/ui/Avatar';
import { inboxApi, type InboxRole } from '../../api/inboxApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { AppNotification, MessageThread } from '../../types';
import { shadows } from '../../theme/shadows';

/** Updates and messages in one place. Opened from the bell in the top bar. */
export const InboxScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useUiStore((s) => s.colors);
  const role = useAuthStore((s) => s.role) as InboxRole;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'updates' | 'messages'>('updates');

  const notes = useQuery({ queryKey: [...queryKeys.notifications, role], queryFn: () => inboxApi.notifications(role) });
  const threads = useQuery({ queryKey: [...queryKeys.messages.threads, role], queryFn: () => inboxApi.threads(role) });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications });
    qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
  };
  const markRead = useMutation({ mutationFn: (id: string) => inboxApi.markRead(role, id), onSuccess: refreshAll });
  const markAll = useMutation({ mutationFn: () => inboxApi.markAllRead(role), onSuccess: refreshAll });

  const unreadNotes = (notes.data ?? []).filter((n) => !n.read).length;
  const unreadMsgs = (threads.data ?? []).reduce((sum, th) => sum + th.unread, 0);

  const openNotification = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
    const l = n.link ?? '';
    if (l.startsWith('application:')) navigation.navigate('ApplicationDetail', { applicationId: l.slice(12) });
    else if (l === 'jobs') navigation.navigate('WorkerTabs', { screen: 'FindJobs' });
    else if (l === 'candidates') navigation.navigate('EmployerDrawer', { screen: 'EmployerMain', params: { screen: 'Candidates' } });
  };

  const openThread = (th: MessageThread) =>
    navigation.navigate('ChatThread', { threadId: th.applicationId, recipientName: th.otherName });

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t('Inbox')} showBack />
      <SegmentedTabs
        style={styles.tabs}
        value={tab}
        onChange={setTab}
        items={[
          { key: 'updates', label: t('Updates'), count: unreadNotes },
          { key: 'messages', label: t('Messages'), count: unreadMsgs },
        ]}
      />

      {tab === 'updates' ? (
        <FlatList<AppNotification>
          data={notes.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={notes.isRefetching} onRefresh={() => void notes.refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={
            unreadNotes > 0 ? (
              <Pressable onPress={() => markAll.mutate()} hitSlop={8} style={styles.markAll}>
                <Text style={[styles.markAllText, { color: colors.primary }]}>{t('Mark all as read')}</Text>
              </Pressable>
            ) : undefined
          }
          renderItem={({ item: n }) => (
            <Pressable
              onPress={() => openNotification(n)}
              style={[styles.card, { backgroundColor: n.read ? colors.surface : colors.primarySoft, borderColor: colors.border }]}
              accessibilityRole="button"
            >
              <View style={[styles.dot, { backgroundColor: n.read ? 'transparent' : colors.primary }]} />
              <View style={styles.flex}>
                <Text style={[styles.title, { color: colors.ink }]}>{t(n.title)}</Text>
                <Text style={[styles.body, { color: colors.inkSecondary }]}>{t(n.body)}</Text>
                <Text style={[styles.time, { color: colors.inkMuted }]}>{timeAgo(n.at)}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            notes.isLoading ? <ListSkeleton /> : notes.isError ? <ErrorState onRetry={() => void notes.refetch()} /> : (
              <Empty icon={<Bell size={34} color={colors.inkMuted} />} text={t('No updates yet')} />
            )
          }
        />
      ) : (
        <FlatList<MessageThread>
          data={threads.data ?? []}
          keyExtractor={(th) => th.applicationId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={threads.isRefetching} onRefresh={() => void threads.refetch()} tintColor={colors.primary} />}
          renderItem={({ item: th }) => (
            <Pressable
              onPress={() => openThread(th)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
            >
              <Avatar name={th.otherName} size="md" />
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text style={[styles.title, styles.flex, { color: colors.ink }]} numberOfLines={1}>{th.otherName}</Text>
                  {th.lastAt ? <Text style={[styles.time, { color: colors.inkMuted }]}>{timeAgo(th.lastAt)}</Text> : null}
                </View>
                <Text style={[styles.sub, { color: colors.inkMuted }]} numberOfLines={1}>{th.jobTitle}</Text>
                <Text style={[styles.body, { color: th.unread ? colors.ink : colors.inkSecondary, fontWeight: th.unread ? '700' : '400' }]} numberOfLines={1}>
                  {th.lastMessage ?? t('Say hello')}
                </Text>
              </View>
              {th.unread > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{th.unread}</Text>
                </View>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            threads.isLoading ? <ListSkeleton /> : threads.isError ? <ErrorState onRetry={() => void threads.refetch()} /> : (
              <Empty
                icon={<MessageCircle size={34} color={colors.inkMuted} />}
                text={t('No messages yet')}
                hint={t('You can message after a worker is shortlisted.')}
              />
            )
          }
        />
      )}
    </Screen>
  );
};

const Empty: React.FC<{ icon: React.ReactNode; text: string; hint?: string }> = ({ icon, text, hint }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
      {icon}
      <Text style={[styles.title, { color: colors.ink }]}>{text}</Text>
      {hint ? <Text style={[styles.body, { color: colors.inkSecondary, textAlign: 'center' }]}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { marginHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  markAll: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center' },
  markAllText: { fontSize: 13.5, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, ...shadows.card },
  dot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-start', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12.5, marginTop: 1 },
  body: { fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  time: { fontSize: 12, marginTop: 4 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
  empty: { padding: 28, borderRadius: 16, alignItems: 'center', gap: 8 },
});
