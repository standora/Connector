import { create } from 'zustand';
import { AuditRecord, AuditWarning } from '@/types/audit';

interface AuditState {
  auditLogs: AuditRecord[];
  notifications: AuditWarning[];
  appendAudit: (r: AuditRecord) => void;
  appendNotification: (n: AuditWarning) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  auditLogs: [],
  notifications: [],
  appendAudit: (r) => set((s) => ({ auditLogs: [r, ...s.auditLogs] })),
  appendNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
}));
