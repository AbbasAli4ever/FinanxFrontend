# Day 21 — Financial Reports — Frontend Integration Guide

## Base URL
```
http://localhost:3000/api/v1/reports
```

All endpoints require `Authorization: Bearer <token>` header.
All endpoints require the `report:view_basic` permission.

---

## 1. Cash Flow Statement

### Request
```
GET /reports/cash-flow-statement?startDate=2025-01-01&endDate=2025-12-31
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | `YYYY-MM-DD` | No | Start of period (defaults to Jan 1 of current year) |
| `endDate` | `YYYY-MM-DD` | No | End of period (defaults to today) |

### Response
```json
{
  "success": true,
  "message": "Cash flow statement retrieved successfully",
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    },
    "operating": {
      "netIncome": 54800,
      "adjustments": [
        {
          "name": "Accounts Receivable",
          "accountType": "Accounts Receivable",
          "amount": -47460
        },
        {
          "name": "Accounts Payable",
          "accountType": "Accounts Payable",
          "amount": 10266
        }
      ],
      "totalAdjustments": -25284,
      "totalOperating": 29516
    },
    "investing": {
      "items": [
        {
          "name": "Furniture and Equipment",
          "accountType": "Fixed Assets",
          "amount": -2000
        }
      ],
      "totalInvesting": -2000
    },
    "financing": {
      "items": [
        {
          "name": "Owner's Equity",
          "accountType": "Equity",
          "amount": 50000
        }
      ],
      "totalFinancing": 50000
    },
    "netChangeInCash": 77516,
    "beginningCash": 0,
    "endingCash": 81516
  }
}
```

### Frontend Notes
- Display as 3 sections: Operating, Investing, Financing
- Show Net Income at top of Operating section, then list adjustments
- Show subtotals for each section
- Show final summary: Beginning Cash → Net Change → Ending Cash
- Negative amounts in investing typically indicate capital expenditure (normal)

---

## 2. AR Aging Report

### Request
```
GET /reports/ar-aging?asOfDate=2026-03-03
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `asOfDate` | `YYYY-MM-DD` | No | Aging calculated as of this date (defaults to today) |

### Response
```json
{
  "success": true,
  "message": "AR aging report retrieved successfully",
  "data": {
    "asOfDate": "2026-03-03",
    "customers": [
      {
        "customerId": "uuid",
        "customerName": "Tata Consultancy Services",
        "current": 29500,
        "days1to30": 0,
        "days31to60": 0,
        "days61to90": 0,
        "days91plus": 0,
        "total": 29500,
        "invoices": [
          {
            "invoiceId": "uuid",
            "invoiceNumber": "INV-0004",
            "invoiceDate": "2026-03-01T00:00:00.000Z",
            "dueDate": "2026-03-31T00:00:00.000Z",
            "totalAmount": 29500,
            "amountDue": 29500,
            "daysOverdue": 0,
            "bucket": "current"
          }
        ]
      }
    ],
    "totals": {
      "current": 38940,
      "days1to30": 8520,
      "days31to60": 0,
      "days61to90": 0,
      "days91plus": 0,
      "total": 47460
    }
  }
}
```

### Frontend Notes
- Display as a table with columns: Customer | Current | 1-30 | 31-60 | 61-90 | 91+ | Total
- Totals row at bottom
- Each customer row can be expanded to show individual invoices
- Color-code buckets: green (current), yellow (1-30), orange (31-60), red (61-90, 91+)
- Link invoice numbers to invoice detail pages

---

## 3. AP Aging Report

