# Day 23 — Audit Trail — Frontend Integration Guide

## API Endpoints

All endpoints require `Authorization: Bearer <token>` and the `audit:view` permission.

---

### 1. GET `/api/v1/audit-trail` — Paginated Audit Log List

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |
| `entityType` | string | — | Filter by entity type (e.g. `INVOICE`, `BILL`) |
| `entityId` | string | — | Filter by specific entity UUID |
| `userId` | string | — | Filter by user who performed the action |
| `action` | string | — | Filter by action (e.g. `CREATE`, `VOID`, `PAY`) |
| `dateFrom` | string | — | ISO date string, inclusive start |
| `dateTo` | string | — | ISO date string, inclusive end |
| `search` | string | — | Search in description and entityLabel |
| `sortBy` | string | `performedAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "message": "Audit logs retrieved",
  "data": {
    "items": [
      {
        "id": "uuid",
        "entityType": "INVOICE",
        "entityId": "uuid",
        "entityLabel": "INV-0013",
        "action": "VOID",
        "description": "Invoice INV-0013 voided",
        "changes": { "status": { "from": "SENT", "to": "VOID" } },
        "metadata": { "reason": "Customer cancelled", "amountDue": 100 },
        "performedAt": "2026-03-04T05:49:12.755Z",
        "user": {
          "id": "uuid",
          "name": "Arjun Singh",
          "email": "ceo@finanx.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalCount": 42,
      "totalPages": 1
    }
  }
}
```

**Example calls:**
```bash
# All audit logs (most recent first)
GET /api/v1/audit-trail

# Filter by entity type
GET /api/v1/audit-trail?entityType=INVOICE

# Filter by action
GET /api/v1/audit-trail?action=VOID

# Filter by date range
GET /api/v1/audit-trail?dateFrom=2026-03-01&dateTo=2026-03-31

# Search by description or label
GET /api/v1/audit-trail?search=INV-0013

# Combine filters
GET /api/v1/audit-trail?entityType=INVOICE&action=CREATE&userId=bb512a5d-...&page=1&limit=20
```

---

### 2. GET `/api/v1/audit-trail/entity/:entityType/:entityId` — Document History

Returns the full audit trail for a specific document, sorted newest first.

**URL Parameters:**
- `entityType` — One of: `INVOICE`, `BILL`, `EXPENSE`, `JOURNAL_ENTRY`, `CREDIT_NOTE`, `DEBIT_NOTE`, `ESTIMATE`, `PURCHASE_ORDER`, `SALES_ORDER`, `ACCOUNT`, `CUSTOMER`, `VENDOR`, `PRODUCT`, `BANK_ACCOUNT`, `BANK_TRANSACTION`, `BANK_RECONCILIATION`, `USER`, `ROLE`, `CATEGORY`, `COMPANY`
- `entityId` — UUID of the entity

**Response:**
```json
{
  "success": true,
  "message": "Audit trail for entity retrieved",
  "data": [
    {
      "id": "uuid",
      "action": "VOID",
      "description": "Invoice INV-0013 voided",
      "metadata": { "reason": "Testing audit trail", "amountDue": 100 },
      "performedAt": "2026-03-04T05:49:12.755Z",
      "user": { "id": "uuid", "name": "Arjun Singh", "email": "ceo@finanx.com" }
    },
    {
      "action": "SEND",
      "description": "Invoice INV-0013 sent",
      "metadata": { "totalAmount": 100 },
      "performedAt": "2026-03-04T05:48:45.123Z",
      "user": { "id": "uuid", "name": "Arjun Singh", "email": "ceo@finanx.com" }
    },
    {
      "action": "CREATE",
      "description": "Invoice INV-0013 created",
      "changes": { "customerId": "uuid", "totalAmount": 100 },
      "performedAt": "2026-03-04T05:48:08.755Z",
      "user": { "id": "uuid", "name": "Arjun Singh", "email": "ceo@finanx.com" }
    }
  ]
}
```

**Use case:** Display a timeline/history panel on any document detail page (invoice, bill, etc.)

```bash
GET /api/v1/audit-trail/entity/INVOICE/fdd86cbc-2b8f-401e-83b8-4ff3dfe06ae0
```

---

### 3. GET `/api/v1/audit-trail/user/:userId` — User Activity Log

Returns all actions performed by a specific user, paginated.

**URL Parameters:**
- `userId` — UUID of the user

**Query Parameters:**
Same pagination as endpoint 1 (`page`, `limit`)

**Response:**
```json
{
  "success": true,
  "message": "Audit trail for user retrieved",
  "data": {
    "items": [
      {
        "id": "uuid",
        "entityType": "INVOICE",
        "entityId": "uuid",
        "entityLabel": "INV-0013",
        "action": "VOID",
        "description": "Invoice INV-0013 voided",
        "performedAt": "2026-03-04T05:49:12.755Z",
        "user": { "id": "uuid", "name": "Arjun Singh", "email": "ceo@finanx.com" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalCount": 15,
      "totalPages": 1
    }
  }
}
```

**Use case:** Display activity log on user profile or admin panel.

---

## Available Entity Types

| Entity Type | Documents |
|-------------|-----------|
| `INVOICE` | Invoices |
| `BILL` | Bills |
| `EXPENSE` | Expenses |
| `JOURNAL_ENTRY` | Journal Entries |
| `CREDIT_NOTE` | Credit Notes |
| `DEBIT_NOTE` | Debit Notes |
| `ESTIMATE` | Estimates |
| `PURCHASE_ORDER` | Purchase Orders |
| `SALES_ORDER` | Sales Orders |
| `ACCOUNT` | Chart of Accounts |
| `CUSTOMER` | Customers |
| `VENDOR` | Vendors |
| `PRODUCT` | Products |
| `BANK_ACCOUNT` | Bank Accounts |
| `BANK_TRANSACTION` | Bank Transactions |
| `BANK_RECONCILIATION` | Bank Reconciliations |
| `USER` | Users |
| `ROLE` | Roles |
| `CATEGORY` | Categories |
| `COMPANY` | Company |

