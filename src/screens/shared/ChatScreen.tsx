import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { t } from '../../lib/i18n';
import { Text } from '../../components/ui/Text';
import { useRoute } from '@react-navigation/native';
import { Send, CheckCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { useUiStore } from '../../store/uiStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

let msgCount = 0;
const newMessageId = () => `msg_local_${++msgCount}`;

export const ChatScreen: React.FC = () => {
  const { colors } = useUiStore();
  const recipientName = (useRoute().params as { recipientName?: string } | undefined)?.recipientName;
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'other',
      text: 'Namaste Ramesh ji, your profile for Senior MIG Welder has been shortlisted. Can you visit Kalinganagar Plant Gate 4 tomorrow?',
      time: '10:15 AM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Yes sir, I can attend tomorrow at 10:30 AM. Should I bring my original ITI certificate?',
      time: '10:18 AM',
    },
    {
      id: 'm3',
      sender: 'other',
      text: 'Yes, please bring Aadhaar card copy, ITI certificate, and safety shoes for welding shop trial.',
      time: '10:20 AM',
    },
  ]);

  const quickReplies = [
    'I will be there on time 👍',
    'Please share exact Google Maps location',
    'What is the reporting time at plant gate?',
    'I have all original documents ready',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: ChatMessage = {
      id: newMessageId(),
      sender: 'me',
      text: text.trim(),
      time: 'Just now',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated reply after 1.5s
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'other',
          text: 'Acknowledged. Our HR coordinator at Gate 4 has been notified.',
          time: 'Just now',
        },
      ]);
    }, 1500);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={recipientName ? `Chat: ${recipientName}` : t('Chat')} showBack />

      <ScrollView contentContainerStyle={styles.scroll}>
        {messages.map((m) => {
          const isMe = m.sender === 'me';
          return (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isMe ? colors.primary : colors.surface,
                    borderColor: isMe ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    { color: isMe ? '#FFFFFF' : colors.ink },
                  ]}
                >
                  {m.text}
                </Text>
                <View style={styles.bubbleMeta}>
                  <Text
                    style={[
                      typography.tiny,
                      { color: isMe ? 'rgba(255,255,255,0.7)' : colors.inkMuted },
                    ]}
                  >
                    {m.time}
                  </Text>
                  {isMe && (
                    <CheckCheck size={12} color="rgba(255,255,255,0.8)" style={styles.tick} />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Quick Replies Bar */}
      <View style={[styles.quickBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
          {quickReplies.map((r, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleSend(r)}
              style={[styles.quickChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            >
              <Text style={[typography.caption, { color: colors.ink, fontWeight: '600' }]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Input
          placeholder="Type a message to HR..."
          value={inputText}
          onChangeText={setInputText}
          containerStyle={styles.textInput}
          rightIcon={
            <TouchableOpacity
              onPress={() => handleSend()}
              accessibilityLabel={t('Send')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Send size={18} color={colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  bubbleWrapperRight: {
    alignSelf: 'flex-end',
  },
  bubbleWrapperLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  tick: {
    marginLeft: 4,
  },
  quickBar: {
    paddingVertical: spacing.xs + 2,
    borderTopWidth: 1,
  },
  quickScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
  textInput: {
    marginBottom: 0,
  },
});

