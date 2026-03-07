// ─── Shared ───────────────────────────────────────────────────────────────────

export type PeriodPreset =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export interface PeriodParams {
  period?: PeriodPreset;
  startDate?: string; // YYYY-MM-DD — only for "custom"
  endDate?: string;
}

export type ChangeDirection = "up" | "down" | "flat" | "new";

export interface PeriodValue {
  current: number;
  previous: number;
  changeAmount: number;
  changePercent: number | null;
  changeDirection: ChangeDirection;
}

export interface DateRange {
  start: string;
  end: string;
}

// ─── 1. Financial Overview ────────────────────────────────────────────────────

export interface FinancialOverview {
  period: DateRange;
  revenue: PeriodValue;
  expenses: PeriodValue;
  netIncome: PeriodValue;
  cashBalance: number;
  totalAR: number;
  totalAP: number;
}

// ─── 2. Revenue & Expense Trend ───────────────────────────────────────────────

export interface MonthData {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
}

export interface RevenueTrend {
  months: MonthData[];
}

// ─── 3. Invoice Analytics ─────────────────────────────────────────────────────

export interface InvoiceStatusItem {
  status: string;
  count: number;
  totalAmount: number;
}

export interface InvoiceAnalytics {
  period: DateRange;
  statusBreakdown: InvoiceStatusItem[];
  overdueCount: number;
  overdueAmount: number;
  collectionRate: number;
  totalInvoiced: number;
  totalCollected: number;
}

// ─── 4. Bill Analytics ────────────────────────────────────────────────────────

export interface BillStatusItem {
  status: string;
  count: number;
  totalAmount: number;
}

export interface BillAnalytics {
  period: DateRange;
  statusBreakdown: BillStatusItem[];
  overdueCount: number;
  overdueAmount: number;
  paymentRate: number;
  totalBilled: number;
  totalPaid: number;
}

// ─── 5. Top Customers ─────────────────────────────────────────────────────────

export interface TopCustomer {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface TopCustomersData {
  period: DateRange;
  customers: TopCustomer[];
}

// ─── 6. Top Vendors ───────────────────────────────────────────────────────────

export interface TopVendor {
  vendorId: string;
  vendorName: string;
  billCount: number;
  totalSpend: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface TopVendorsData {
  period: DateRange;
  vendors: TopVendor[];
}

// ─── 7. Cash Flow Overview ────────────────────────────────────────────────────

export interface BankAccount {
  accountId: string;
  name: string;
  institution: string | null;
  last4: string | null;
  currentBalance: number;
}

export interface DailyFlowEntry {
  date: string;
  inflow: number;
  outflow: number;
}

export interface CashFlowOverview {
  bankAccounts: BankAccount[];
  totalCashBalance: number;
  last30Days: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
  };
  dailyFlow: DailyFlowEntry[];
}

// ─── 8. Expense Breakdown ─────────────────────────────────────────────────────

export interface ExpenseCategory {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseMonthEntry {
  month: string;
  label: string;
  amount: number;
}

export interface ExpenseBreakdown {
  period: DateRange;
  byCategory: ExpenseCategory[];
  totalExpenses: number;
  monthlyTrend: ExpenseMonthEntry[];
}

// ─── 9. Inventory Stats ───────────────────────────────────────────────────────

export interface InventorySummary {
  totalTrackedProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
}

export interface LowStockAlert {
  productId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  reorderPoint: number;
  category: string;
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  sku: string;
  quantityFulfilled: number;
  totalRevenue: number;
}

export interface InventoryStats {
  summary: InventorySummary;
  lowStockAlerts: LowStockAlert[];
  topSellingProducts: TopSellingProduct[];
}

// ─── 10. Project Overview ─────────────────────────────────────────────────────

export interface ProjectOverviewSummary {
  totalProjects: number;
  ACTIVE: number;
  ON_HOLD: number;
  COMPLETED: number;
  CANCELLED: number;
  totalBillableHours: number;
  totalBillableRevenue: number;
}

export interface ProjectOverviewItem {
  projectId: string;
  projectNumber: string;
  name: string;
  status: string;
  billingMethod: string;
  customer: { id: string; displayName: string } | null;
  budgetAmount: number | null;
  budgetHours: number | null;
  hoursLogged: number;
  hoursBurnPercent: number;
  invoicedRevenue: number;
  expensesIncurred: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ProjectOverview {
  summary: ProjectOverviewSummary;
  projects: ProjectOverviewItem[];
}

// ─── 11. Recent Activity ──────────────────────────────────────────────────────

export type ActivityType = "INVOICE" | "BILL" | "EXPENSE" | "JOURNAL_ENTRY" | "PAYMENT";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  label: string;
  description: string;
  status: string;
  amount: number;
  occurredAt: string;
}

export interface RecentActivity {
  activities: ActivityItem[];
}

// ─── 12. Period Comparison ────────────────────────────────────────────────────

export interface ComparisonMetric {
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
  changeAmount: number;
  changePercent: number | null;
  changeDirection: ChangeDirection;
}

export interface PeriodComparison {
  current: DateRange;
  previous: DateRange;
  metrics: ComparisonMetric[];
}
