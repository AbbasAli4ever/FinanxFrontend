export type JournalEntryStatus = "DRAFT" | "POSTED" | "VOID";

export type JournalEntryType =
  | "STANDARD"
  | "ADJUSTING"
  | "CLOSING"
  | "REVERSING"
  | "RECURRING";

export type RecurringFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface JournalEntryStatusInfo {
  key: string;
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowPost: boolean;
  allowVoid: boolean;
  allowReverse: boolean;
  allowDuplicate: boolean;
}

export interface JournalEntryLine {
  id: string;
  account: {
    id: string;
    name: string;
    accountNumber: string | null;
    accountType: string;
    normalBalance: string;
  };
  debit: number;
  credit: number;
  description: string | null;
  contactType: string | null;
  contactId: string | null;
  sortOrder: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  referenceNumber: string | null;
  description: string | null;
  notes: string | null;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  entryDate: string;

  totalDebit: number;
  totalCredit: number;

  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  nextRecurringDate: string | null;
  recurringEndDate: string | null;

  isAutoReversing: boolean;
  reversalDate: string | null;

  reversedFrom: { id: string; entryNumber: string } | null;

  sourceType: string | null;
  sourceId: string | null;

  postedAt: string | null;
  postedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  voidedAt: string | null;
  voidReason: string | null;

  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  lines: JournalEntryLine[];

  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryListItem {
  id: string;
  entryNumber: string;
  referenceNumber: string | null;
  description: string | null;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  entryDate: string;
  totalDebit: number;
  totalCredit: number;
  isRecurring: boolean;
  isAutoReversing: boolean;
  lineCount: number;
  createdAt: string;
}

export interface JournalEntrySummary {
  draft: { count: number };
  posted: { count: number; totalDebit: number };
  voided: { count: number };
  totalEntries: number;
}

export interface JournalEntryFilters {
  status: string;
  entryType: string;
  accountId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface CreateJournalEntryLineRequest {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
  contactType?: "CUSTOMER" | "VENDOR";
  contactId?: string;
  sortOrder?: number;
}

export interface CreateJournalEntryRequest {
  entryDate: string;
  lines: CreateJournalEntryLineRequest[];
  entryNumber?: string;
  description?: string;
  referenceNumber?: string;
  notes?: string;
  entryType?: JournalEntryType;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  isAutoReversing?: boolean;
  reversalDate?: string;
  sourceType?: string;
  sourceId?: string;
}

export interface UpdateJournalEntryRequest {
  entryDate?: string;
  lines?: CreateJournalEntryLineRequest[];
  entryNumber?: string;
  description?: string;
  referenceNumber?: string;
  notes?: string;
  entryType?: JournalEntryType;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  isAutoReversing?: boolean;
  reversalDate?: string;
}

export interface VoidJournalEntryRequest {
  reason?: string;
}
