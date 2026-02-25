// ============================================================
// SHARED
// ============================================================
export interface AccountSummary {
  id: string;
  accountNumber: string | null;
  name: string;
  accountType: string;
  normalBalance: "DEBIT" | "CREDIT";
}

// ============================================================
// TRIAL BALANCE
// ============================================================
export interface TrialBalanceAccount extends AccountSummary {
  balance: number;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceResponse {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  grouped: Record<string, TrialBalanceAccount[]>;
  totals: {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  };
}

// ============================================================
// ACCOUNT LEDGER
// ============================================================
export interface LedgerLine {
  date: string;
  entryId: string;
  entryNumber: string;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountLedgerResponse {
  account: AccountSummary;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  openingBalance: number;
  lines: LedgerLine[];
  closingBalance: number;
}

// ============================================================
// INCOME STATEMENT (P&L)
// ============================================================
export interface IncomeStatementAccount extends AccountSummary {
  amount: number;
}

export interface IncomeStatementResponse {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  revenue: {
    accounts: IncomeStatementAccount[];
    total: number;
  };
  costOfGoodsSold: {
    accounts: IncomeStatementAccount[];
    total: number;
  };
  grossProfit: number;
  expenses: {
    accounts: IncomeStatementAccount[];
    total: number;
  };
  netIncome: number;
}

// ============================================================
// BALANCE SHEET
// ============================================================
export interface BalanceSheetAccount extends AccountSummary {
  balance: number;
}

export interface BalanceSheetResponse {
  asOfDate: string;
  assets: {
    accounts: BalanceSheetAccount[];
    total: number;
  };
  liabilities: {
    accounts: BalanceSheetAccount[];
    total: number;
  };
  equity: {
    accounts: BalanceSheetAccount[];
    total: number;
    netIncome: number;
    totalIncludingNetIncome: number;
  };
  totals: {
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
  };
}
