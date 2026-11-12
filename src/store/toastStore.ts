import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface ToastState {
  toasts: ToastMessage[];
  show: (message: string, type?: ToastMessage['type']) => void;
  dismiss: (id: string) => void;
}

let seq = 0;

/** Kept apart from the theme store so a toast only re-renders the toast layer, not every screen. */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = `${Date.now()}-${seq++}`;
    // At most 2 on screen; the newest replaces the oldest.
    set((s) => ({ toasts: [...s.toasts.slice(-1), { id, type, message }] }));
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