### Request
```
GET /reports/ap-aging?asOfDate=2026-03-03
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `asOfDate` | `YYYY-MM-DD` | No | Aging calculated as of this date (defaults to today) |

### Response
```json
{
  "success": true,
  "message": "AP aging report retrieved successfully",
  "data": {
    "asOfDate": "2026-03-03",
    "vendors": [
      {
        "vendorId": "uuid",
        "vendorName": "Dell Technologies",
        "current": 9086,
        "days1to30": 0,
        "days31to60": 0,
        "days61to90": 0,
        "days91plus": 0,
        "total": 9086,
        "bills": [
          {
            "billId": "uuid",
            "billNumber": "BILL-0004",
            "billDate": "2026-03-01T00:00:00.000Z",
            "dueDate": "2026-03-31T00:00:00.000Z",
            "totalAmount": 9086,
            "amountDue": 9086,
            "daysOverdue": 0,
            "bucket": "current"
          }
        ]
      }
    ],
    "totals": {
      "current": 10266,
      "days1to30": 0,
      "days31to60": 0,
      "days61to90": 0,
      "days91plus": 0,
      "total": 10266
    }
  }
}
```

### Frontend Notes
- Same layout as AR Aging but with Vendor instead of Customer
- Same color-coding for aging buckets
- Expandable vendor rows showing individual bills

---

## 4. Sales by Customer Report

### Request
```
GET /reports/sales-by-customer?startDate=2025-01-01&endDate=2026-12-31
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | `YYYY-MM-DD` | No | Filter invoices from this date |
| `endDate` | `YYYY-MM-DD` | No | Filter invoices up to this date |

### Response
```json
{
  "success": true,
  "message": "Sales by customer report retrieved successfully",
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2026-12-31"
    },
    "customers": [
      {
        "customerId": "uuid",
        "customerName": "Reliance Digital",
        "invoiceCount": 2,
        "totalAmount": 35400,
        "totalPaid": 35400,
        "totalOutstanding": 0
      },
      {
        "customerId": "uuid",
        "customerName": "Tata Consultancy Services",
        "invoiceCount": 1,
        "totalAmount": 29500,
        "totalPaid": 0,
        "totalOutstanding": 29500
      }
    ],
    "totals": {
      "invoiceCount": 5,
      "totalAmount": 90860,
      "totalPaid": 43400,
      "totalOutstanding": 47460
    }
  }
}
```

### Frontend Notes
- Display as table: Customer | Invoices | Total Amount | Paid | Outstanding
- Sorted by total amount descending (biggest customers first)
- Consider a bar chart visualization for top customers
- Link customer names to customer detail pages

---

## 5. Purchases by Vendor Report

### Request
```
GET /reports/purchases-by-vendor?startDate=2025-01-01&endDate=2026-12-31
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | `YYYY-MM-DD` | No | Filter bills from this date |
| `endDate` | `YYYY-MM-DD` | No | Filter bills up to this date |

### Response
```json
{
  "success": true,
  "message": "Purchases by vendor report retrieved successfully",
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2026-12-31"
    },
    "vendors": [
      {
        "vendorId": "uuid",
        "vendorName": "Dell Technologies",
        "billCount": 1,
        "totalAmount": 9086,
        "totalPaid": 0,
        "totalOutstanding": 9086
      }
    ],
    "totals": {
      "billCount": 4,
      "totalAmount": 19116,
      "totalPaid": 8850,
      "totalOutstanding": 10266
    }
  }
}
```

### Frontend Notes
- Same layout as Sales by Customer but for vendors/bills
- Sorted by total amount descending

---

## 6. Expense by Category Report

### Request
```
GET /reports/expense-by-category?startDate=2025-01-01&endDate=2026-12-31
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | `YYYY-MM-DD` | No | Filter from this date |
| `endDate` | `YYYY-MM-DD` | No | Filter up to this date |

### Response
```json
{
  "success": true,
  "message": "Expense by category report retrieved successfully",
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2026-12-31"
    },
    "categories": [
      {
        "accountId": "uuid",
        "accountNumber": "5000",
        "accountName": "Cost of Goods Sold",
        "accountType": "Cost of Goods Sold",
        "amount": 5900,
        "percentage": 30.73
      },
      {
        "accountId": "uuid",
        "accountNumber": "6110",
        "accountName": "Dues & Subscriptions",
        "accountType": "Expenses",
        "amount": 5000,
        "percentage": 26.04
      }
    ],
    "total": 19200
  }
}
```

