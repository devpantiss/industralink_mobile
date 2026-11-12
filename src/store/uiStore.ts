import { create } from 'zustand';
import { ThemeMode, colors, ThemeColors } from '../theme/colors';
import i18n from '../lib/i18n';

interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface UiState {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  language: 'en' | 'hi' | 'or';
  setLanguage: (lang: 'en' | 'hi' | 'or') => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  colors: colors.light,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      return {
        theme: nextTheme,
        colors: colors[nextTheme],
      };
    }),
  setTheme: (theme) =>
    set(() => ({
      theme,
      colors: colors[theme],
    })),
  language: (i18n.language as 'en' | 'hi' | 'or') || 'en',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

