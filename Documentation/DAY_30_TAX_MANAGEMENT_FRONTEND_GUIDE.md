# Day 30 — Tax Management Frontend Integration Guide

Base URL: `{{API_URL}}/api/v1`

All endpoints require `Authorization: Bearer <token>` header.

---

## 1. Create Tax Rate

```
POST /taxes/rates
```

**Permission:** `tax:create`

**Request body:**
```json
{
  "name": "GST",
  "code": "GST",
  "description": "Federal Goods and Services Tax",
  "rate": 5,
  "taxType": "BOTH",
  "isCompound": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name (max 255) |
| `code` | string | Yes | Unique code per company, auto-uppercased (max 50) |
| `description` | string | No | Optional description |
| `rate` | number | Yes | Percentage (0-100) |
| `taxType` | string | No | `"SALES"`, `"PURCHASE"`, or `"BOTH"` (default: BOTH) |
| `isCompound` | boolean | No | If true, applied on base + previous taxes (default: false) |
| `isActive` | boolean | No | Default: true |

**Response:**
```json
{
  "success": true,
  "message": "Tax rate created successfully",
  "data": {
    "id": "3a2e9c7e-e8b8-4508-a1ab-cf0e2620acd0",
    "companyId": "9bf301f9-...",
    "name": "GST",
    "code": "GST",
    "description": "Federal Goods and Services Tax",
    "rate": "5",
    "taxType": "BOTH",
    "isCompound": false,
    "isActive": true,
    "createdAt": "2026-03-10T21:10:38.523Z",
    "updatedAt": "2026-03-10T21:10:38.523Z"
  }
}
```

---

## 2. List Tax Rates

```
GET /taxes/rates
GET /taxes/rates?isActive=true
GET /taxes/rates?taxType=SALES
GET /taxes/rates?search=gst
GET /taxes/rates?isActive=true&taxType=BOTH&search=tax
```

**Permission:** `tax:view`

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `isActive` | boolean | — | Filter by active/inactive status |
| `taxType` | string | — | Filter by `SALES`, `PURCHASE`, or `BOTH` |
| `search` | string | — | Search by name or code (case-insensitive) |

**Response:**
```json
{
  "success": true,
  "data": {
    "taxRates": [
      {
        "id": "3a2e9c7e-...",
        "name": "GST",
        "code": "GST",
        "rate": "5",
        "taxType": "BOTH",
        "isCompound": false,
        "isActive": true,
        "createdAt": "2026-03-10T21:10:38.523Z",
        "updatedAt": "2026-03-10T21:10:38.523Z"
      },
      {
        "id": "d5331345-...",
        "name": "PST Ontario",
        "code": "PST-ON",
        "rate": "8",
        "taxType": "SALES",
        "isCompound": false,
        "isActive": true,
        "createdAt": "2026-03-10T21:10:38.580Z",
        "updatedAt": "2026-03-10T21:10:38.580Z"
      }
    ],
    "total": 2
  }
}
```

**Frontend usage:**
- Default to `?isActive=true` for dropdowns and selectors
- Show all (including inactive) on settings/admin pages
- Use `search` for real-time filtering on the settings page

---

## 3. Get Single Tax Rate

```
GET /taxes/rates/:id
```

**Permission:** `tax:view`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "3a2e9c7e-...",
    "name": "GST",
    "code": "GST",
    "description": "Federal Goods and Services Tax",
    "rate": "5",
    "taxType": "BOTH",
    "isCompound": false,
    "isActive": true,
    "createdAt": "2026-03-10T21:10:38.523Z",
    "updatedAt": "2026-03-11T01:11:07.077Z",
    "taxGroupRates": [
      {
        "id": "7fcd0764-...",
        "taxGroupId": "62b39471-...",
        "taxRateId": "3a2e9c7e-...",
        "sortOrder": 0,
        "createdAt": "2026-03-10T21:10:53.663Z",
        "taxGroup": {
          "id": "62b39471-...",
          "name": "HST Ontario",
          "code": "HST-ON",
          "isActive": true
        }
      }
    ]
  }
}
```

