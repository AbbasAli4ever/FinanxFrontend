export type ImportEntityType = "customers" | "vendors" | "products" | "accounts";

export type ExportEntityType =
  | "customers"
  | "vendors"
  | "products"
  | "accounts"
  | "invoices"
  | "bills"
  | "expenses"
  | "journal-entries";

export const TRANSACTIONAL_EXPORT_ENTITIES: ExportEntityType[] = [
  "invoices",
  "bills",
  "expenses",
  "journal-entries",
];

export type ImportJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";

export type DuplicateStrategy = "skip" | "update" | "fail";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface SupportedEntityField {
  csvHeader: string;
  type: string;
  required: boolean;
  example?: string;
}

export interface SupportedEntity {
  entityType: string;
  importable: boolean;
  exportable: boolean;
  fields: SupportedEntityField[];
}

export interface TemplateResponse {
  csv: string;
  fileName: string;
  fields: SupportedEntityField[];
}

export interface ValidationError {
  row: number;
  message: string;
}

export interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
}

export interface ImportJobUser {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ImportJobListItem {
  id: string;
  entityType: string;
  fileName: string;
  status: ImportJobStatus;
  duplicateStrategy: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[] | null;
  createdAt: string;
  completedAt: string | null;
  user: ImportJobUser;
}

export interface ImportJobListResponse {
  items: ImportJobListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ImportHistoryFilters {
  entityType?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface ExportResult {
  csv: string;
  fileName: string;
  rowCount: number;
}

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}
