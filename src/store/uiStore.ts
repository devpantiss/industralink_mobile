import { create } from 'zustand';
import { ThemeMode, colors, ThemeColors } from '../theme/colors';
import * as SecureStore from 'expo-secure-store';
import i18n from '../lib/i18n';

const PREFS_KEY = 'industrialink_ui_prefs';
type Lang = 'en' | 'hi' | 'or';

function savePrefs(theme: ThemeMode, language: Lang) {
  SecureStore.setItemAsync(PREFS_KEY, JSON.stringify({ theme, language })).catch(() => {});
}

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
  loadPrefs: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  colors: colors.light,
  toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
  setTheme: (theme) => {
    set({ theme, colors: colors[theme] });
    savePrefs(theme, get().language);
  },
  language: (i18n.language as Lang) || 'en',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
    savePrefs(get().theme, lang);
  },
  loadPrefs: async () => {
    try {
      const raw = await SecureStore.getItemAsync(PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { theme?: ThemeMode; language?: Lang };
      if (p.theme === 'light' || p.theme === 'dark') set({ theme: p.theme, colors: colors[p.theme] });
      if (p.language && ['en', 'hi', 'or'].includes(p.language)) {
        i18n.changeLanguage(p.language);
        set({ language: p.language });
      }
    } catch {
      // keep defaults
    }
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

