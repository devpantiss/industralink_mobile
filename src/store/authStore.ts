import { create } from 'zustand';
import { User, Role } from '../types';
import { storage } from '../lib/storage';
import { authApi } from '../api/authApi';
import { forgetPhone } from '../lib/push';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role;
  initAuth: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; isNewUser?: boolean }>;
  verifyOtp: (phone: string, otp: string, extra?: Partial<User>) => Promise<void>;
  signupEmployer: (body: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  completeOnboarding: (partial?: Partial<User>) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (role: Role) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  role: 'worker',

  initAuth: async () => {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser();
      if (token && user) {
        set({
          token,
          user,
          isAuthenticated: true,
          role: user.role,
          isLoading: false,
        });
      } else {
        // No saved session: show the login screen.
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  sendOtp: async (phone: string) => {
    return authApi.sendOtp(phone);
  },

  verifyOtp: async (phone: string, otp: string, extra?: Partial<User>) => {
    try {
      const res = await authApi.verifyOtp(phone, otp, extra?.name);
      const token = res.token;
      // `extra` is merged before signing in, so a new account goes straight to onboarding.
      const user = { ...res.user, ...extra };
      await storage.setToken(token);
      await storage.setUser(user);
      set({
        token,
        user,
        isAuthenticated: true,
        role: user.role,
      });
    } catch (err) {
      throw err;
    }
  },

  signupEmployer: async (body) => {
    const { token, user } = await authApi.signupEmployer(body);
    await storage.setToken(token);
    await storage.setUser(user);
    set({ token, user, isAuthenticated: true, role: user.role });
  },

  completeOnboarding: (partial) => {
    const id = get().user?.id;
    get().updateUser({ ...partial, onboarded: true });
    if (id) void authApi.completeOnboarding(id).catch(() => {});
  },

  loginWithEmail: async (email: string, pass: string) => {
    try {
      const { token, user } = await authApi.loginWithEmail(email, pass);
      await storage.setToken(token);
      await storage.setUser(user);
      set({
        token,
        user,
        isAuthenticated: true,
        role: user.role,
      });
    } catch (err) {
      throw err;
    }
  },

  logout: async () => {
    // Best effort: log out on the phone even if the server can't be reached.
    await authApi.logout().catch(() => {});
    await forgetPhone();
    await storage.clearAll();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loginAsDemo: async (role: Role) => {
    // The backend's test login (local development only) with its demo accounts.
    const body =
      role === 'worker'
        ? { phone: '9876543210' }
        : { email: role === 'employer' ? 'hr@konark.demo' : 'admin@industrialink.demo' };
    const { token, user } = await authApi.devLogin(body);
    await storage.setToken(token);
    await storage.setUser(user);
    set({ token, user, isAuthenticated: true, role: user.role });
  },

  updateUser: (partial: Partial<User>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partial };
      storage.setUser(updated);
      set({ user: updated });
    }
  },
}));
