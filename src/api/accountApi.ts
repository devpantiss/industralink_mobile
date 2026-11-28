import { apiClient } from './client';
import type { SupportTicket, User, UserSettings } from '../types';

export const accountApi = {
  async getSettings(): Promise<UserSettings> {
    const res = await apiClient.get('/me/settings');
    return res.data;
  },

  async updateSettings(changes: Partial<UserSettings>): Promise<UserSettings> {
    const res = await apiClient.patch('/me/settings', changes);
    return res.data;
  },

  /** `current` is left out when the account has no password yet (made with Google). */
  async changePassword(current: string | undefined, next: string): Promise<void> {
    await apiClient.post('/auth/password/change', { current, next });
  },

  /** Worker's mobile number (10 digits), for companies to call. 409 PHONE_TAKEN if another account has it. */
  async savePhone(phone: string): Promise<User> {
    const res = await apiClient.put('/me/phone', { phone });
    return res.data;
  },

  async deleteAccount(): Promise<void> {
    await apiClient.post('/me/delete', { confirm: 'DELETE' });
  },

  /** This phone's Firebase id, so the backend can send push notifications to it. */
  async savePushToken(token: string): Promise<void> {
    await apiClient.put('/me/push-token', { token, platform: 'android' });
  },

  /** No more push notifications on this phone for this login. */
  async removePushToken(): Promise<void> {
    await apiClient.delete('/me/push-token');
  },

  /** Help form: becomes a ticket the admin team sees under Reports & help. */
  async sendSupport(body: Omit<SupportTicket, 'id' | 'at' | 'status'>): Promise<void> {
    await apiClient.post('/support', body);
  },
};
