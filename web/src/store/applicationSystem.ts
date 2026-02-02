import { create } from 'zustand';
import { ApplicationSystem } from '@/types/applicationSystem';

interface AppSystemState {
  systems: ApplicationSystem[];
  addSystem: (sys: ApplicationSystem) => void;
}

export const useApplicationSystemStore = create<AppSystemState>((set) => ({
  systems: [],
  addSystem: (sys) => set((s) => ({ systems: [sys, ...s.systems] })),
}));
