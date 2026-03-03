export type BankTransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "FEE"
  | "INTEREST"
  | "CHECK"
  | "OTHER";

export type BankTransactionStatus = "UNMATCHED" | "MATCHED" | "EXCLUDED";

export type ReconciliationStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  detailType: string;
  currentBalance: number;
  institutionName: string | null;
  routingNumber: string | null;
  accountNumberLast4: string | null;
  openingBalance: number;
  openingDate: string | null;
  isSystemAccount: boolean;
}

export interface BankAccountDetail extends BankAccount {
  detail: {
    institutionName: string | null;
    routingNumber: string | null;
    accountNumberLast4: string | null;
    openingBalance: number;
    openingDate: string | null;
  };
  recentTransactions: BankTransaction[];
  unmatchedCount: number;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: BankTransactionType;
  checkNumber: string | null;
  referenceNumber: string | null;
  status: BankTransactionStatus;
  matchedJournalEntry: {
    id: string;
    entryNumber: string;
    description: string;
  } | null;
  reconciled: boolean;
  reconciledAt: string | null;
  importBatch: string | null;
  createdAt: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  status?: BankTransactionStatus | "";
  type?: BankTransactionType | "";
  search?: string;
  page?: string;
  limit?: string;
}

export interface UpsertBankDetailRequest {
  institutionName?: string;
  routingNumber?: string;
  accountNumberLast4?: string;
  openingBalance?: number;
  openingDate?: string;
}

export interface CreateTransactionRequest {
  date: string;
  description: string;
  amount: number;
  type?: BankTransactionType;
  checkNumber?: string;
  referenceNumber?: string;
}

export interface ImportTransactionItem {
  date: string;
  description: string;
  amount: number;
  type?: BankTransactionType;
}

export interface ImportResult {
  imported: number;
  importBatch: string;
}

export interface MatchRequest {
  journalEntryId: string;
}

export interface StartReconciliationRequest {
  statementDate: string;
  statementBalance: number;
}

export interface CompleteReconciliationRequest {
  clearedTransactionIds: string[];
}

export interface BankReconciliation {
  id: string;
  bankAccount: {
    id: string;
    name: string;
    accountNumber: string;
    systemBalance: number;
  };
  statementDate: string;
  statementBalance: number;
  openingBalance: number;
  clearedBalance: number;
  difference: number;
  status: ReconciliationStatus;
  reconciledBy: { id: string; firstName: string; lastName: string } | null;
  completedAt: string | null;
  unreconciledTransactions: BankTransaction[];
  clearedTransactions: BankTransaction[];
}

export interface TransferRequest {
  destinationAccountId: string;
  amount: number;
  date: string;
  description?: string;
  referenceNumber?: string;
}

export interface TransferResult {
  sourceAccount: { id: string; name: string; newBalance: number };
  destinationAccount: { id: string; name: string; newBalance: number };
  amount: number;
  date: string;
  description: string;
}

export interface PaginatedTransactions {
  items: BankTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
