export type AuditEntityType =
  | "INVOICE"
  | "BILL"
  | "EXPENSE"
  | "JOURNAL_ENTRY"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "ESTIMATE"
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "ACCOUNT"
  | "CUSTOMER"
  | "VENDOR"
  | "PRODUCT"
  | "BANK_ACCOUNT"
  | "BANK_TRANSACTION"
  | "BANK_RECONCILIATION"
  | "USER"
  | "ROLE"
  | "CATEGORY"
  | "COMPANY";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SEND"
  | "VOID"
  | "RECEIVE"
  | "FULFILL"
  | "CONVERT"
  | "PAY"
  | "APPROVE"
  | "REJECT"
  | "CLOSE"
  | "POST"
  | "REVERSE"
  | "DUPLICATE"
  | "OPEN"
  | "APPLY"
  | "REFUND"
  | "ADJUST"
  | "TRANSFER"
  | "MATCH"
  | "RECONCILE"
  | "PAUSE"
  | "RESUME"
  | "CONFIRM"
  | "EXPIRE"
  | "IMPORT"
  | "INVITE"
  | "DEACTIVATE";

export interface AuditUser {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogItem {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string | null;
  action: AuditAction;
  description: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  metadata: Record<string, unknown> | null;
  performedAt: string;
  user: AuditUser;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  pagination: AuditLogPagination;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  entityType?: AuditEntityType | "";
  entityId?: string;
  userId?: string;
  action?: AuditAction | "";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Entity history item (endpoint 2 — no pagination wrapper)
export interface EntityAuditLogItem {
  id?: string;
  action: AuditAction;
  description: string | null;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  metadata: Record<string, unknown> | null;
  performedAt: string;
  user: AuditUser;
}
