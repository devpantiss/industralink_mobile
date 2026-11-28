import { create } from 'zustand';
import { User, Role } from '../types';
import { storage } from '../lib/storage';
import { authApi } from '../api/authApi';
import { forgetPhone } from '../lib/push';
import { forgetGoogle } from '../lib/googleSignIn';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role;
  initAuth: () => Promise<void>;
  signupWorker: (body: { name: string; phone: string; email: string; password: string }) => Promise<void>;
  signupEmployer: (body: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  /** Tells the server the welcome steps are done. Throws if it refuses (e.g. no mobile number yet). */
  completeOnboarding: (partial?: Partial<User>) => Promise<void>;
  loginWithEmail: (email: string, password: string, role: 'worker' | 'employer') => Promise<void>;
  /** Returns true when a new account was made. */
  loginWithGoogle: (idToken: string, role: 'worker' | 'employer', companyName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginAsDemo: (role: Role) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

/** Saves the login on the phone and shows the signed-in app. */
async function signIn(token: string, user: User, set: (state: Partial<AuthStoreState>) => void) {
  await storage.setToken(token);
  await storage.setUser(user);
  set({ token, user, isAuthenticated: true, role: user.role });
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

  signupWorker: async (body) => {
    const { token, user } = await authApi.signupWorker(body);
    await signIn(token, user, set);
  },

  signupEmployer: async (body) => {
    const { token, user } = await authApi.signupEmployer(body);
    await signIn(token, user, set);
  },

  completeOnboarding: async (partial) => {
    const user = await authApi.completeOnboarding();
    get().updateUser({ ...partial, ...user });
  },

  loginWithEmail: async (email, password, role) => {
    const { token, user } = await authApi.loginWithEmail(email, password, role);
    await signIn(token, user, set);
  },

  loginWithGoogle: async (idToken, role, companyName) => {
    const { token, user, created } = await authApi.googleLogin(idToken, role, companyName);
    await signIn(token, user, set);
    return created;
  },

  logout: async () => {
    // Best effort: log out on the phone even if the server can't be reached.
    await authApi.logout().catch(() => {});
    await forgetPhone();
    await forgetGoogle();
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
    await signIn(token, user, set);
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
