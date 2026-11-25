import { apiClient } from './client';
import { User } from '../types';

export const authApi = {
  async sendOtp(phone: string): Promise<{ success: boolean; message: string; isNewUser?: boolean }> {
    const res = await apiClient.post('/auth/otp/request', { phone });
    return res.data;
  },

  async verifyOtp(phone: string, otp: string, name?: string): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/otp/verify', { phone, code: otp, name });
    return res.data;
  },

  /** Backend test login (local development only, until the real login method is chosen). */
  async devLogin(body: { phone: string } | { email: string }): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/dev-login', body);
    return res.data;
  },

  async loginWithEmail(email: string, pass: string): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/login', { email, password: pass });
    return res.data;
  },

  async signupEmployer(body: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/signup/employer', body);
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ ok: boolean }> {
    const res = await apiClient.post('/auth/password/forgot', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
    const res = await apiClient.post('/auth/password/reset', { token, password });
    return res.data;
  },

  /** Ends this login on the server too, so the token can't be used again. */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async completeOnboarding(userId: string): Promise<void> {
    await apiClient.post('/auth/onboarding/complete');
  },

  async getMe(token: string): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

