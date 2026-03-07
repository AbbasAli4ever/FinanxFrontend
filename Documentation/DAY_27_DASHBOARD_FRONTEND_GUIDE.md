# Day 27 — Dashboard & Analytics Frontend Integration Guide

Base URL: `{{API_URL}}/api/v1`

All endpoints require `Authorization: Bearer <token>` header.
All endpoints require `dashboard:view` permission.

---

## 1. Financial Overview (KPI Cards)

```
GET /dashboard/financial-overview
GET /dashboard/financial-overview?period=this_quarter
GET /dashboard/financial-overview?period=custom&startDate=2026-01-01&endDate=2026-03-05
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-03-01", "end": "2026-03-05" },
    "revenue": {
      "current": 125000,
      "previous": 98000,
      "changeAmount": 27000,
      "changePercent": 27.55,
      "changeDirection": "up"
    },
    "expenses": {
      "current": 42000,
      "previous": 38500,
      "changeAmount": 3500,
      "changePercent": 9.09,
      "changeDirection": "up"
    },
    "netIncome": {
      "current": 83000,
      "previous": 59500,
      "changeAmount": 23500,
      "changePercent": 39.50,
      "changeDirection": "up"
    },
    "cashBalance": 215000,
    "totalAR": 47000,
    "totalAP": 18500
  }
}
```

**Change direction values:** `"up"`, `"down"`, `"flat"`, `"new"` (when previous was 0)
**changePercent:** `null` when previous was 0 (avoid displaying ∞%)

---

## 2. Revenue & Expense Trend (Line Chart)

```
GET /dashboard/revenue-expense-trend
GET /dashboard/revenue-expense-trend?period=this_year
```

Returns 12 months of data regardless of period (always rolling 12 months from end date).

**Response:**
```json
{
  "success": true,
  "data": {
    "months": [
      { "month": "2025-04", "label": "Apr 2025", "revenue": 82000, "expenses": 31000 },
      { "month": "2025-05", "label": "May 2025", "revenue": 91000, "expenses": 34000 },
      { "month": "2025-06", "label": "Jun 2025", "revenue": 78000, "expenses": 29000 },
      { "month": "2025-07", "label": "Jul 2025", "revenue": 95000, "expenses": 36000 },
      { "month": "2025-08", "label": "Aug 2025", "revenue": 88000, "expenses": 33000 },
      { "month": "2025-09", "label": "Sep 2025", "revenue": 102000, "expenses": 38000 },
      { "month": "2025-10", "label": "Oct 2025", "revenue": 97000, "expenses": 35000 },
      { "month": "2025-11", "label": "Nov 2025", "revenue": 110000, "expenses": 40000 },
      { "month": "2025-12", "label": "Dec 2025", "revenue": 115000, "expenses": 42000 },
      { "month": "2026-01", "label": "Jan 2026", "revenue": 108000, "expenses": 39000 },
      { "month": "2026-02", "label": "Feb 2026", "revenue": 120000, "expenses": 41000 },
      { "month": "2026-03", "label": "Mar 2026", "revenue": 125000, "expenses": 42000 }
    ]
  }
}
```

---

## 3. Invoice Analytics (Donut Chart + Stats)

```
GET /dashboard/invoice-analytics
GET /dashboard/invoice-analytics?period=this_year
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-03-01", "end": "2026-03-05" },
    "statusBreakdown": [
      { "status": "PAID", "count": 42, "totalAmount": 180000 },
      { "status": "SENT", "count": 12, "totalAmount": 35000 },
      { "status": "PARTIALLY_PAID", "count": 3, "totalAmount": 8000 },
      { "status": "OVERDUE", "count": 5, "totalAmount": 12000 },
      { "status": "DRAFT", "count": 7, "totalAmount": 14000 },
      { "status": "VOID", "count": 2, "totalAmount": 3000 }
    ],
    "overdueCount": 5,
    "overdueAmount": 12000,
    "collectionRate": 89.4,
    "totalInvoiced": 252000,
    "totalCollected": 225288
  }
}
```

---

## 4. Bill Analytics (Donut Chart + Stats)

```
GET /dashboard/bill-analytics
GET /dashboard/bill-analytics?period=this_quarter
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-03-01", "end": "2026-03-05" },
    "statusBreakdown": [
      { "status": "PAID", "count": 15, "totalAmount": 65000 },
      { "status": "RECEIVED", "count": 8, "totalAmount": 22000 },
      { "status": "OVERDUE", "count": 3, "totalAmount": 8500 }
    ],
    "overdueCount": 3,
    "overdueAmount": 8500,
    "paymentRate": 76.2,
    "totalBilled": 94000,
    "totalPaid": 71628
  }
}
```