## Available Actions

| Action | Description |
|--------|-------------|
| `CREATE` | Entity was created |
| `UPDATE` | Entity was updated |
| `DELETE` | Entity was deleted/deactivated |
| `SEND` | Document was sent (invoice, estimate, PO, SO) |
| `VOID` | Document was voided |
| `RECEIVE` | Bill/PO was received |
| `FULFILL` | Sales Order was fulfilled |
| `CONVERT` | Document was converted (estimate→invoice, PO→bill, SO→invoice) |
| `PAY` | Payment was recorded |
| `APPROVE` | Expense/estimate was approved |
| `REJECT` | Expense/estimate was rejected |
| `CLOSE` | PO/SO was manually closed |
| `POST` | Journal entry was posted |
| `REVERSE` | Journal entry was reversed |
| `DUPLICATE` | Document was duplicated |
| `OPEN` | Credit/debit note was opened |
| `APPLY` | Credit/debit note was applied to invoices/bills |
| `REFUND` | Credit/debit note refund was issued |
| `ADJUST` | Stock adjustment was made |
| `TRANSFER` | Bank transfer was executed |
| `MATCH` | Bank transaction was matched to journal entry |
| `RECONCILE` | Bank reconciliation was completed |
| `PAUSE` | Recurring transaction was paused |
| `RESUME` | Recurring transaction was resumed |
| `CONFIRM` | Sales order was confirmed |
| `EXPIRE` | Estimate was expired |
| `IMPORT` | Bank transactions were imported |
| `INVITE` | User was invited |
| `DEACTIVATE` | User was deactivated |

---

## Frontend UI Suggestions

### 1. Global Audit Log Page (Settings > Audit Trail)
- Table with columns: Date, User, Action, Entity Type, Entity Label, Description
- Filter bar with dropdowns for Entity Type, Action, User, and date range picker
- Search box for free-text search
- Click on entity label → navigate to that document's detail page
- Click on user name → navigate to user's activity log

### 2. Document History Panel
- Add an "Activity" or "History" tab/panel to every document detail page
- Call `GET /audit-trail/entity/:type/:id` with the current document
- Display as a vertical timeline:
  ```
  ● VOIDED — Mar 4, 2026 5:49 AM — by Arjun Singh
    Reason: Customer cancelled

  ● SENT — Mar 4, 2026 5:48 AM — by Arjun Singh

  ● CREATED — Mar 4, 2026 5:48 AM — by Arjun Singh
  ```

### 3. User Activity Log
- On user profile/admin page, show recent actions
- Call `GET /audit-trail/user/:userId`
- Group by date for readability

### 4. Action Badge Colors
Suggested color mapping for action badges:

| Action | Color | Hex |
|--------|-------|-----|
| CREATE | Green | `#10B981` |
| UPDATE | Blue | `#3B82F6` |
| DELETE | Red | `#EF4444` |
| SEND | Purple | `#8B5CF6` |
| VOID | Red | `#EF4444` |
| PAY | Green | `#10B981` |
| APPROVE | Green | `#10B981` |
| REJECT | Orange | `#F59E0B` |
| TRANSFER | Blue | `#3B82F6` |
| RECONCILE | Teal | `#14B8A6` |
| Others | Gray | `#6B7280` |

### 5. Metadata Display
When `metadata` is present, show it as expandable details:
- **VOID**: Show `reason` prominently
- **PAY**: Show `amount`, `paymentMethod`
- **ADJUST**: Show `previousQuantity`, `adjustmentQuantity`, `newQuantity`, `reason`
- **IMPORT**: Show `importedCount`
- **APPLY**: Show `totalApplied`, linked document IDs

### 6. Changes Display
When `changes` is present (field-level diffs), show a diff view:
```
status: SENT → VOID
amountDue: 500 → 0
```

---

## TypeScript Types

```typescript
interface AuditLogItem {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string | null;
  action: AuditAction;
  description: string | null;
  changes: Record<string, { from: any; to: any }> | null;
  metadata: Record<string, any> | null;
  performedAt: string; // ISO date
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuditLogListResponse {
  items: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

type AuditEntityType =
  | 'INVOICE' | 'BILL' | 'EXPENSE' | 'JOURNAL_ENTRY'
  | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'ESTIMATE'
  | 'PURCHASE_ORDER' | 'SALES_ORDER'
  | 'ACCOUNT' | 'CUSTOMER' | 'VENDOR' | 'PRODUCT'
  | 'BANK_ACCOUNT' | 'BANK_TRANSACTION' | 'BANK_RECONCILIATION'
  | 'USER' | 'ROLE' | 'CATEGORY' | 'COMPANY';

type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'SEND' | 'VOID'
  | 'RECEIVE' | 'FULFILL' | 'CONVERT' | 'PAY'
  | 'APPROVE' | 'REJECT' | 'CLOSE' | 'POST'
  | 'REVERSE' | 'DUPLICATE' | 'OPEN' | 'APPLY'
  | 'REFUND' | 'ADJUST' | 'TRANSFER' | 'MATCH'
  | 'RECONCILE' | 'PAUSE' | 'RESUME' | 'CONFIRM'
  | 'EXPIRE' | 'IMPORT' | 'INVITE' | 'DEACTIVATE';
```

---

## Permission Required

| Permission | Who Has It |
|------------|-----------|
| `audit:view` | Company Admin, Standard |

Limited and Reports-only roles do **not** have access to the audit trail.
