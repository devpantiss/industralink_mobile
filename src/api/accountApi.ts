import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import type { SupportTicket, UserSettings } from '../types';

// Demo-mode copy of the user's settings (lost when the app restarts, like the other demo data).
let mockSettings: UserSettings = {
  language: 'en',
  jobAlerts: true,
  smsAlerts: true,
  whatsappAlerts: false,
  visibleToEmployers: true,
};

export const accountApi = {
  async getSettings(): Promise<UserSettings> {
    if (USE_MOCKS) {
      await delay(50);
      return mockSettings;
    }
    const res = await apiClient.get('/me/settings');
    return res.data;
  },

  async updateSettings(changes: Partial<UserSettings>): Promise<UserSettings> {
    if (USE_MOCKS) {
      await delay(80);
      mockSettings = { ...mockSettings, ...changes };
      return mockSettings;
    }
    const res = await apiClient.patch('/me/settings', changes);
    return res.data;
  },

  async changePassword(current: string, next: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(150);
      if (!current) throw new Error('Enter your current password.');
      if (next.length < 8) throw new Error('Use at least 8 characters.');
      return;
    }
    await apiClient.post('/auth/password/change', { current, next });
  },

  async deleteAccount(): Promise<void> {
    if (USE_MOCKS) {
      await delay(200);
      return;
    }
    await apiClient.post('/me/delete', { confirm: 'DELETE' });
  },

  /** Help form: becomes a ticket the admin team sees under Reports & help. */
  async sendSupport(body: Omit<SupportTicket, 'id' | 'at' | 'status'>): Promise<void> {
    if (USE_MOCKS) {
      await delay(150);
      await mockDb.createTicket(body);
      return;
    }
    await apiClient.post('/support', body);
  },
};