---

## 5. Top Customers (Bar Chart / Table)

```
GET /dashboard/top-customers
GET /dashboard/top-customers?limit=10&period=this_year
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-03-01", "end": "2026-03-05" },
    "customers": [
      {
        "customerId": "uuid",
        "customerName": "Acme Corp",
        "invoiceCount": 8,
        "totalRevenue": 45000,
        "totalPaid": 38000,
        "totalOutstanding": 7000
      },
      {
        "customerId": "uuid",
        "customerName": "TechStart Ltd",
        "invoiceCount": 5,
        "totalRevenue": 32000,
        "totalPaid": 32000,
        "totalOutstanding": 0
      }
    ]
  }
}
```

---

## 6. Top Vendors (Bar Chart / Table)

```
GET /dashboard/top-vendors
GET /dashboard/top-vendors?limit=10&period=this_year
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-03-01", "end": "2026-03-05" },
    "vendors": [
      {
        "vendorId": "uuid",
        "vendorName": "Office Depot",
        "billCount": 5,
        "totalSpend": 22000,
        "totalPaid": 18500,
        "totalOutstanding": 3500
      }
    ]
  }
}
```

---

## 7. Cash Flow Overview (Bank Accounts + Flow Chart)

```
GET /dashboard/cash-flow-overview
```

Period parameter is ignored — always shows current bank balances + last 30 days of transactions.

**Response:**
```json
{
  "success": true,
  "data": {
    "bankAccounts": [
      {
        "accountId": "uuid",
        "name": "Business Checking",
        "institution": "Chase Bank",
        "last4": "4567",
        "currentBalance": 125000
      },
      {
        "accountId": "uuid",
        "name": "Business Savings",
        "institution": null,
        "last4": null,
        "currentBalance": 90000
      }
    ],
    "totalCashBalance": 215000,
    "last30Days": {
      "totalInflow": 48000,
      "totalOutflow": 29500,
      "netCashFlow": 18500
    },
    "dailyFlow": [
      { "date": "2026-02-04", "inflow": 1200, "outflow": 0 },
      { "date": "2026-02-05", "inflow": 0, "outflow": 850 },
      { "date": "2026-02-06", "inflow": 3500, "outflow": 1200 }
    ]
  }
}
```

---

## 8. Expense Breakdown (Pie Chart + Trend)

```
GET /dashboard/expense-breakdown
GET /dashboard/expense-breakdown?period=this_year
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-03-01", "end": "2026-03-05" },
    "byCategory": [
      { "categoryId": "uuid", "categoryName": "Travel", "amount": 8400, "count": 12, "percentage": 20.0 },
      { "categoryId": "uuid", "categoryName": "Office Supplies", "amount": 6300, "count": 18, "percentage": 15.0 },
      { "categoryId": null, "categoryName": "Uncategorized", "amount": 3200, "count": 5, "percentage": 7.6 }
    ],
    "totalExpenses": 42000,
    "monthlyTrend": [
      { "month": "2025-04", "label": "Apr 2025", "amount": 3100 },
      { "month": "2025-05", "label": "May 2025", "amount": 3400 }
    ]
  }
}
```

---

## 9. Inventory Stats (Alerts + Top Sellers)

```
GET /dashboard/inventory-stats
GET /dashboard/inventory-stats?limit=10
```

Period parameter is ignored — always shows current inventory state + last 90 days of sales.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTrackedProducts": 48,
      "lowStockCount": 7,
      "outOfStockCount": 2,
      "totalInventoryValue": 285000
    },
    "lowStockAlerts": [
      {
        "productId": "uuid",
        "name": "Widget A",
        "sku": "WGT-001",
        "quantityOnHand": 3,
        "reorderPoint": 10,
        "category": "Hardware"
      }
    ],
    "topSellingProducts": [
      {
        "productId": "uuid",
        "name": "Premium Service",
        "sku": "SVC-001",
        "quantityFulfilled": 152,
        "totalRevenue": 45600
      }
    ]
  }
}
```

---

## 10. Project Overview (Status Cards + Budget Burn)

```
GET /dashboard/project-overview
```

Period parameter is ignored — always shows all active projects with cumulative metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProjects": 12,
      "ACTIVE": 8,
      "ON_HOLD": 2,
      "COMPLETED": 2,
      "CANCELLED": 0,
      "totalBillableHours": 342.5,
      "totalBillableRevenue": 51375
    },
    "projects": [
      {
        "projectId": "uuid",
        "projectNumber": "PRJ-0001",
        "name": "Website Redesign",
        "status": "ACTIVE",
        "billingMethod": "TIME_AND_MATERIALS",
        "customer": { "id": "uuid", "displayName": "Acme Corp" },
        "budgetAmount": 50000,
        "budgetHours": 200,
        "hoursLogged": 142.5,
        "hoursBurnPercent": 71.25,
        "invoicedRevenue": 35000,
        "expensesIncurred": 4200,
        "startDate": "2026-01-15",
        "endDate": "2026-04-30"
      }
    ]
  }
}
```

