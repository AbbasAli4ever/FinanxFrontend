// ─── Entity Types ──────────────────────────────────────────────────────────────

export type AttachmentEntityType =
  | "INVOICE"
  | "BILL"
  | "EXPENSE"
  | "JOURNAL_ENTRY"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "ESTIMATE"
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "CUSTOMER"
  | "VENDOR"
  | "PRODUCT"
  | "PROJECT"
  | "EMPLOYEE"
  | "PAY_RUN"
  | "BANK_TRANSACTION";

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  companyId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number; // bytes
  filePath: string;
  description: string | null;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentListResponse {
  data: Attachment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  usedPercentage: number;
  fileCount: number;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface AttachmentFilters {
  entityType?: AttachmentEntityType;
  entityId?: string;
  page?: number;
  limit?: number;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadAttachmentParams {
  file: File;
  entityType: AttachmentEntityType;
  entityId: string;
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const ENTITY_TYPE_LABELS: Record<AttachmentEntityType, string> = {
  INVOICE: "Invoice",
  BILL: "Bill",
  EXPENSE: "Expense",
  JOURNAL_ENTRY: "Journal Entry",
  CREDIT_NOTE: "Credit Note",
  DEBIT_NOTE: "Debit Note",
  ESTIMATE: "Estimate",
  PURCHASE_ORDER: "Purchase Order",
  SALES_ORDER: "Sales Order",
  CUSTOMER: "Customer",
  VENDOR: "Vendor",
  PRODUCT: "Product",
  PROJECT: "Project",
  EMPLOYEE: "Employee",
  PAY_RUN: "Pay Run",
  BANK_TRANSACTION: "Bank Transaction",
};

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
