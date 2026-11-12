import { create } from 'zustand';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ThemeMode, colors, ThemeColors } from '../theme/colors';
import i18n from '../lib/i18n';
import { useToastStore, ToastMessage } from './toastStore';

const PREFS_KEY = 'industrialink_ui_prefs';
type Lang = 'en' | 'hi' | 'or';
/** What the user picked. "system" follows the phone; light is the default, like the web. */
export type ThemePref = 'light' | 'dark' | 'system';

const resolve = (pref: ThemePref): ThemeMode =>
  pref === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : pref;

function savePrefs(themePref: ThemePref, language: Lang) {
  SecureStore.setItemAsync(PREFS_KEY, JSON.stringify({ theme: themePref, language })).catch(() => {});
}

interface UiState {
  /** The theme in use right now (light or dark). */
  theme: ThemeMode;
  themePref: ThemePref;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setThemePref: (pref: ThemePref) => void;
  language: Lang;
  setLanguage: (lang: Lang) => void;
  loadPrefs: () => Promise<void>;
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

let appearanceListening = false;

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  themePref: 'light',
  colors: colors.light,
  toggleTheme: () => get().setThemePref(get().theme === 'light' ? 'dark' : 'light'),
  setTheme: (theme) => get().setThemePref(theme),
  setThemePref: (themePref) => {
    const theme = resolve(themePref);
    set({ themePref, theme, colors: colors[theme] });
    savePrefs(themePref, get().language);
  },
  language: (i18n.language as Lang) || 'en',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
    savePrefs(get().themePref, lang);
  },
  loadPrefs: async () => {
    if (!appearanceListening) {
      appearanceListening = true;
      Appearance.addChangeListener(() => {
        if (get().themePref !== 'system') return;
        const theme = resolve('system');
        set({ theme, colors: colors[theme] });
      });
    }
    try {
      const raw = await SecureStore.getItemAsync(PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { theme?: ThemePref; language?: Lang };
      if (p.theme === 'light' || p.theme === 'dark' || p.theme === 'system') {
        const theme = resolve(p.theme);
        set({ themePref: p.theme, theme, colors: colors[theme] });
      }
      if (p.language && ['en', 'hi', 'or'].includes(p.language)) {
        i18n.changeLanguage(p.language);
        set({ language: p.language });
      }
    } catch {
      // keep defaults
    }
  },
  showToast: (message, type = 'info') => useToastStore.getState().show(message, type),
}));