---

## 11. Recent Activity (Activity Feed)

```
GET /dashboard/recent-activity
GET /dashboard/recent-activity?limit=20
```

Period parameter is ignored — always returns latest N records across all models.

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "type": "INVOICE",
        "label": "INV-0042",
        "description": "Invoice to Acme Corp",
        "status": "SENT",
        "amount": 5000,
        "occurredAt": "2026-03-05T10:32:00Z"
      },
      {
        "id": "uuid",
        "type": "PAYMENT",
        "label": "INV-0038",
        "description": "Payment from TechStart Ltd",
        "status": "RECEIVED",
        "amount": 12000,
        "occurredAt": "2026-03-05T09:15:00Z"
      },
      {
        "id": "uuid",
        "type": "EXPENSE",
        "label": "EXP-0015",
        "description": "Expense — Travel",
        "status": "APPROVED",
        "amount": 850,
        "occurredAt": "2026-03-04T16:45:00Z"
      },
      {
        "id": "uuid",
        "type": "BILL",
        "label": "BILL-0012",
        "description": "Bill from Office Depot",
        "status": "RECEIVED",
        "amount": 2200,
        "occurredAt": "2026-03-04T14:20:00Z"
      },
      {
        "id": "uuid",
        "type": "JOURNAL_ENTRY",
        "label": "JE-0028",
        "description": "Month-end closing entry",
        "status": "POSTED",
        "amount": 15000,
        "occurredAt": "2026-03-04T11:00:00Z"
      }
    ]
  }
}
```

**Activity types:** `INVOICE`, `BILL`, `EXPENSE`, `JOURNAL_ENTRY`, `PAYMENT`

---

## 12. Period Comparison (Comparison Cards)

```
GET /dashboard/period-comparison
GET /dashboard/period-comparison?period=this_quarter
GET /dashboard/period-comparison?period=custom&startDate=2026-01-01&endDate=2026-03-05
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": { "start": "2026-03-01", "end": "2026-03-05" },
    "previous": { "start": "2026-02-24", "end": "2026-02-28" },
    "metrics": [
      { "key": "revenue", "label": "Revenue", "currentValue": 125000, "previousValue": 98000, "changeAmount": 27000, "changePercent": 27.55, "changeDirection": "up" },
      { "key": "expenses", "label": "Expenses", "currentValue": 42000, "previousValue": 38500, "changeAmount": 3500, "changePercent": 9.09, "changeDirection": "up" },
      { "key": "netIncome", "label": "Net Income", "currentValue": 83000, "previousValue": 59500, "changeAmount": 23500, "changePercent": 39.50, "changeDirection": "up" },
      { "key": "invoicesSent", "label": "Invoices Sent", "currentValue": 18, "previousValue": 14, "changeAmount": 4, "changePercent": 28.57, "changeDirection": "up" },
      { "key": "billsPaid", "label": "Bills Paid", "currentValue": 9, "previousValue": 11, "changeAmount": -2, "changePercent": -18.18, "changeDirection": "down" },
      { "key": "newCustomers", "label": "New Customers", "currentValue": 4, "previousValue": 2, "changeAmount": 2, "changePercent": 100, "changeDirection": "up" },
      { "key": "newVendors", "label": "New Vendors", "currentValue": 1, "previousValue": 3, "changeAmount": -2, "changePercent": -66.67, "changeDirection": "down" }
    ]
  }
}
```

---

## 13. Permissions Reference

| Permission | Admin | Standard | Limited | Reports Only | Time Only |
|-----------|-------|----------|---------|-------------|-----------|
| `dashboard:view` | Yes | Yes | Yes | Yes | No |

---

## 14. Period Presets Reference

| Value | Start Date | End Date |
|-------|-----------|----------|
| `this_month` | First day of current month | Today |
| `last_month` | First day of last month | Last day of last month |
| `this_quarter` | First day of current quarter | Today |
| `last_quarter` | First day of last quarter | Last day of last quarter |
| `this_year` | Jan 1 of current year | Today |
| `last_year` | Jan 1 of last year | Dec 31 of last year |
| `custom` | `startDate` param | `endDate` param |

---

## 15. Frontend Implementation Suggestions

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│ Period Selector: [This Month ▾] [Custom Range]           │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Revenue  │ Expenses │ Net Inc. │ Cash Bal │ AR / AP      │
│ $125,000 │ $42,000  │ $83,000  │ $215,000 │ $47K / $19K  │
│ ▲ 27.6%  │ ▲ 9.1%   │ ▲ 39.5%  │          │              │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│ Revenue vs Expenses Trend (Line Chart - 12 months)       │
├──────────────────────────┬───────────────────────────────┤
│ Invoice Status (Donut)   │ Bill Status (Donut)           │
│ Collection Rate: 89.4%   │ Payment Rate: 76.2%           │
├──────────────────────────┼───────────────────────────────┤
│ Top Customers (Bar)      │ Top Vendors (Bar)             │
├──────────────────────────┼───────────────────────────────┤
│ Cash Flow (Area Chart)   │ Expense Breakdown (Pie)       │
│ Bank Accounts List       │ Category Percentages          │
├──────────────────────────┼───────────────────────────────┤
│ Project Overview         │ Inventory Alerts              │
│ Active: 8 | Budget burn  │ Low Stock: 7 | Out: 2        │
├──────────────────────────┼───────────────────────────────┤
│ Recent Activity (Feed)   │ Period Comparison (Cards)     │
└──────────────────────────┴───────────────────────────────┘
```

