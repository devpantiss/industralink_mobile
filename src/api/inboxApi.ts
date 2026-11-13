import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import type { AppNotification, Message, MessageThread } from '../types';

export type InboxRole = 'worker' | 'employer';

export const inboxApi = {
  async notifications(role: InboxRole): Promise<AppNotification[]> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getNotifications(role);
    }
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  async markRead(role: InboxRole, id: string): Promise<void> {
    if (USE_MOCKS) return mockDb.markNotificationRead(id);
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead(role: InboxRole): Promise<void> {
    if (USE_MOCKS) return mockDb.markAllNotificationsRead(role);
    await apiClient.post('/notifications/read-all');
  },

  async threads(role: InboxRole): Promise<MessageThread[]> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getThreads(role);
    }
    const res = await apiClient.get('/messages');
    return res.data;
  },

  async thread(role: InboxRole, applicationId: string): Promise<{ thread: MessageThread; messages: Message[] }> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getThread(role, applicationId);
    }
    const res = await apiClient.get(`/messages/${applicationId}`);
    return res.data;
  },

  async send(role: InboxRole, applicationId: string, text: string): Promise<Message> {
    if (USE_MOCKS) {
      await delay(80);
      return mockDb.sendMessage(role, applicationId, text);
    }
    const res = await apiClient.post(`/messages/${applicationId}`, { text });
    return res.data;
  },
};