**Frontend usage:**
- Shows which groups this rate belongs to via `taxGroupRates`
- Use on rate detail/edit page

---

## 4. Update Tax Rate

```
PATCH /taxes/rates/:id
```

**Permission:** `tax:edit`

**Request body (all fields optional):**
```json
{
  "name": "GST Federal",
  "description": "Updated description",
  "rate": 5.5
}
```

---

## 5. Delete (Deactivate) Tax Rate

```
DELETE /taxes/rates/:id
```

**Permission:** `tax:delete`

**Response:**
```json
{
  "success": true,
  "message": "Tax rate deactivated successfully",
  "data": null
}
```

**Note:** This is a soft-delete — rate becomes `isActive: false`. Existing line items referencing this rate are unaffected. Reactivation happens automatically if you create a rate with the same code later.

---

## 6. Create Tax Group

```
POST /taxes/groups
```

**Permission:** `tax:create`

**Request body:**
```json
{
  "name": "HST Ontario",
  "code": "HST-ON",
  "description": "Combined GST + PST for Ontario",
  "rateIds": [
    "3a2e9c7e-e8b8-4508-a1ab-cf0e2620acd0",
    "d5331345-35a4-4a66-b286-578403691db8"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `code` | string | Yes | Unique code per company |
| `description` | string | No | Optional description |
| `rateIds` | UUID[] | No | Initial rates to include (order = sortOrder) |
| `isActive` | boolean | No | Default: true |

**Response:**
```json
{
  "success": true,
  "message": "Tax group created successfully",
  "data": {
    "id": "62b39471-...",
    "name": "HST Ontario",
    "code": "HST-ON",
    "description": "Combined GST + PST for Ontario",
    "isActive": true,
    "taxGroupRates": [
      {
        "id": "7fcd0764-...",
        "taxRateId": "3a2e9c7e-...",
        "sortOrder": 0,
        "taxRate": {
          "id": "3a2e9c7e-...",
          "name": "GST",
          "code": "GST",
          "rate": "5",
          "taxType": "BOTH",
          "isCompound": false,
          "isActive": true
        }
      },
      {
        "id": "23a96153-...",
        "taxRateId": "d5331345-...",
        "sortOrder": 1,
        "taxRate": {
          "id": "d5331345-...",
          "name": "PST Ontario",
          "code": "PST-ON",
          "rate": "8",
          "taxType": "SALES",
          "isCompound": false,
          "isActive": true
        }
      }
    ]
  }
}
```

**Frontend usage:**
- Order of `rateIds` determines `sortOrder` (matters for compound taxes)
- Show combined rate as sum: `5% + 8% = 13%` (non-compound) or calculated effective rate (compound)

---

## 7. List Tax Groups

```
GET /taxes/groups
```

**Permission:** `tax:view`

**Response:**
```json
{
  "success": true,
  "data": {
    "taxGroups": [
      {
        "id": "62b39471-...",
        "name": "HST Ontario",
        "code": "HST-ON",
        "isActive": true,
        "taxGroupRates": [
          {
            "sortOrder": 0,
            "taxRate": { "name": "GST", "code": "GST", "rate": "5" }
          },
          {
            "sortOrder": 1,
            "taxRate": { "name": "PST Ontario", "code": "PST-ON", "rate": "8" }
          }
        ]
      }
    ],
    "total": 1
  }
}
```

---

## 8. Get Single Tax Group

```
GET /taxes/groups/:id
```

**Permission:** `tax:view`

Same shape as list item with full nested tax rate objects.

---

## 9. Update Tax Group

```
PATCH /taxes/groups/:id
```

**Permission:** `tax:edit`

**Request body (all fields optional):**
```json
{
  "name": "HST Ontario (Updated)",
  "description": "New description"
}
```

**Note:** To change group rates, use the add/remove rate endpoints (11, 12).

---

## 10. Delete (Deactivate) Tax Group

```
DELETE /taxes/groups/:id
```

**Permission:** `tax:delete`

---

## 11. Add Rate to Group

```
POST /taxes/groups/:id/rates
```

**Permission:** `tax:edit`

**Request body:**
```json
{
  "rateId": "a1b2c3d4-..."
}
```

**Response:** Returns the updated group with all nested rates.

**Note:** Rate is appended with `sortOrder = max + 1`.

---

## 12. Remove Rate from Group

```
DELETE /taxes/groups/:groupId/rates/:rateId
```

**Permission:** `tax:edit`

**Response:** Returns the updated group with remaining rates.

---

## 13. Tax Summary Report

Tax collected vs tax paid with net liability calculation.

```
GET /taxes/reports/summary
GET /taxes/reports/summary?startDate=2025-01-01&endDate=2025-12-31
```

**Permission:** `tax:report`

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | ISO date | No | Period start (omit for all-time) |
| `endDate` | ISO date | No | Period end (omit for all-time) |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    },
    "salesTaxCollected": 13860,
    "purchaseTaxPaid": 2916,
    "expenseTax": {
      "total": 251.5,
      "deductible": 0,
      "nonDeductible": 251.5
    },
    "netTaxLiability": 10944
  }
}
```