### KPI Card Component

```tsx
interface KPICardProps {
  title: string;
  value: number;
  previousValue: number;
  changePercent: number | null;
  changeDirection: 'up' | 'down' | 'flat' | 'new';
  format: 'currency' | 'number' | 'percent';
}

function KPICard({ title, value, changePercent, changeDirection, format }: KPICardProps) {
  const arrow = changeDirection === 'up' ? '▲' : changeDirection === 'down' ? '▼' : '—';
  const color = changeDirection === 'up' ? 'green' : changeDirection === 'down' ? 'red' : 'gray';
  const formatted = format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString();

  return (
    <div className="kpi-card">
      <span className="kpi-title">{title}</span>
      <span className="kpi-value">{formatted}</span>
      <span style={{ color }}>
        {arrow} {changePercent !== null ? `${Math.abs(changePercent)}%` : 'New'}
      </span>
    </div>
  );
}
```

### Period Selector Component

```tsx
const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];
```

### Activity Feed Item

```tsx
const ACTIVITY_ICONS = {
  INVOICE: '📄',
  BILL: '📋',
  EXPENSE: '💰',
  JOURNAL_ENTRY: '📒',
  PAYMENT: '💳',
};

const ACTIVITY_COLORS = {
  INVOICE: 'blue',
  BILL: 'orange',
  EXPENSE: 'red',
  JOURNAL_ENTRY: 'purple',
  PAYMENT: 'green',
};
```

### Recommended Chart Libraries

- **Line/Area charts** (revenue trend, cash flow): Recharts, Chart.js, or ApexCharts
- **Donut/Pie charts** (invoice status, expense breakdown): Same libraries
- **Bar charts** (top customers/vendors): Same libraries

### Data Fetching Strategy

Call endpoints in parallel on dashboard mount:

```typescript
const dashboardData = await Promise.all([
  api.get('/dashboard/financial-overview', { params: { period } }),
  api.get('/dashboard/revenue-expense-trend', { params: { period } }),
  api.get('/dashboard/invoice-analytics', { params: { period } }),
  api.get('/dashboard/bill-analytics', { params: { period } }),
  api.get('/dashboard/top-customers', { params: { period, limit: 5 } }),
  api.get('/dashboard/top-vendors', { params: { period, limit: 5 } }),
  api.get('/dashboard/cash-flow-overview'),
  api.get('/dashboard/expense-breakdown', { params: { period } }),
  api.get('/dashboard/inventory-stats'),
  api.get('/dashboard/project-overview'),
  api.get('/dashboard/recent-activity', { params: { limit: 10 } }),
  api.get('/dashboard/period-comparison', { params: { period } }),
]);
```

When the period selector changes, re-fetch only period-sensitive endpoints (1-6, 8, 12). Endpoints 7, 9, 10, 11 are period-independent.

---

## 16. TypeScript Interfaces