### Frontend Notes
- Display as table: Category | Account # | Amount | % of Total
- Great candidate for a **pie chart** or **donut chart** visualization
- Sorted by amount descending (biggest expenses first)
- Percentages will sum to ~100% (minor rounding variation possible)

---

## Existing Reports (Updated Permissions)

These 4 endpoints now use `report:view_basic` permission (previously used `account:view`):

| Endpoint | Description |
|----------|-------------|
| `GET /reports/trial-balance?asOfDate=YYYY-MM-DD` | All accounts with debit/credit balances |
| `GET /reports/account-ledger/:accountId?startDate&endDate` | Transaction history for one account |
| `GET /reports/income-statement?startDate&endDate` | P&L: Revenue - COGS - Expenses = Net Income |
| `GET /reports/balance-sheet?asOfDate=YYYY-MM-DD` | Assets = Liabilities + Equity |

---

## TypeScript Interfaces

```typescript
// Query params (shared across all reports)
interface ReportQueryParams {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  asOfDate?: string;   // YYYY-MM-DD
}

// Cash Flow Statement
interface CashFlowStatement {
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

interface CashFlowItem {
  name: string;
  accountType: string;
  amount: number;
}

// AR Aging
interface ArAgingReport {
  asOfDate: string;
  customers: ArAgingCustomer[];
  totals: AgingBuckets;
}

interface ArAgingCustomer extends AgingBuckets {
  customerId: string;
  customerName: string;
  invoices: AgingInvoice[];
}

interface AgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  amountDue: number;
  daysOverdue: number;
  bucket: 'current' | 'days1to30' | 'days31to60' | 'days61to90' | 'days91plus';
}

// AP Aging
interface ApAgingReport {
  asOfDate: string;
  vendors: ApAgingVendor[];
  totals: AgingBuckets;
}

interface ApAgingVendor extends AgingBuckets {
  vendorId: string;
  vendorName: string;
  bills: AgingBill[];
}

interface AgingBill {
  billId: string;
  billNumber: string;
  billDate: string;
  dueDate: string | null;
  totalAmount: number;
  amountDue: number;
  daysOverdue: number;
  bucket: 'current' | 'days1to30' | 'days31to60' | 'days61to90' | 'days91plus';
}

// Shared aging buckets
interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91plus: number;
  total: number;
}

// Sales by Customer
interface SalesByCustomerReport {
  period: { startDate: string | null; endDate: string | null };
  customers: SalesCustomer[];
  totals: {
    invoiceCount: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

interface SalesCustomer {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

// Purchases by Vendor
interface PurchasesByVendorReport {
  period: { startDate: string | null; endDate: string | null };
  vendors: PurchasesVendor[];
  totals: {
    billCount: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

interface PurchasesVendor {
  vendorId: string;
  vendorName: string;
  billCount: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

// Expense by Category
interface ExpenseByCategoryReport {
  period: { startDate: string | null; endDate: string | null };
  categories: ExpenseCategory[];
  total: number;
}

interface ExpenseCategory {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  amount: number;
  percentage: number;
}
```

---

## Suggested Report Pages Layout

### Reports Dashboard
- Grid of report cards, each linking to its full report page
- Quick stats: Total Revenue, Total Expenses, Net Income, AR Outstanding, AP Outstanding

### AR/AP Aging Pages
- Date picker for `asOfDate`
- Summary bar showing total per bucket with color coding
- Expandable table rows (click customer/vendor to see invoices/bills)
- Export to CSV button

### Cash Flow Statement Page
- Date range picker (start/end)
- Three collapsible sections: Operating, Investing, Financing
- Summary bar: Beginning Cash → Net Change → Ending Cash

### Sales/Purchases Pages
- Date range picker
- Bar chart showing top 10 customers/vendors
- Table with sortable columns
- Export to CSV

### Expense by Category Page
- Date range picker
- Donut/pie chart for visual breakdown
- Table with amount and percentage columns
- Compare with previous period (future enhancement)