**Frontend usage:**
- `salesTaxCollected` = sum of `taxAmount` from invoices (not DRAFT/VOID)
- `purchaseTaxPaid` = sum of `taxAmount` from bills (not DRAFT/VOID)
- `expenseTax.deductible` = tax from expenses marked `isTaxDeductible: true`
- `netTaxLiability` = salesTaxCollected - purchaseTaxPaid - deductibleExpenseTax
- Show as a dashboard card or dedicated tax report page
- Positive = you owe tax, Negative = you're owed a refund

---

## 14. Tax Breakdown by Rate

Shows how many line items use each managed tax rate.

```
GET /taxes/reports/by-rate
GET /taxes/reports/by-rate?startDate=2025-01-01&endDate=2025-12-31
```

**Permission:** `tax:report`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "startDate": null, "endDate": null },
    "rateBreakdowns": [
      {
        "taxRate": {
          "id": "3a2e9c7e-...",
          "name": "GST",
          "code": "GST",
          "rate": 5,
          "isActive": true
        },
        "invoiceLineCount": 12,
        "billLineCount": 5,
        "invoiceTaxableAmount": 45000,
        "billTaxableAmount": 12000
      }
    ],
    "unlinked": {
      "invoiceLineCount": 9,
      "billLineCount": 7,
      "invoiceTaxableAmount": 90860,
      "billTaxableAmount": 19116
    }
  }
}
```

**Frontend usage:**
- `rateBreakdowns` shows managed tax rates with usage counts
- `unlinked` shows line items using manual `taxPercent` without a linked `taxRateId`
- Use `unlinked` to prompt users: "9 invoice line items have manual tax — link them to a managed rate?"
- Show as a table or pie chart

---

## 15. 1099 Vendor Report

Tracks payments to vendors marked for 1099 reporting.

```
GET /taxes/reports/1099
GET /taxes/reports/1099?startDate=2025-01-01&endDate=2025-12-31
```

**Permission:** `tax:report`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "startDate": "2025-01-01", "endDate": "2025-12-31" },
    "vendors": [
      {
        "vendor": {
          "id": "abc123-...",
          "displayName": "John's Consulting",
          "taxNumber": "12-3456789",
          "businessIdNo": "EIN-123"
        },
        "totalPayments": 75000,
        "billCount": 12
      },
      {
        "vendor": {
          "id": "def456-...",
          "displayName": "Design Studio LLC",
          "taxNumber": "98-7654321",
          "businessIdNo": null
        },
        "totalPayments": 25000,
        "billCount": 4
      }
    ],
    "vendorCount": 2
  }
}
```

**Frontend usage:**
- Only shows vendors with `track1099: true` who have payments > $0
- Sorted by `totalPayments` descending
- Use `taxNumber` for 1099 form generation
- Highlight vendors over $600 threshold (IRS reporting requirement)

