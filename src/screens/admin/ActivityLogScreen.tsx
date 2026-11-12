import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import type { AuditEntry } from '../../types';

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** Every admin action, newest first. Read-only (web: ActivityLog). */
export const ActivityLogScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const q = useQuery({ queryKey: queryKeys.admin.audit, queryFn: () => adminApi.getAudit() });

  const groups = useMemo(() => {
    const out: { day: string; rows: AuditEntry[] }[] = [];
    (q.data ?? []).forEach((r) => {
      const day = dayLabel(r.at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.rows.push(r);
      else out.push({ day, rows: [r] });
    });
    return out;
  }, [q.data]);

  return (
    <Screen edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.title, { color: colors.ink }]}>Activity log</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
          Every admin action, newest first. This list can’t be edited.
        </Text>

        {q.isLoading ? (
          <ListSkeleton />
        ) : groups.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <ScrollText size={30} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>No activity yet</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.day} style={styles.group}>
              <Text style={[styles.day, { color: colors.inkMuted }]}>{g.day}</Text>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {g.rows.map((r, i) => (
                  <View
                    key={r.id}
                    style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                  >
                    <Text style={[styles.time, { color: colors.inkMuted }]}>{timeLabel(r.at)}</Text>
                    <Text style={[styles.text, { color: colors.inkSecondary }]}>
                      <Text style={[styles.strong, { color: colors.ink }]}>{r.actor}</Text> {r.action.toLowerCase()}{' '}
                      <Text style={[styles.strong, { color: colors.ink }]}>{r.target}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  group: { marginBottom: 14 },
  day: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginLeft: 4 },
  card: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  time: { width: 64, fontSize: 12.5, paddingTop: 1 },
  text: { flex: 1, fontSize: 14, lineHeight: 20 },
  strong: { fontWeight: '700' },
  empty: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});
