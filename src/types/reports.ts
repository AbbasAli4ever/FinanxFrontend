// ============================================================
// QUERY PARAMS
// ============================================================
export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  asOfDate?: string;
}

// ============================================================
// CASH FLOW STATEMENT
// ============================================================
export interface CashFlowItem {
  name: string;
  accountType: string;
  amount: number;
}

export interface CashFlowStatement {
  period: { startDate: string; endDate: string };
  operating: {
    netIncome: number;
    adjustments: CashFlowItem[];
    totalAdjustments: number;
    totalOperating: number;
  };
  investing: {
    items: CashFlowItem[];
    totalInvesting: number;
  };
  financing: {
    items: CashFlowItem[];
    totalFinancing: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

// ============================================================
// AGING BUCKETS (shared)
// ============================================================
export interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91plus: number;
  total: number;
}

// ============================================================
// AR AGING
// ============================================================
export interface AgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  amountDue: number;
  daysOverdue: number;
  bucket: 'current' | 'days1to30' | 'days31to60' | 'days61to90' | 'days91plus';
}

export interface ArAgingCustomer extends AgingBuckets {
  customerId: string;
  customerName: string;
  invoices: AgingInvoice[];
}

export interface ArAgingReport {
  asOfDate: string;
  customers: ArAgingCustomer[];
  totals: AgingBuckets;
}

// ============================================================
// AP AGING
// ============================================================
export interface AgingBill {
  billId: string;
  billNumber: string;
  billDate: string;
  dueDate: string | null;
  totalAmount: number;
  amountDue: number;
  daysOverdue: number;
  bucket: 'current' | 'days1to30' | 'days31to60' | 'days61to90' | 'days91plus';
}

export interface ApAgingVendor extends AgingBuckets {
  vendorId: string;
  vendorName: string;
  bills: AgingBill[];
}

export interface ApAgingReport {
  asOfDate: string;
  vendors: ApAgingVendor[];
  totals: AgingBuckets;
}

// ============================================================
// SALES BY CUSTOMER
// ============================================================
export interface SalesCustomer {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface SalesByCustomerReport {
  period: { startDate: string | null; endDate: string | null };
  customers: SalesCustomer[];
  totals: {
    invoiceCount: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

// ============================================================
// PURCHASES BY VENDOR
// ============================================================
export interface PurchasesVendor {
  vendorId: string;
  vendorName: string;
  billCount: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface PurchasesByVendorReport {
  period: { startDate: string | null; endDate: string | null };
  vendors: PurchasesVendor[];
  totals: {
    billCount: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

// ============================================================
// EXPENSE BY CATEGORY
// ============================================================
export interface ExpenseCategory {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  amount: number;
  percentage: number;
}

export interface ExpenseByCategoryReport {
  period: { startDate: string | null; endDate: string | null };
  categories: ExpenseCategory[];
  total: number;
}

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
