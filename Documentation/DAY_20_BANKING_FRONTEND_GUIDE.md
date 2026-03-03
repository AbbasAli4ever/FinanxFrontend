# Day 20 — Banking & Reconciliation Frontend Integration Guide

## Base URL
```
/api/v1/banking/...
```

All endpoints require `Authorization: Bearer <token>`.

---

## 1. List Bank Accounts

**Shows all bank-type accounts with balances and metadata.**

```
GET /api/v1/banking/accounts
```
Permission: `bank_account:view`

### Response
```json
{
  "success": true,
  "message": "Bank accounts retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Business Checking",
      "accountNumber": "1010",
      "detailType": "Checking",
      "currentBalance": 76516.00,
      "institutionName": "Chase Bank",
      "routingNumber": "021000021",
      "accountNumberLast4": "4567",
      "openingBalance": 50000,
      "openingDate": "2026-01-01T00:00:00.000Z",
      "isSystemAccount": true
    },
    {
      "id": "uuid",
      "name": "Business Savings",
      "accountNumber": "1020",
      "detailType": "Savings",
      "currentBalance": 5000.00,
      "institutionName": null,
      "routingNumber": null,
      "accountNumberLast4": null,
      "openingBalance": 0,
      "openingDate": null,
      "isSystemAccount": true
    }
  ]
}
```

---

## 2. Get Single Bank Account

**Account detail with recent transactions and unmatched count.**

```
GET /api/v1/banking/accounts/:id
```
Permission: `bank_account:view`

### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Business Checking",
    "accountNumber": "1010",
    "detailType": "Checking",
    "currentBalance": 76516.00,
    "isSystemAccount": true,
    "detail": {
      "institutionName": "Chase Bank",
      "routingNumber": "021000021",
      "accountNumberLast4": "4567",
      "openingBalance": 50000,
      "openingDate": "2026-01-01T00:00:00.000Z"
    },
    "recentTransactions": [
      {
        "id": "uuid",
        "date": "2026-03-01",
        "description": "Office supplies",
        "amount": -125.50,
        "type": "CHECK",
        "status": "UNMATCHED",
        "matchedJournalEntry": null,
        "reconciled": false
      }
    ],
    "unmatchedCount": 3
  }
}
```

---

## 3. Upsert Bank Detail

**Add or update bank-specific metadata for an account.**

```
POST /api/v1/banking/accounts/:id/details
```
Permission: `bank_account:view`

### Request Body
```json
{
  "institutionName": "Chase Bank",
  "routingNumber": "021000021",
  "accountNumberLast4": "4567",
  "openingBalance": 50000,
  "openingDate": "2026-01-01"
}
```

All fields are optional. Only provided fields are updated.

---

## 4. List Bank Transactions

**Paginated transaction list with filters.**

```
GET /api/v1/banking/accounts/:id/transactions
```
Permission: `bank_account:view`

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | date string | Filter from this date |
| endDate | date string | Filter to this date |
| status | enum | UNMATCHED, MATCHED, EXCLUDED |
| type | enum | DEPOSIT, WITHDRAWAL, TRANSFER, FEE, INTEREST, CHECK, OTHER |
| search | string | Search description, reference, check number |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

### Example
```
GET /api/v1/banking/accounts/:id/transactions?status=UNMATCHED&startDate=2026-02-01&limit=10
```

### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "date": "2026-03-01T00:00:00.000Z",
        "description": "Office supplies from Staples",
        "amount": -125.50,
        "type": "CHECK",
        "checkNumber": "1001",
        "referenceNumber": null,
        "status": "UNMATCHED",
        "matchedJournalEntry": null,
        "reconciled": false,
        "reconciledAt": null,
        "importBatch": null,
        "createdAt": "2026-03-01T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## 5. Create Manual Transaction

```
POST /api/v1/banking/accounts/:id/transactions
```
Permission: `bank_transaction:categorize`

### Request Body
```json
{
  "date": "2026-03-01",
  "description": "Office supplies from Staples",
  "amount": -125.50,
  "type": "WITHDRAWAL",
  "checkNumber": "1001",
  "referenceNumber": "REF-001"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| date | Yes | YYYY-MM-DD |
| description | Yes | Max 500 chars |
| amount | Yes | Positive = deposit, negative = withdrawal |
| type | No | DEPOSIT, WITHDRAWAL, TRANSFER, FEE, INTEREST, CHECK, OTHER (default: OTHER) |
| checkNumber | No | Max 50 chars |
| referenceNumber | No | Max 100 chars |

---

## 6. Import Bank Transactions

**Batch import pre-parsed transactions (frontend handles CSV parsing).**

```
POST /api/v1/banking/accounts/:id/import
```
Permission: `bank_transaction:categorize`

### Request Body
```json
{
  "transactions": [
    {"date": "2026-02-28", "description": "Direct deposit", "amount": 5000.00, "type": "DEPOSIT"},
    {"date": "2026-02-27", "description": "Electric bill", "amount": -245.00, "type": "WITHDRAWAL"},
    {"date": "2026-02-26", "description": "ATM withdrawal", "amount": -200.00},
    {"date": "2026-02-25", "description": "Monthly interest", "amount": 12.50, "type": "INTEREST"}
  ]
}
```

### Response
```json
{
  "success": true,
  "message": "4 transactions imported successfully",
  "data": {
    "imported": 4,
    "importBatch": "uuid-batch-id"
  }
}
```

### Frontend CSV Import Flow
1. User selects CSV file
2. Frontend parses CSV columns (date, description, amount, etc.)
3. Frontend shows preview table for user confirmation
4. Frontend sends parsed array to this endpoint
5. Backend creates all transactions with shared `importBatch` ID

---

## 7. Update Transaction

```
PATCH /api/v1/banking/transactions/:id
```
Permission: `bank_transaction:categorize`

All fields optional. Cannot update reconciled transactions.

```json
{
  "description": "Updated description",
  "type": "CHECK",
  "checkNumber": "1001"
}
```

---

## 8. Delete Transaction

```
DELETE /api/v1/banking/transactions/:id
```
Permission: `bank_transaction:categorize`

Cannot delete reconciled transactions. Returns 400 if attempted.

---

## 9. Match Transaction to Journal Entry

**Links a bank transaction to an existing posted journal entry.**

```
POST /api/v1/banking/transactions/:id/match
```
Permission: `bank_transaction:categorize`

### Request Body
```json
{
  "journalEntryId": "uuid-of-posted-je"
}
```

### Validation
- Transaction must be UNMATCHED
- Journal entry must be POSTED
- JE must have at least one line referencing the same bank account

### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "MATCHED",
    "matchedJournalEntry": {
      "id": "uuid",
      "entryNumber": "JE-0024",
      "description": "Invoice payment received"
    }
  }
}
```

---

## 10. Unmatch Transaction

```
POST /api/v1/banking/transactions/:id/unmatch
```
Permission: `bank_transaction:categorize`

Reverts MATCHED → UNMATCHED. Cannot unmatch reconciled transactions.

---

## 11. Start Reconciliation

```
POST /api/v1/banking/accounts/:id/reconcile/start
```
Permission: `bank_account:reconcile`

### Request Body
```json
{
  "statementDate": "2026-03-01",
  "statementBalance": 4442.00
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "recon-uuid",
    "bankAccountId": "uuid",
    "statementDate": "2026-03-01",
    "statementBalance": 4442.00,
    "openingBalance": 0,
    "status": "IN_PROGRESS",
    "unreconciledTransactions": [
      {
        "id": "txn-uuid",
        "date": "2026-02-25",
        "description": "Monthly interest",
        "amount": 12.50,
        "type": "INTEREST",
        "status": "UNMATCHED",
        "reconciled": false
      }
    ]
  }
}
```

### Notes
- Only one IN_PROGRESS reconciliation per bank account allowed
- Opening balance comes from last completed reconciliation (or 0 for first)

---

## 12. Get Reconciliation Details

```
GET /api/v1/banking/reconciliations/:id
```
Permission: `bank_account:reconcile`

### Response
```json
{
  "success": true,
  "data": {
    "id": "recon-uuid",
    "bankAccount": {
      "id": "uuid",
      "name": "Business Checking",
      "accountNumber": "1010",
      "systemBalance": 76516.00
    },
    "statementDate": "2026-03-01",
    "statementBalance": 4442.00,
    "openingBalance": 0,
    "clearedBalance": 0,
    "difference": 4442.00,
    "status": "IN_PROGRESS",
    "reconciledBy": { "id": "uuid", "firstName": "Arjun", "lastName": "Singh" },
    "completedAt": null,
    "unreconciledTransactions": [...],
    "clearedTransactions": [...]
  }
}
```

### Key Fields
- `clearedBalance` = openingBalance + sum of cleared transactions
- `difference` = statementBalance - clearedBalance (must be 0 to complete)
- `unreconciledTransactions` = not yet cleared
- `clearedTransactions` = already cleared in this session

---

## 13. Complete Reconciliation

```
POST /api/v1/banking/reconciliations/:id/complete
```
Permission: `bank_account:reconcile`

### Request Body
```json
{
  "clearedTransactionIds": [
    "txn-uuid-1",
    "txn-uuid-2",
    "txn-uuid-3"
  ]
}
```

### Validation
- All transaction IDs must belong to the same bank account
- No already-reconciled transactions allowed
- `openingBalance + sum(cleared amounts) == statementBalance` (tolerance: 0.01)

### Response
```json
{
  "success": true,
  "data": {
    "id": "recon-uuid",
    "status": "COMPLETED",
    "clearedCount": 5,
    "statementBalance": 4442.00,
    "message": "Reconciliation completed successfully"
  }
}
```

---

## 14. Transfer Between Bank Accounts

```
POST /api/v1/banking/accounts/:id/transfer
```
Permission: `bank_account:reconcile`

### Request Body
```json
{
  "destinationAccountId": "savings-account-uuid",
  "amount": 5000.00,
  "date": "2026-03-01",
  "description": "Monthly savings transfer",
  "referenceNumber": "TRF-001"
}
```

### Response
```json
{
  "success": true,
  "message": "Transfer of 5000 completed successfully",
  "data": {
    "sourceAccount": {
      "id": "uuid",
      "name": "Business Checking",
      "newBalance": 76516.00
    },
    "destinationAccount": {
      "id": "uuid",
      "name": "Business Savings",
      "newBalance": 5000.00
    },
    "amount": 5000,
    "date": "2026-03-01",
    "description": "Monthly savings transfer"
  }
}
```

### Notes
- Creates a journal entry automatically (debit destination, credit source)
- Both account balances update instantly
- Source and destination must be different Bank accounts

---

## Transaction Types Reference

| Type | Description | Amount Sign |
|------|-------------|-------------|
| DEPOSIT | Money received | Positive (+) |
| WITHDRAWAL | Money paid out | Negative (-) |
| TRANSFER | Between accounts | Either |
| FEE | Bank fee | Negative (-) |
| INTEREST | Interest earned | Positive (+) |
| CHECK | Check payment | Negative (-) |
| OTHER | Uncategorized | Either |

## Transaction Statuses

| Status | Description |
|--------|-------------|
| UNMATCHED | No journal entry linked |
| MATCHED | Linked to a posted journal entry |
| EXCLUDED | Intentionally excluded from reconciliation |

## Reconciliation Statuses

| Status | Description |
|--------|-------------|
| IN_PROGRESS | Active session, transactions being cleared |
| COMPLETED | All items cleared, difference = 0 |
| CANCELLED | Session abandoned |

---

## Suggested Frontend Pages

### 1. Banking Dashboard
- **Account cards**: Name, institution, balance, unmatched count
- **Quick actions**: Transfer, Import, Reconcile
- **Recent activity**: Last 10 transactions across all accounts

### 2. Bank Account Detail
- **Header**: Account info, balance, institution logo
- **Tabs**: Transactions | Reconciliation History
- **Transaction list**: Filterable table with status badges (UNMATCHED=yellow, MATCHED=green)
- **Match modal**: Select from JEs that reference this account

### 3. Import Wizard
- **Step 1**: Select CSV file
- **Step 2**: Map columns (date, description, amount)
- **Step 3**: Preview parsed transactions
- **Step 4**: Confirm import → POST /import

### 4. Reconciliation Page
- **Header**: Statement date, statement balance, opening balance, difference
- **Two-column layout**: Uncleared items (left) | Cleared items (right)
- **Checkbox per transaction**: Move between uncleared/cleared
- **Running difference**: Updates as items are checked/unchecked
- **Complete button**: Enabled only when difference = 0

### 5. Transfer Form
- **Source account**: Dropdown of bank accounts
- **Destination account**: Dropdown (excludes source)
- **Amount**: Number input
- **Date**: Date picker
- **Description**: Optional text
- **Submit**: Creates transfer + shows updated balances

---

## TypeScript Interfaces

```typescript
interface BankAccount {
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

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'INTEREST' | 'CHECK' | 'OTHER';
  checkNumber: string | null;
  referenceNumber: string | null;
  status: 'UNMATCHED' | 'MATCHED' | 'EXCLUDED';
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

interface BankReconciliation {
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
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reconciledBy: { id: string; firstName: string; lastName: string } | null;
  completedAt: string | null;
  unreconciledTransactions: BankTransaction[];
  clearedTransactions: BankTransaction[];
}

interface TransferResult {
  sourceAccount: { id: string; name: string; newBalance: number };
  destinationAccount: { id: string; name: string; newBalance: number };
  amount: number;
  date: string;
  description: string;
}
```
