import { apiClient } from './client';
import type { AppNotification, Message, MessagePage, MessageThread } from '../types';

export type InboxRole = 'worker' | 'employer' | 'admin';

export const inboxApi = {
  async notifications(role: InboxRole): Promise<AppNotification[]> {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  async markRead(role: InboxRole, id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead(role: InboxRole): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  async threads(role: InboxRole): Promise<MessageThread[]> {
    const res = await apiClient.get('/messages');
    return res.data;
  },

  /** The newest 50 messages (and marks the chat read), or with `before` the 50 before that message. */
  async thread(role: InboxRole, applicationId: string, before?: string): Promise<MessagePage> {
    const res = await apiClient.get(`/messages/${applicationId}`, { params: before ? { before } : undefined });
    return res.data;
  },

  /** clientId: made once per message, so a retry after a network error is saved only once. */
  async send(role: InboxRole, applicationId: string, text: string, clientId?: string): Promise<Message> {
    const res = await apiClient.post(`/messages/${applicationId}`, { text, clientId });
    return res.data;
  },
};
