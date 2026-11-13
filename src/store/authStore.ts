import { create } from 'zustand';
import { User, Role } from '../types';
import { storage } from '../lib/storage';
import { authApi } from '../api/authApi';

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
  switchRole: (role: Role) => void;
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
      const res = await authApi.verifyOtp(phone, otp);
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
    get().updateUser({ ...partial, onboarded: true });
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
    await storage.clearAll();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  switchRole: (role: Role) => {
    let mockUser: User;
    if (role === 'worker') {
      mockUser = {
        id: 'usr_worker_1',
        name: 'Ramesh Kumar',
        phone: '+91 98765 43210',
        role: 'worker',
        verified: true,
        onboarded: true,
        city: 'Jamshedpur',
        trade: 'welder',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    } else if (role === 'employer') {
      mockUser = {
        id: 'usr_employer_1',
        name: 'Pradeep Mohanty',
        phone: '+91 98111 22334',
        email: 'recruiter@eastline.demo',
        role: 'employer',
        verified: true,
        onboarded: true,
        companyName: 'Eastline Heavy Engineering',
        city: 'Kalinganagar',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    } else {
      mockUser = {
        id: 'usr_admin_1',
        name: 'IndustriaLink Admin',
        phone: '+91 99999 88888',
        email: 'ops@industrialink.in',
        role: 'admin',
        verified: true,
        onboarded: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }
    const token = `mock-jwt-token-${role}`;
    storage.setToken(token);
    storage.setUser(mockUser);
    set({
      role,
      token,
      user: mockUser,
      isAuthenticated: true,
    });
  },

  loginAsDemo: async (role: Role) => {
    get().switchRole(role);
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
