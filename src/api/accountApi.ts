import { apiClient } from './client';
import type { SupportTicket, UserSettings } from '../types';

export const accountApi = {
  async getSettings(): Promise<UserSettings> {
    const res = await apiClient.get('/me/settings');
    return res.data;
  },

  async updateSettings(changes: Partial<UserSettings>): Promise<UserSettings> {
    const res = await apiClient.patch('/me/settings', changes);
    return res.data;
  },

  async changePassword(current: string, next: string): Promise<void> {
    await apiClient.post('/auth/password/change', { current, next });
  },

  async deleteAccount(): Promise<void> {
    await apiClient.post('/me/delete', { confirm: 'DELETE' });
  },

  /** Help form: becomes a ticket the admin team sees under Reports & help. */
  async sendSupport(body: Omit<SupportTicket, 'id' | 'at' | 'status'>): Promise<void> {
    await apiClient.post('/support', body);
  },
};
