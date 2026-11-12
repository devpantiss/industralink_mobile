import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import { User } from '../types';

export const authApi = {
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.loginWithOtp(phone);
    }
    const res = await apiClient.post('/auth/otp/send', { phone });
    return res.data;
  },

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: User }> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.verifyOtp(phone, otp);
    }
    const res = await apiClient.post('/auth/otp/verify', { phone, otp });
    return res.data;
  },

  async loginWithEmail(email: string, pass: string): Promise<{ token: string; user: User }> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.loginWithEmail(email, pass);
    }
    const res = await apiClient.post('/auth/login', { email, password: pass });
    return res.data;
  },

  async getMe(token: string): Promise<User> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getMe(token);
    }
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