---

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Validation error | Missing required fields or invalid values |
| 400 | One or more tax rate IDs are invalid | rateIds in createTaxGroup don't exist |
| 403 | Forbidden | Missing required permission |
| 404 | Tax rate not found | Invalid ID or wrong company |
| 404 | Tax group not found | Invalid ID or wrong company |
| 404 | Rate is not in this group | Removing a rate that's not in the group |
| 409 | Tax rate with code X already exists | Duplicate active code |
| 409 | Tax group with code X already exists | Duplicate active code |
| 409 | Rate is already in this group | Adding a rate that's already linked |

---

## Recommended Frontend Pages

### Tax Settings Page (`/settings/taxes`)
```
┌─────────────────────────────────────────────────┐
│ Tax Settings                                     │
├──────────────────┬──────────────────────────────┤
│ Tax Rates        │ Tax Groups                    │
│                  │                               │
│ [+ New Rate]     │ [+ New Group]                 │
│                  │                               │
│ ┌──────────────┐ │ ┌────────────────────────┐   │
│ │ GST    5%    │ │ │ HST Ontario            │   │
│ │ BOTH ✓Active │ │ │ GST (5%) + PST-ON (8%) │   │
│ └──────────────┘ │ │ = 13% combined         │   │
│ ┌──────────────┐ │ └────────────────────────┘   │
│ │ PST-ON  8%   │ │                               │
│ │ SALES ✓Active│ │                               │
│ └──────────────┘ │                               │
└──────────────────┴──────────────────────────────┘
```

### Tax Reports Page (`/reports/taxes`)
```
┌─────────────────────────────────────────────────┐
│ Tax Reports     [Date Range Picker]              │
├─────────────────────────────────────────────────┤
│ Summary                                          │
│  Sales Tax Collected:    $13,860.00              │
│  Purchase Tax Paid:       $2,916.00              │
│  Expense Tax (Deductible):     $0.00            │
│  ─────────────────────────────────               │
│  Net Tax Liability:      $10,944.00              │
├─────────────────────────────────────────────────┤
│ By Rate                           │ 1099 Report  │
│  GST: 12 inv / 5 bill lines      │ John's: $75k │
│  Unlinked: 9 inv / 7 bill lines  │ Design: $25k │
└───────────────────────────────────┴─────────────┘
```

---

## TypeScript Interfaces

```typescript
interface TaxRate {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  rate: string; // Decimal as string from Prisma
  taxType: 'SALES' | 'PURCHASE' | 'BOTH';
  isCompound: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  taxGroupRates?: TaxGroupRateWithGroup[];
}

interface TaxGroup {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  taxGroupRates: TaxGroupRateWithRate[];
}

interface TaxGroupRateWithRate {
  id: string;
  taxGroupId: string;
  taxRateId: string;
  sortOrder: number;
  createdAt: string;
  taxRate: TaxRate;
}

interface TaxGroupRateWithGroup {
  id: string;
  taxGroupId: string;
  taxRateId: string;
  sortOrder: number;
  createdAt: string;
  taxGroup: TaxGroup;
}

interface TaxSummary {
  period: { startDate: string | null; endDate: string | null };
  salesTaxCollected: number;
  purchaseTaxPaid: number;
  expenseTax: {
    total: number;
    deductible: number;
    nonDeductible: number;
  };
  netTaxLiability: number;
}

interface TaxByRateReport {
  period: { startDate: string | null; endDate: string | null };
  rateBreakdowns: {
    taxRate: { id: string; name: string; code: string; rate: number; isActive: boolean };
    invoiceLineCount: number;
    billLineCount: number;
    invoiceTaxableAmount: number;
    billTaxableAmount: number;
  }[];
  unlinked: {
    invoiceLineCount: number;
    billLineCount: number;
    invoiceTaxableAmount: number;
    billTaxableAmount: number;
  };
}

interface Vendor1099Report {
  period: { startDate: string | null; endDate: string | null };
  vendors: {
    vendor: { id: string; displayName: string; taxNumber: string | null; businessIdNo: string | null };
    totalPayments: number;
    billCount: number;
  }[];
  vendorCount: number;
}
```
