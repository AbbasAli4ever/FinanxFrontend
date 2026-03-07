# Day 22 — Recurring Transactions — Frontend Integration Guide

## Base URL
```
http://localhost:3000/api/v1
```

All endpoints require `Authorization: Bearer <token>` header.

---

## Creating Recurring Documents

### Create Recurring Invoice
```
POST /invoices
```

Add these optional fields to the standard create invoice payload:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isRecurring` | `boolean` | No | Enable recurring (default: false) |
| `recurringFrequency` | `string` | No | DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY |
| `recurringEndDate` | `string` | No | End date in YYYY-MM-DD format (null = forever) |

**Request:**
```json
{
  "customerId": "uuid",
  "invoiceDate": "2026-03-04",
  "dueDate": "2026-04-04",
  "isRecurring": true,
  "recurringFrequency": "MONTHLY",
  "recurringEndDate": "2026-12-31",
  "lineItems": [
    {
      "productId": "uuid",
      "description": "Monthly subscription",
      "quantity": 1,
      "unitPrice": 99.99
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice INV-0011 created successfully",
  "data": {
    "id": "uuid",
    "invoiceNumber": "INV-0011",
    "status": "DRAFT",
    "isRecurring": true,
    "recurringFrequency": "MONTHLY",
    "nextRecurringDate": "2026-04-04T00:00:00.000Z",
    "recurringEndDate": "2026-12-31T00:00:00.000Z",
    "totalAmount": 99.99,
    "...": "other invoice fields"
  }
}
```

> **Note:** `nextRecurringDate` is auto-calculated from `invoiceDate` + `recurringFrequency`. You do NOT pass it.

### Create Recurring Bill
```
POST /bills
```

Same 3 optional fields: `isRecurring`, `recurringFrequency`, `recurringEndDate`.

```json
{
  "vendorId": "uuid",
  "billDate": "2026-03-04",
  "dueDate": "2026-04-04",
  "isRecurring": true,
  "recurringFrequency": "MONTHLY",
  "lineItems": [
    {
      "expenseAccountId": "uuid",
      "description": "Monthly office rent",
      "quantity": 1,
      "unitPrice": 2500.00
    }
  ]
}
```

---

## Auto-Clone Behavior

When a recurring document's action is triggered, a DRAFT clone is automatically created:

| Document | Trigger Action | Clone Created |
|----------|---------------|---------------|
| Invoice | `POST /invoices/:id/send` | New DRAFT invoice with next date |
| Bill | `POST /bills/:id/receive` | New DRAFT bill with next date |
| Expense | `POST /expenses/:id/pay` | New DRAFT expense with next date |
| Journal Entry | `POST /journal-entries/:id/post` | New DRAFT entry with next date |

**After send/receive:**
- Original: `nextRecurringDate = null` (consumed)
- Clone: `nextRecurringDate = <advanced date>`, `status = DRAFT`
- Clone includes all line items, customer/vendor, amounts

---

## Recurring Management Endpoints

### 1. Get Upcoming Recurring Items
```
GET /recurring/upcoming
```
**Permission:** `recurring:view`

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `daysAhead` | `number` | No | 30 | How many days to look ahead |
| `type` | `string` | No | all | Filter: invoice, bill, expense, journal-entry |

**Response:**
```json
{
  "success": true,
  "message": "Upcoming recurring items retrieved",
  "data": {
    "invoices": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-0012",
        "totalAmount": 99.99,
        "nextRecurringDate": "2026-04-18T00:00:00.000Z",
        "recurringFrequency": "WEEKLY",
        "recurringEndDate": "2026-12-31T00:00:00.000Z",
        "invoiceDate": "2026-03-04T00:00:00.000Z",
        "customer": { "id": "uuid", "displayName": "Infosys Ltd" },
        "type": "invoice"
      }
    ],
    "bills": [],
    "expenses": [],
    "journalEntries": []
  }
}
```

### 2. Get All Recurring Templates
```
GET /recurring/templates
```
**Permission:** `recurring:view`

Returns all active recurring documents across all types, regardless of status or next date.

**Response:**
```json
{
  "success": true,
  "message": "Recurring templates retrieved",
  "data": {
    "invoices": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-0012",
        "totalAmount": 99.99,
        "recurringFrequency": "WEEKLY",
        "nextRecurringDate": "2026-04-18T00:00:00.000Z",
        "recurringEndDate": "2026-12-31T00:00:00.000Z",
        "status": "DRAFT",
        "customer": { "id": "uuid", "displayName": "Infosys Ltd" },
        "type": "invoice"
      }
    ],
    "bills": [...],
    "expenses": [...],
    "journalEntries": [...]
  }
}
```

### 3. Manually Process Overdue Items
```
POST /recurring/process
```
**Permission:** `recurring:manage`

Processes all overdue recurring items (DRAFT with `nextRecurringDate` in the past). Creates DRAFT clones for each.

**Response:**
```json
{
  "success": true,
  "message": "Recurring items processed",
  "data": {
    "totalProcessed": 3,
    "invoicesProcessed": 1,
    "billsProcessed": 1,
    "expensesProcessed": 1
  }
}
```

### 4. Pause a Recurring Item
```
PATCH /recurring/:type/:id/pause
```
**Permission:** `recurring:manage`

Sets `isRecurring = false` while preserving all settings (frequency, end date, next date).

**Path params:**
- `:type` — `invoice`, `bill`, `expense`, or `journal-entry`
- `:id` — UUID of the document

**Response:**
```json
{
  "success": true,
  "message": "Recurring invoice paused successfully",
  "data": {
    "message": "Recurring invoice paused successfully"
  }
}
```

### 5. Resume a Recurring Item
```
PATCH /recurring/:type/:id/resume
```
**Permission:** `recurring:manage`

Sets `isRecurring = true`. If `nextRecurringDate` is null or in the past, recalculates from today.

**Response:**
```json
{
  "success": true,
  "message": "Recurring invoice resumed successfully",
  "data": {
    "message": "Recurring invoice resumed successfully",
    "nextRecurringDate": "2026-04-04T00:00:00.000Z"
  }
}
```

### 6. Update Recurring Settings
```
PATCH /recurring/:type/:id/settings
```
**Permission:** `recurring:manage`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recurringFrequency` | `string` | No | New frequency (recalculates next date) |
| `recurringEndDate` | `string` | No | New end date (YYYY-MM-DD), or null to remove |

