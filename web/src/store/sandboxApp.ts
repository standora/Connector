import { create } from 'zustand';
import { SandboxApp } from '@/types/sandboxApp';

interface SandboxAppState {
  apps: SandboxApp[];
  addApp: (a: SandboxApp) => void;
}

export const useSandboxAppStore = create<SandboxAppState>((set) => ({
  apps: [],
  addApp: (a) => set((s) => ({ apps: [a, ...s.apps] })),
}));
