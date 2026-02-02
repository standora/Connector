export interface AuditRecord { id: string; message: string; createdAt: string; }
export interface AuditWarning { id: string; severity: 'low' | 'medium' | 'high'; message: string; createdAt: string; }
