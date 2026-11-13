import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import { User } from '../types';

/** The demo worker's number: the only one that counts as an existing account in mock mode. */
export const DEMO_WORKER_PHONE = '9876543210';

export const authApi = {
  async sendOtp(phone: string): Promise<{ success: boolean; message: string; isNewUser?: boolean }> {
    if (USE_MOCKS) {
      await delay();
      // In the demo, only the prefilled number already has an account.
      return { ...(await mockDb.loginWithOtp(phone)), isNewUser: phone !== DEMO_WORKER_PHONE };
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

  async signupEmployer(body: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ token: string; user: User }> {
    if (USE_MOCKS) {
      await delay();
      const user: User = {
        id: `usr_employer_${Date.now()}`,
        name: body.name,
        phone: '',
        email: body.email,
        role: 'employer',
        verified: false,
        onboarded: false,
        companyName: body.companyName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      return { token: 'mock-jwt-token-employer', user };
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

  async getMe(token: string): Promise<User> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getMe(token);
    }
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