```typescript
// Period and change types
interface PeriodRange {
  start: string;
  end: string;
}

interface ChangeMetric {
  changeAmount: number;
  changePercent: number | null;
  changeDirection: 'up' | 'down' | 'flat' | 'new';
}

interface PeriodValue extends ChangeMetric {
  current: number;
  previous: number;
}

// 1. Financial Overview
interface FinancialOverview {
  period: PeriodRange;
  revenue: PeriodValue;
  expenses: PeriodValue;
  netIncome: PeriodValue;
  cashBalance: number;
  totalAR: number;
  totalAP: number;
}

// 2. Revenue Expense Trend
interface MonthData {
  month: string;    // "2026-03"
  label: string;    // "Mar 2026"
  revenue: number;
  expenses: number;
}

interface RevenueExpenseTrend {
  months: MonthData[];
}

// 3/4. Invoice/Bill Analytics
interface StatusBreakdownItem {
  status: string;
  count: number;
  totalAmount: number;
}

interface InvoiceAnalytics {
  period: PeriodRange;
  statusBreakdown: StatusBreakdownItem[];
  overdueCount: number;
  overdueAmount: number;
  collectionRate: number;
  totalInvoiced: number;
  totalCollected: number;
}

interface BillAnalytics {
  period: PeriodRange;
  statusBreakdown: StatusBreakdownItem[];
  overdueCount: number;
  overdueAmount: number;
  paymentRate: number;
  totalBilled: number;
  totalPaid: number;
}

// 5/6. Top Customers/Vendors
interface TopCustomer {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
}

interface TopVendor {
  vendorId: string;
  vendorName: string;
  billCount: number;
  totalSpend: number;
  totalPaid: number;
  totalOutstanding: number;
}

// 7. Cash Flow Overview
interface BankAccountInfo {
  accountId: string;
  name: string;
  institution: string | null;
  last4: string | null;
  currentBalance: number;
}

interface DailyFlow {
  date: string;
  inflow: number;
  outflow: number;
}

interface CashFlowOverview {
  bankAccounts: BankAccountInfo[];
  totalCashBalance: number;
  last30Days: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
  };
  dailyFlow: DailyFlow[];
}

// 8. Expense Breakdown
interface CategoryExpense {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

interface MonthlyExpense {
  month: string;
  label: string;
  amount: number;
}

interface ExpenseBreakdown {
  period: PeriodRange;
  byCategory: CategoryExpense[];
  totalExpenses: number;
  monthlyTrend: MonthlyExpense[];
}

// 9. Inventory Stats
interface LowStockAlert {
  productId: string;
  name: string;
  sku: string | null;
  quantityOnHand: number;
  reorderPoint: number;
  category: string | null;
}

interface TopSellingProduct {
  productId: string;
  name: string;
  sku: string | null;
  quantityFulfilled: number;
  totalRevenue: number;
}

interface InventoryStats {
  summary: {
    totalTrackedProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
  };
  lowStockAlerts: LowStockAlert[];
  topSellingProducts: TopSellingProduct[];
}

// 10. Project Overview
interface ProjectDetail {
  projectId: string;
  projectNumber: string;
  name: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  billingMethod: 'FIXED_PRICE' | 'TIME_AND_MATERIALS' | 'NON_BILLABLE';
  customer: { id: string; displayName: string } | null;
  budgetAmount: number | null;
  budgetHours: number | null;
  hoursLogged: number;
  hoursBurnPercent: number | null;
  invoicedRevenue: number;
  expensesIncurred: number;
  startDate: string | null;
  endDate: string | null;
}

interface ProjectOverview {
  summary: {
    totalProjects: number;
    ACTIVE: number;
    ON_HOLD: number;
    COMPLETED: number;
    CANCELLED: number;
    totalBillableHours: number;
    totalBillableRevenue: number;
  };
  projects: ProjectDetail[];
}

// 11. Recent Activity
interface ActivityItem {
  id: string;
  type: 'INVOICE' | 'BILL' | 'EXPENSE' | 'JOURNAL_ENTRY' | 'PAYMENT';
  label: string;
  description: string;
  status: string;
  amount: number;
  occurredAt: string;
}

interface RecentActivity {
  activities: ActivityItem[];
}

// 12. Period Comparison
interface ComparisonMetric extends ChangeMetric {
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
}

interface PeriodComparison {
  current: PeriodRange;
  previous: PeriodRange;
  metrics: ComparisonMetric[];
}

// Query params
interface DashboardQuery {
  period?: 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';
  startDate?: string;
  endDate?: string;
  limit?: number;
}
```
