import { create } from 'zustand';
import { Domain } from '@/types/domain';

interface DomainState {
  domains: Domain[];
  addDomain: (d: Domain) => void;
  updateDomain: (d: Domain) => void;
  deleteDomain: (id: string) => void;
}

export const useDomainStore = create<DomainState>((set) => ({
  domains: [],
  addDomain: (d) => set((s) => ({ domains: [d, ...s.domains] })),
  updateDomain: (d) => set((s) => ({ domains: s.domains.map((x) => x.id === d.id ? d : x) })),
  deleteDomain: (id) => set((s) => ({ domains: s.domains.filter((x) => x.id !== id) })),
}));
