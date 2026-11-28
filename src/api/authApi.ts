import { apiClient } from './client';
import { User } from '../types';

export const authApi = {
  /**
   * Google: log in or create the account. `created` is true for a new account (welcome steps next).
   * A new HR account also needs `companyName` (otherwise 422 COMPANY_NAME_NEEDED).
   */
  async googleLogin(
    idToken: string,
    role: 'worker' | 'employer',
    companyName?: string,
  ): Promise<{ token: string; user: User; created: boolean }> {
    const res = await apiClient.post('/auth/google', { idToken, role, companyName });
    return { ...res.data, created: res.status === 201 };
  },

  /** Backend test login (local development only, until the real login method is chosen). */
  async devLogin(body: { phone: string } | { email: string }): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/dev-login', body);
    return res.data;
  },

  /** `role` is the tab the person chose; the server refuses the wrong tab (409 WRONG_ROLE). */
  async loginWithEmail(email: string, password: string, role: 'worker' | 'employer'): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/login', { email, password, role });
    return res.data;
  },

  async signupWorker(body: { name: string; phone: string; email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/signup/worker', body);
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

  /** A worker needs a mobile number first (422 PHONE_NEEDED). */
  async completeOnboarding(): Promise<User> {
    const res = await apiClient.post('/auth/onboarding/complete');
    return res.data;
  },

  async getMe(token: string): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

