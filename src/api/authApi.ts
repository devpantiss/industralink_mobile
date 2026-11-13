import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import { User } from '../types';

export const authApi = {
  async sendOtp(phone: string): Promise<{ success: boolean; message: string; isNewUser?: boolean }> {
    if (USE_MOCKS) {
      await delay();
      return { ...(await mockDb.loginWithOtp(phone)), isNewUser: !mockDb.workerExists(phone) };
    }
    const res = await apiClient.post('/auth/otp/send', { phone });
    return res.data;
  },

  async verifyOtp(phone: string, otp: string, name?: string): Promise<{ token: string; user: User }> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.verifyOtp(phone, otp, name);
    }
    const res = await apiClient.post('/auth/otp/verify', { phone, code: otp, name });
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

  async signupEmployer(body: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ token: string; user: User }> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.registerEmployer(body);
    }
    const res = await apiClient.post('/auth/signup/employer', body);
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ ok: boolean; demoResetLink?: string }> {
    if (USE_MOCKS) {
      await delay();
      return { ok: true, demoResetLink: 'industrialink://reset-password?token=demo-reset-token' };
    }
    const res = await apiClient.post('/auth/password/forgot', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
    if (USE_MOCKS) {
      await delay();
      if (!token) throw new Error('This reset link is not valid. Ask for a new one.');
      return { ok: true };
    }
    const res = await apiClient.post('/auth/password/reset', { token, password });
    return res.data;
  },

  async completeOnboarding(userId: string): Promise<void> {
    if (USE_MOCKS) {
      mockDb.markOnboarded(userId);
      return;
    }
    await apiClient.post('/auth/onboarding/complete');
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

