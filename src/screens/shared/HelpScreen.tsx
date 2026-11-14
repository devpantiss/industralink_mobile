import React, { useState } from 'react';
import { Chip } from '../../components/ui/Chip';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronDown, CheckCircle2 } from '../../components/ui/icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { accountApi } from '../../api/accountApi';
import { t } from '../../lib/i18n';
import { spacing } from '../../theme/spacing';

const WORKER_FAQ: [string, string][] = [
  ['Do I have to pay to get a job?', 'No. IndustriaLink is always free for workers. If anyone asks you for money for a job, report the job and do not pay.'],
  ['When will the company call me?', 'Companies see your phone number only after they shortlist you. Most reply in 2 to 3 days.'],
  ['How do I change my mobile number?', 'Send us a message below with your old and new number. We will check and change it.'],
  ['How do I report a fake job?', 'Open the job, tap Report at the bottom, and choose the reason.'],
];
const HR_FAQ: [string, string][] = [
  ['Why are my jobs not live yet?', 'New companies are checked by our team first. Add your GST certificate under Company profile to speed this up.'],
  ['When can I see a worker’s phone number?', 'After you shortlist them. This protects workers from spam calls.'],
  ['Can I edit a job after posting?', 'Yes. Open Jobs, tap the three dots on the job, and choose Edit job.'],
];
const TOPICS = ['Account or login', 'A job or company', 'Payment asked', 'Something else'];

/** Common questions and a message form that reaches the admin team. */
export const HelpScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const { user, role } = useAuthStore();
  const navigation = useNavigation();
  const [open, setOpen] = useState<number | null>(0);
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const faq = role === 'worker' ? WORKER_FAQ : HR_FAQ;

  const send = async () => {
    if (message.trim().length < 10) return setError(t('Write a little more so we can help, at least 10 letters.'));
    setError(undefined);
    setSending(true);
    try {
      await accountApi.sendSupport({
        userId: user?.id,
        name: user?.name ?? 'Guest',
        contact: user?.phone || user?.email || '',
        role: role ?? 'guest',
        topic,
        message: message.trim(),
      });
      setSent(true);
      setMessage('');
    } catch {
      showToast(t('Could not send. Check your connection and try again.'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t('Help')} showBack />
      <KeyboardScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, { color: colors.inkSecondary }]}>{t('Common questions')}</Text>
        <Card padding={0}>
          {faq.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <View key={q} style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
                <Pressable
                  onPress={() => setOpen(isOpen ? null : i)}
                  style={styles.qRow}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                >
                  <Text style={[styles.q, { color: colors.ink }]}>{t(q)}</Text>
                  <ChevronDown size={18} color={colors.inkMuted} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                </Pressable>
                {isOpen && (
                  <Animated.View entering={FadeIn.duration(180)}>
                    <Text style={[styles.a, { color: colors.inkSecondary }]}>{t(a)}</Text>
                  </Animated.View>
                )}
              </View>
            );
          })}
        </Card>

        <Text style={[styles.section, { color: colors.inkSecondary }]}>{t('Send us a message')}</Text>
        <Card>
          {sent ? (
            <View style={styles.sent}>
              <CheckCircle2 size={32} color={colors.successFg} />
              <Text style={[styles.q, { color: colors.ink, textAlign: 'center' }]}>{t('Message sent')}</Text>
              <Text style={[styles.a, { color: colors.inkSecondary, textAlign: 'center', paddingHorizontal: 0 }]}>
                {t('Our team will reply on your registered number within 1 working day.')}
              </Text>
              <Button label={t('Done')} variant="outline" onPress={() => navigation.goBack()} />
            </View>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.inkSecondary }]}>{t('Topic')}</Text>
              <View style={styles.chips}>
                {TOPICS.map((tp) => (
                  <Chip key={tp} label={t(tp)} selected={tp === topic} onPress={() => setTopic(tp)} />
                ))}
              </View>
              <Input
                label={t('Your message')}
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder={t('Tell us what happened')}
                error={error}
                containerStyle={styles.msg}
              />
              <Button label={t('Send message')} onPress={send} loading={sending} />
            </>
          )}
        </Card>
      </KeyboardScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.sm },
  section: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.md, marginLeft: 4 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 },
  q: { flex: 1, fontSize: 15, fontWeight: '600' },
  a: { fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 16 },
  label: { fontSize: 13.5, fontWeight: '500', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  msg: { marginTop: 4 },
  sent: { alignItems: 'center', gap: 10, paddingVertical: 8 },
});