**Request:**
```json
{
  "recurringFrequency": "WEEKLY",
  "recurringEndDate": "2026-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recurring invoice settings updated successfully",
  "data": {
    "message": "Recurring invoice settings updated successfully"
  }
}
```

---

## TypeScript Interfaces

```typescript
// Recurring fields (added to Invoice, Bill, Expense, JournalEntry responses)
interface RecurringFields {
  isRecurring: boolean;
  recurringFrequency: string | null;  // 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  nextRecurringDate: string | null;   // ISO date
  recurringEndDate: string | null;    // ISO date
}

// Upcoming item (varies by type)
interface UpcomingInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  nextRecurringDate: string;
  recurringFrequency: string;
  recurringEndDate: string | null;
  invoiceDate: string;
  customer: { id: string; displayName: string };
  type: 'invoice';
}

interface UpcomingBill {
  id: string;
  billNumber: string;
  totalAmount: number;
  nextRecurringDate: string;
  recurringFrequency: string;
  recurringEndDate: string | null;
  billDate: string;
  vendor: { id: string; displayName: string };
  type: 'bill';
}

interface UpcomingExpense {
  id: string;
  expenseNumber: string;
  totalAmount: number;
  nextRecurringDate: string;
  recurringFrequency: string;
  recurringEndDate: string | null;
  expenseDate: string;
  vendor: { id: string; displayName: string } | null;
  type: 'expense';
}

interface UpcomingJournalEntry {
  id: string;
  entryNumber: string;
  totalDebit: number;
  nextRecurringDate: string;
  recurringFrequency: string;
  recurringEndDate: string | null;
  entryDate: string;
  description: string | null;
  type: 'journal-entry';
}

// Upcoming response
interface UpcomingResponse {
  invoices?: UpcomingInvoice[];
  bills?: UpcomingBill[];
  expenses?: UpcomingExpense[];
  journalEntries?: UpcomingJournalEntry[];
}

// Templates response (same structure as upcoming but includes status field)
interface TemplatesResponse {
  invoices: (UpcomingInvoice & { status: string })[];
  bills: (UpcomingBill & { status: string })[];
  expenses: (UpcomingExpense & { status: string })[];
  journalEntries: (UpcomingJournalEntry & { status: string })[];
}

// Process result
interface ProcessResult {
  totalProcessed: number;
  invoicesProcessed: number;
  billsProcessed: number;
  expensesProcessed: number;
}

// Valid types for management endpoints
type RecurringType = 'invoice' | 'bill' | 'expense' | 'journal-entry';

// Valid frequencies for create/update
type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
```

---

## Suggested Frontend Pages

### 1. Recurring Dashboard Page
- **Route:** `/recurring`
- Show all templates (GET `/recurring/templates`) in a table with type, number, amount, frequency, next date, status
- "Upcoming" tab filtered to next 30 days
- Action buttons: Pause, Resume, Edit Settings
- "Process Now" button for admins

### 2. Create/Edit Forms Enhancement
- Add a "Make Recurring" toggle to Invoice, Bill, Expense, Journal Entry create/edit forms
- When toggled ON, show frequency dropdown and optional end date
- Show a recurring badge/icon on documents that are recurring

### 3. Recurring Indicator on List Pages
- Add a recurring icon next to document numbers on list pages
- Show `nextRecurringDate` in a tooltip or column

---

## Error Responses

```json
// Invalid type
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid recurring type: foo. Must be invoice, bill, expense, or journal-entry"
}

// Not found
{
  "success": false,
  "statusCode": 404,
  "message": "invoice not found"
}

// Already paused
{
  "success": false,
  "statusCode": 400,
  "message": "This invoice is not recurring"
}

// Already active
{
  "success": false,
  "statusCode": 400,
  "message": "This invoice is already recurring"
}

// No frequency set
{
  "success": false,
  "statusCode": 400,
  "message": "This invoice has no recurring frequency set. Update settings first."
}
```

---

## Cron Job (Automatic Processing)

A daily cron job runs at **2:00 AM** and automatically processes overdue recurring items across all companies. No frontend action required — it runs silently in the background. The manual `POST /recurring/process` endpoint provides the same functionality on-demand.
