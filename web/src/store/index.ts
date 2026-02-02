import { create } from 'zustand';

interface AppState {
  collapsed: boolean;
  perspective: 'admin' | 'provider' | 'consumer';
  toggleCollapsed: () => void;
  setPerspective: (p: 'admin' | 'provider' | 'consumer') => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  perspective: 'admin',
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setPerspective: (p) => set({ perspective: p }),
}));
