import { create } from 'zustand';

interface UdfState { udfChanged: boolean; setUdfChanged: (v: boolean) => void; }

export const useUdfStore = create<UdfState>((set) => ({
  udfChanged: false,
  setUdfChanged: (v) => set({ udfChanged: v }),
}));
