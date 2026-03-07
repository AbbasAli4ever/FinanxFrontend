// ============================================================
// SHARED
// ============================================================
export type RecurringType = "invoice" | "bill" | "expense" | "journal-entry";
export type RecurringFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface RecurringFields {
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  nextRecurringDate: string | null; // ISO date
  recurringEndDate: string | null; // ISO date
}

// ============================================================
// UPCOMING ITEMS (per document type)
// ============================================================
export interface UpcomingInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  nextRecurringDate: string;
  recurringFrequency: RecurringFrequency;
  recurringEndDate: string | null;
  invoiceDate: string;
  customer: { id: string; displayName: string };
  type: "invoice";
  status?: string;
}

export interface UpcomingBill {
  id: string;
  billNumber: string;
  totalAmount: number;
  nextRecurringDate: string;
  recurringFrequency: RecurringFrequency;
  recurringEndDate: string | null;
  billDate: string;
  vendor: { id: string; displayName: string };
  type: "bill";
  status?: string;
}

export interface UpcomingExpense {
  id: string;
  expenseNumber: string;
  totalAmount: number;
  nextRecurringDate: string;
  recurringFrequency: RecurringFrequency;
  recurringEndDate: string | null;
  expenseDate: string;
  vendor: { id: string; displayName: string } | null;
  type: "expense";
  status?: string;
}

export interface UpcomingJournalEntry {
  id: string;
  entryNumber: string;
  totalDebit: number;
  nextRecurringDate: string;
  recurringFrequency: RecurringFrequency;
  recurringEndDate: string | null;
  entryDate: string;
  description: string | null;
  type: "journal-entry";
  status?: string;
}

// Union type for generic rendering
export type AnyUpcomingItem =
  | UpcomingInvoice
  | UpcomingBill
  | UpcomingExpense
  | UpcomingJournalEntry;

// ============================================================
// UPCOMING RESPONSE
// ============================================================
export interface UpcomingResponse {
  invoices?: UpcomingInvoice[];
  bills?: UpcomingBill[];
  expenses?: UpcomingExpense[];
  journalEntries?: UpcomingJournalEntry[];
}

// ============================================================
// TEMPLATES RESPONSE
// ============================================================
export interface TemplatesResponse {
  invoices: (UpcomingInvoice & { status: string })[];
  bills: (UpcomingBill & { status: string })[];
  expenses: (UpcomingExpense & { status: string })[];
  journalEntries: (UpcomingJournalEntry & { status: string })[];
}

// ============================================================
// PROCESS RESULT
// ============================================================
export interface ProcessResult {
  totalProcessed: number;
  invoicesProcessed: number;
  billsProcessed: number;
  expensesProcessed: number;
}

// ============================================================
// UPDATE SETTINGS REQUEST
// ============================================================
export interface UpdateRecurringSettingsRequest {
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null; // YYYY-MM-DD or null to clear
}

// ============================================================
// RESUME RESULT
// ============================================================
export interface ResumeResult {
  message: string;
  nextRecurringDate?: string;
}
