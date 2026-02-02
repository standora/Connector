import { create } from 'zustand';
import { Partner } from '@/types/partner';

interface PartnerState {
  partners: Partner[];
  addPartner: (p: Partner) => void;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  partners: [],
  addPartner: (p) => set((s) => ({ partners: [p, ...s.partners] })),
}));
