# Journal Entry Module

**Module:** Journal Entry (Accounting Core)
**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Phase 1 - Core Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [Database Schema](#3-database-schema)
4. [Double-Entry Mechanics](#4-double-entry-mechanics)
5. [Data Flow](#5-data-flow)
6. [API Design](#6-api-design)
7. [Business Logic](#7-business-logic)
8. [Validation Rules](#8-validation-rules)
9. [Edge Cases](#9-edge-cases)
10. [Related Modules](#10-related-modules)

---

## 1. Overview

### 1.1 Purpose

The Journal Entry module is the **heart of the accounting system**. Every financial transaction in the ERP ultimately results in journal entries that record debits and credits to accounts. This module handles both auto-generated entries (from invoices, payments) and manual journal entries.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Record Transactions** | Create balanced debit/credit entries |
| **Maintain Ledger** | Update account balances |
| **Audit Trail** | Immutable record of all postings |
| **Source Tracking** | Link entries to source documents |
| **Period Control** | Enforce fiscal period rules |

### 1.3 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Immutability** | Posted entries cannot be modified |
| **Balance Enforcement** | Debits must equal credits |
| **Source Linkage** | Tracks originating document |
| **Reversibility** | Corrections via reversing entries |

### 1.4 Journal Entry Concept

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     JOURNAL ENTRY STRUCTURE                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │ JOURNAL ENTRY HEADER                                             │
    │─────────────────────────────────────────────────────────────────│
    │ Entry Number:    JE-2026-00001                                   │
    │ Entry Date:      2026-01-15                                      │
    │ Description:     Invoice INV-000001 - Acme Corporation           │
    │ Source:          INVOICE (INV-000001)                            │
    │ Fiscal Period:   January 2026                                    │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │ JOURNAL LINES                                                    │
    │─────────────────────────────────────────────────────────────────│
    │ #  Account              Description          Debit      Credit  │
    │─────────────────────────────────────────────────────────────────│
    │ 1  1130 - Accts Recv    Invoice INV-000001   6,082.50           │
    │ 2  4100 - Sales Revenue Revenue              -          5,600.00 │
    │ 3  2120 - Sales Tax     Tax                  -            482.50 │
    │─────────────────────────────────────────────────────────────────│
    │                         TOTALS:              6,082.50   6,082.50 │
    │                                              ═══════════════════ │
    │                         Balanced: ✓ YES                          │
    └─────────────────────────────────────────────────────────────────┘
```

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Entries belong to org | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |
| Chart of Accounts | Account postings | [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |
| Fiscal Period | Period validation | [FISCAL_PERIOD_MODULE.md](../fiscal-period/FISCAL_PERIOD_MODULE.md) |
| RBAC | User permissions | [RBAC_MODULE.md](../rbac/RBAC_MODULE.md) |

### 2.2 Modules That Depend On This

| Module | Relationship | Link |
|--------|--------------|------|
| Invoice | Auto-generates entries on post | [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md) |
| Payment | Auto-generates entries | Phase 2 |
| Reports | Reads entries for reports | Phase 3 |

### 2.3 Dependency Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Organization   │     │ Chart of Accounts│     │  Fiscal Period   │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Journal Entry   │
                         │    (Header)      │
                         └────────┬─────────┘
                                  │
                                  │ 1:N
                                  ▼
                         ┌──────────────────┐
                         │  Journal Lines   │
                         │ (Debit/Credit)   │
                         └────────┬─────────┘
                                  │
                                  │ Updates
                                  ▼
                         ┌──────────────────┐
                         │ Account Balances │
                         └──────────────────┘

Source Documents:
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Invoice  │     │ Payment  │     │  Manual  │
│          │     │ (Ph. 2)  │     │          │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
                      │ source_type, source_id
                      ▼
              ┌──────────────────┐
              │  Journal Entry   │
              └──────────────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          JOURNAL ENTRY SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   organizations  │     │ chart_of_accounts│     │  fiscal_periods  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │ 1:N                    │ 1:N                    │ 1:N
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                       journal_entries                             │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ organization_id       UUID NOT NULL FK → organizations            │
│ entry_number          VARCHAR(50) NOT NULL UNIQUE per org         │
│ entry_date            DATE NOT NULL                               │
│ description           TEXT NOT NULL                               │
│ reference             VARCHAR(100)                                │
│ source_type           ENUM('MANUAL','INVOICE','INVOICE_VOID',...)│
│ source_id             UUID (reference to source document)         │
│ fiscal_period_id      UUID FK → fiscal_periods                    │
│ is_posted             BOOLEAN DEFAULT true                        │
│ is_reversed           BOOLEAN DEFAULT false                       │
│ reversed_by_id        UUID FK → journal_entries                   │
│ reverses_id           UUID FK → journal_entries                   │
│ total_debit           DECIMAL(18,2) NOT NULL                      │
│ total_credit          DECIMAL(18,2) NOT NULL                      │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
│ created_by            UUID FK → users                             │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   │ 1:N
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                        journal_lines                              │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ journal_entry_id      UUID NOT NULL FK → journal_entries          │
│ line_number           INTEGER NOT NULL                            │
│ account_id            UUID NOT NULL FK → chart_of_accounts        │
│ description           TEXT                                        │
│ debit_amount          DECIMAL(18,2) DEFAULT 0                     │
│ credit_amount         DECIMAL(18,2) DEFAULT 0                     │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Journal Entries Table Definition

```sql
-- Source type enum
CREATE TYPE journal_source_type AS ENUM (
    'MANUAL',           -- Manual journal entry
    'INVOICE',          -- From invoice posting
    'INVOICE_VOID',     -- From invoice void
    'PAYMENT',          -- From payment posting (Phase 2)
    'PAYMENT_VOID',     -- From payment void (Phase 2)
    'CREDIT_NOTE',      -- From credit note (Phase 2)
    'ADJUSTMENT',       -- Period-end adjustments
    'OPENING',          -- Opening balances
    'CLOSING'           -- Year-end closing
);

CREATE TABLE journal_entries (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Entry Identity
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,

    -- Description
    description TEXT NOT NULL,
    reference VARCHAR(100),  -- External reference number

    -- Source Tracking
    source_type journal_source_type NOT NULL DEFAULT 'MANUAL',
    source_id UUID,  -- References source document (invoice.id, payment.id, etc.)

    -- Fiscal Period
    fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),

    -- Status
    is_posted BOOLEAN DEFAULT true,
    is_reversed BOOLEAN DEFAULT false,

    -- Reversal Tracking
    reversed_by_id UUID REFERENCES journal_entries(id),  -- Entry that reversed this
    reverses_id UUID REFERENCES journal_entries(id),     -- Entry this reverses

    -- Totals (denormalized for validation)
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_entry_number UNIQUE(organization_id, entry_number),
    CONSTRAINT chk_balanced CHECK (total_debit = total_credit),
    CONSTRAINT chk_positive_totals CHECK (total_debit >= 0 AND total_credit >= 0)
);

-- Indexes
CREATE INDEX idx_journal_entries_org ON journal_entries(organization_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(organization_id, entry_date);
CREATE INDEX idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX idx_journal_entries_source ON journal_entries(source_type, source_id);
CREATE INDEX idx_journal_entries_period ON journal_entries(fiscal_period_id);

-- Prevent modification of posted entries
CREATE OR REPLACE FUNCTION prevent_journal_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Allow only specific fields to be updated
        IF OLD.is_posted AND (
            OLD.entry_date != NEW.entry_date OR
            OLD.description != NEW.description OR
            OLD.total_debit != NEW.total_debit OR
            OLD.total_credit != NEW.total_credit
        ) THEN
            RAISE EXCEPTION 'Posted journal entries cannot be modified';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.is_posted THEN
            RAISE EXCEPTION 'Posted journal entries cannot be deleted';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_journal_modification
    BEFORE UPDATE OR DELETE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_journal_entry_modification();
```

### 3.3 Journal Lines Table Definition

```sql
CREATE TABLE journal_lines (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent Entry
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,

    -- Line Details
    line_number INTEGER NOT NULL,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    description TEXT,

    -- Amounts (only one should be non-zero)
    debit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_single_entry CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (debit_amount = 0 AND credit_amount > 0) OR
        (debit_amount = 0 AND credit_amount = 0)
    ),
    CONSTRAINT chk_non_negative CHECK (debit_amount >= 0 AND credit_amount >= 0)
);

-- Indexes
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- Trigger to update account balance on line insert
CREATE OR REPLACE FUNCTION update_account_balance_on_journal_line()
RETURNS TRIGGER AS $$
DECLARE
    v_account_type account_type;
    v_delta DECIMAL(18,2);
BEGIN
    -- Only process for posted entries
    IF NOT EXISTS (
        SELECT 1 FROM journal_entries
        WHERE id = NEW.journal_entry_id AND is_posted = true
    ) THEN
        RETURN NEW;
    END IF;

    -- Get account type
    SELECT account_type INTO v_account_type
    FROM chart_of_accounts
    WHERE id = NEW.account_id;

    -- Calculate balance change based on account type
    -- ASSET, EXPENSE: Normal debit balance (debit increases, credit decreases)
    -- LIABILITY, EQUITY, REVENUE: Normal credit balance (credit increases, debit decreases)
    IF v_account_type IN ('ASSET', 'EXPENSE') THEN
        v_delta := NEW.debit_amount - NEW.credit_amount;
    ELSE
        v_delta := NEW.credit_amount - NEW.debit_amount;
    END IF;

    -- Update account balance
    UPDATE chart_of_accounts
    SET current_balance = current_balance + v_delta,
        balance_updated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_account_balance
    AFTER INSERT ON journal_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance_on_journal_line();
```

### 3.4 Journal Entry Number Sequence

```sql
CREATE TABLE journal_entry_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    prefix VARCHAR(10) DEFAULT 'JE',
    current_number BIGINT NOT NULL DEFAULT 0,
    fiscal_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, fiscal_year)
);

CREATE OR REPLACE FUNCTION get_next_journal_entry_number(
    p_organization_id UUID,
    p_fiscal_year INTEGER DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_next_number BIGINT;
    v_result VARCHAR(50);
    v_year INTEGER;
BEGIN
    v_year := COALESCE(p_fiscal_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

    UPDATE journal_entry_sequences
    SET current_number = current_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = p_organization_id
      AND (fiscal_year = v_year OR (fiscal_year IS NULL AND p_fiscal_year IS NULL))
    RETURNING prefix, current_number
    INTO v_prefix, v_next_number;

    IF v_next_number IS NULL THEN
        INSERT INTO journal_entry_sequences (organization_id, fiscal_year, current_number)
        VALUES (p_organization_id, v_year, 1)
        RETURNING prefix, current_number
        INTO v_prefix, v_next_number;
    END IF;

    -- Format: JE-2026-00001
    v_result := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 5, '0');

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Double-Entry Mechanics

### 4.1 Debit and Credit Rules

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEBIT/CREDIT IMPACT BY ACCOUNT TYPE                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┬────────────────────┬────────────────────┬─────────────┐
│ Account Type    │ Normal Balance     │ Debit              │ Credit      │
├─────────────────┼────────────────────┼────────────────────┼─────────────┤
│ ASSET           │ Debit              │ Increase (+)       │ Decrease (-)│
│ LIABILITY       │ Credit             │ Decrease (-)       │ Increase (+)│
│ EQUITY          │ Credit             │ Decrease (-)       │ Increase (+)│
│ REVENUE         │ Credit             │ Decrease (-)       │ Increase (+)│
│ EXPENSE         │ Debit              │ Increase (+)       │ Decrease (-)│
└─────────────────┴────────────────────┴────────────────────┴─────────────┘
```

### 4.2 Common Transaction Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│ INVOICE POSTING (Sale on Account)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ DR  Accounts Receivable (Asset)      $1,082.50  ← Increase asset        │
│ CR  Sales Revenue (Revenue)          $1,000.00  ← Increase revenue      │
│ CR  Sales Tax Payable (Liability)    $   82.50  ← Increase liability    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ INVOICE VOID (Reverse Sale)                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ DR  Sales Revenue (Revenue)          $1,000.00  ← Decrease revenue      │
│ DR  Sales Tax Payable (Liability)    $   82.50  ← Decrease liability    │
│ CR  Accounts Receivable (Asset)      $1,082.50  ← Decrease asset        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PAYMENT RECEIVED (Phase 2)                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ DR  Bank (Asset)                     $1,082.50  ← Increase asset        │
│ CR  Accounts Receivable (Asset)      $1,082.50  ← Decrease asset        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ MANUAL ENTRY (Record Expense)                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ DR  Rent Expense (Expense)           $2,500.00  ← Increase expense      │
│ CR  Bank (Asset)                     $2,500.00  ← Decrease asset        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow

### 5.1 Manual Journal Entry Creation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  MANUAL JOURNAL ENTRY FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    User                          Server                        Database
      │                             │                              │
      │  POST /journal-entries      │                              │
      │  {date, description, lines} │                              │
      │────────────────────────────►│                              │
      │                             │                              │
      │                             │  Validate fiscal period      │
      │                             │  is open                     │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Validate all accounts       │
      │                             │  exist and allow posting     │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Validate debits = credits   │
      │                             │                              │
      │                             │  Generate entry number       │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  BEGIN TRANSACTION           │
      │                             │                              │
      │                             │  Create journal_entry        │
      │                             │─────────────────────────────►│
      │                             │                              │
      │                             │  Create journal_lines        │
      │                             │  (triggers balance updates)  │
      │                             │─────────────────────────────►│
      │                             │                              │
      │                             │  COMMIT                      │
      │                             │                              │
      │  {journal entry object}     │                              │
      │◄────────────────────────────│                              │
      │                             │                              │
```

### 5.2 Auto-Generated Entry (from Invoice)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  AUTO-GENERATED ENTRY FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    Invoice Post                  Journal Service              Database
         │                             │                           │
         │  Create entry for invoice   │                           │
         │────────────────────────────►│                           │
         │  {                          │                           │
         │    source_type: 'INVOICE',  │                           │
         │    source_id: invoice.id,   │                           │
         │    ...                      │                           │
         │  }                          │                           │
         │                             │                           │
         │                             │  Build lines from         │
         │                             │  invoice data:            │
         │                             │  - AR account (from       │
         │                             │    customer)              │
         │                             │  - Revenue accounts       │
         │                             │    (from lines)           │
         │                             │  - Tax accounts           │
         │                             │    (from tax codes)       │
         │                             │                           │
         │                             │  Create entry             │
         │                             │─────────────────────────► │
         │                             │                           │
         │◄────────────────────────────│                           │
         │  {journal_entry_id}         │                           │
         │                             │                           │
```

---

## 6. API Design

### 6.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/journal-entries` | `journal:read` | List entries |
| POST | `/api/v1/journal-entries` | `journal:create` | Create entry |
| GET | `/api/v1/journal-entries/{id}` | `journal:read` | Get entry |
| POST | `/api/v1/journal-entries/{id}/reverse` | `journal:reverse` | Reverse entry |
| GET | `/api/v1/journal-entries/validate` | `journal:create` | Validate entry |

### 6.2 List Journal Entries

**Endpoint:** `GET /api/v1/journal-entries`
**Permission:** `journal:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `per_page` | integer | Items per page |
| `date_from` | date | Filter from date |
| `date_to` | date | Filter to date |
| `source_type` | string | Filter by source type |
| `account_id` | uuid | Filter by account |
| `search` | string | Search description/reference |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "entry_number": "JE-2026-00001",
            "entry_date": "2026-01-15",
            "description": "Invoice INV-000001 - Acme Corporation",
            "reference": "INV-000001",
            "source_type": "INVOICE",
            "source_id": "uuid",
            "fiscal_period": {
                "id": "uuid",
                "period_name": "January 2026"
            },
            "is_posted": true,
            "is_reversed": false,
            "total_debit": 6082.50,
            "total_credit": 6082.50,
            "line_count": 3,
            "created_at": "2026-01-15T10:30:00Z",
            "created_by": {
                "id": "uuid",
                "name": "John Accountant"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 150,
        "total_pages": 8
    }
}
```

### 6.3 Get Journal Entry Detail

**Endpoint:** `GET /api/v1/journal-entries/{entry_id}`
**Permission:** `journal:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "entry_number": "JE-2026-00001",
        "entry_date": "2026-01-15",
        "description": "Invoice INV-000001 - Acme Corporation",
        "reference": "INV-000001",
        "source_type": "INVOICE",
        "source_id": "uuid",
        "source_document": {
            "type": "INVOICE",
            "number": "INV-000001",
            "url": "/api/v1/invoices/uuid"
        },
        "fiscal_period": {
            "id": "uuid",
            "period_name": "January 2026",
            "is_closed": false
        },
        "is_posted": true,
        "is_reversed": false,
        "reversed_by": null,
        "reverses": null,
        "total_debit": 6082.50,
        "total_credit": 6082.50,
        "lines": [
            {
                "id": "uuid",
                "line_number": 1,
                "account": {
                    "id": "uuid",
                    "code": "1130",
                    "name": "Accounts Receivable",
                    "type": "ASSET"
                },
                "description": "Invoice INV-000001",
                "debit_amount": 6082.50,
                "credit_amount": 0
            },
            {
                "id": "uuid",
                "line_number": 2,
                "account": {
                    "id": "uuid",
                    "code": "4100",
                    "name": "Sales Revenue",
                    "type": "REVENUE"
                },
                "description": "Revenue - INV-000001",
                "debit_amount": 0,
                "credit_amount": 5600.00
            },
            {
                "id": "uuid",
                "line_number": 3,
                "account": {
                    "id": "uuid",
                    "code": "2120",
                    "name": "Sales Tax Payable",
                    "type": "LIABILITY"
                },
                "description": "Tax - INV-000001",
                "debit_amount": 0,
                "credit_amount": 482.50
            }
        ],
        "created_at": "2026-01-15T10:30:00Z",
        "created_by": {
            "id": "uuid",
            "name": "John Accountant"
        }
    }
}
```

### 6.4 Create Manual Journal Entry

**Endpoint:** `POST /api/v1/journal-entries`
**Permission:** `journal:create`

**Request Body:**
```json
{
    "entry_date": "2026-01-20",
    "description": "Monthly rent expense",
    "reference": "RENT-JAN-2026",
    "lines": [
        {
            "account_id": "uuid-rent-expense",
            "description": "Office rent January 2026",
            "debit_amount": 2500.00,
            "credit_amount": 0
        },
        {
            "account_id": "uuid-bank-account",
            "description": "Payment for rent",
            "debit_amount": 0,
            "credit_amount": 2500.00
        }
    ]
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "entry_number": "JE-2026-00005",
        "entry_date": "2026-01-20",
        "description": "Monthly rent expense",
        "reference": "RENT-JAN-2026",
        "source_type": "MANUAL",
        "source_id": null,
        "fiscal_period": {
            "id": "uuid",
            "period_name": "January 2026"
        },
        "is_posted": true,
        "total_debit": 2500.00,
        "total_credit": 2500.00,
        "lines": [
            {
                "id": "uuid",
                "line_number": 1,
                "account": {
                    "id": "uuid",
                    "code": "6200",
                    "name": "Rent Expense"
                },
                "debit_amount": 2500.00,
                "credit_amount": 0
            },
            {
                "id": "uuid",
                "line_number": 2,
                "account": {
                    "id": "uuid",
                    "code": "1120",
                    "name": "Bank - Operating"
                },
                "debit_amount": 0,
                "credit_amount": 2500.00
            }
        ],
        "created_at": "2026-01-20T09:00:00Z"
    }
}
```

### 6.5 Reverse Journal Entry

**Endpoint:** `POST /api/v1/journal-entries/{entry_id}/reverse`
**Permission:** `journal:reverse`

**Request Body:**
```json
{
    "reversal_date": "2026-01-25",
    "reason": "Incorrect amount posted"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "original_entry": {
            "id": "uuid-original",
            "entry_number": "JE-2026-00005",
            "is_reversed": true,
            "reversed_by_id": "uuid-reversing"
        },
        "reversing_entry": {
            "id": "uuid-reversing",
            "entry_number": "JE-2026-00010",
            "entry_date": "2026-01-25",
            "description": "REVERSAL: Monthly rent expense - Incorrect amount posted",
            "source_type": "MANUAL",
            "reverses_id": "uuid-original",
            "total_debit": 2500.00,
            "total_credit": 2500.00,
            "lines": [
                {
                    "account": {"code": "6200", "name": "Rent Expense"},
                    "debit_amount": 0,
                    "credit_amount": 2500.00
                },
                {
                    "account": {"code": "1120", "name": "Bank - Operating"},
                    "debit_amount": 2500.00,
                    "credit_amount": 0
                }
            ]
        }
    }
}
```

### 6.6 Validate Entry (Preview)

**Endpoint:** `POST /api/v1/journal-entries/validate`
**Permission:** `journal:create`

**Request Body:** Same as Create

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "is_valid": true,
        "warnings": [],
        "preview": {
            "total_debit": 2500.00,
            "total_credit": 2500.00,
            "is_balanced": true,
            "fiscal_period": "January 2026",
            "period_is_open": true,
            "accounts_valid": true
        }
    }
}
```

### 6.7 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ENTRY_NOT_FOUND` | 404 | Journal entry not found |
| `ENTRY_NOT_BALANCED` | 400 | Debits do not equal credits |
| `PERIOD_CLOSED` | 400 | Fiscal period is closed |
| `PERIOD_NOT_FOUND` | 400 | No fiscal period for date |
| `ACCOUNT_NOT_FOUND` | 400 | Account does not exist |
| `ACCOUNT_NO_POSTING` | 400 | Account doesn't allow posting |
| `ENTRY_ALREADY_REVERSED` | 400 | Entry already reversed |
| `CANNOT_MODIFY_POSTED` | 400 | Posted entry cannot be modified |

---

## 7. Business Logic

### 7.1 Create Manual Journal Entry

```pseudocode
FUNCTION create_journal_entry(
    data: JournalEntryCreateDTO,
    user: User
) -> JournalEntry

    // 1. Validate entry date and fiscal period
    validation = validate_transaction_date(user.organization_id, data.entry_date)
    IF NOT validation.valid THEN
        THROW BusinessError(validation.message)
    END IF

    // 2. Validate all lines have valid accounts
    FOR EACH line IN data.lines
        account = ChartOfAccountsRepository.find(line.account_id)
        IF account IS NULL THEN
            THROW NotFoundError("Account not found: " + line.account_id)
        END IF
        IF account.organization_id != user.organization_id THEN
            THROW ForbiddenError("Account belongs to different organization")
        END IF
        IF NOT account.allows_direct_posting THEN
            THROW ValidationError("Account " + account.account_code + " does not allow direct posting")
        END IF
        IF NOT account.is_active THEN
            THROW ValidationError("Account " + account.account_code + " is inactive")
        END IF
    END FOR

    // 3. Validate entry is balanced
    total_debits = SUM(line.debit_amount FOR line IN data.lines)
    total_credits = SUM(line.credit_amount FOR line IN data.lines)

    IF total_debits != total_credits THEN
        THROW ValidationError(
            "Entry is not balanced. Debits: " + total_debits +
            ", Credits: " + total_credits
        )
    END IF

    IF total_debits == 0 THEN
        THROW ValidationError("Entry cannot have zero amounts")
    END IF

    // 4. Generate entry number
    entry_number = get_next_journal_entry_number(
        user.organization_id,
        YEAR(data.entry_date)
    )

    BEGIN TRANSACTION

        // 5. Create journal entry header
        entry = JournalEntry.create({
            organization_id: user.organization_id,
            entry_number: entry_number,
            entry_date: data.entry_date,
            description: data.description,
            reference: data.reference,
            source_type: 'MANUAL',
            source_id: null,
            fiscal_period_id: validation.period.id,
            is_posted: true,
            total_debit: total_debits,
            total_credit: total_credits,
            created_by: user.id
        })

        // 6. Create journal lines
        line_number = 1
        FOR EACH line IN data.lines
            JournalLine.create({
                journal_entry_id: entry.id,
                line_number: line_number,
                account_id: line.account_id,
                description: line.description,
                debit_amount: line.debit_amount ?? 0,
                credit_amount: line.credit_amount ?? 0
            })
            line_number = line_number + 1
        END FOR

        // Account balances are updated by trigger

    COMMIT TRANSACTION

    // 7. Audit log
    AuditLog.record('journal_entries', entry.id, 'INSERT', null, entry)

    RETURN JournalEntryRepository.find_with_lines(entry.id)

END FUNCTION
```

### 7.2 Reverse Journal Entry

```pseudocode
FUNCTION reverse_journal_entry(
    entry_id: UUID,
    reversal_date: Date,
    reason: String,
    user: User
) -> ReversalResult

    // 1. Get original entry
    original = JournalEntryRepository.find_with_lines(entry_id)

    IF original IS NULL THEN
        THROW NotFoundError("Journal entry not found")
    END IF

    // 2. Validate can reverse
    IF original.is_reversed THEN
        THROW BusinessError("Entry has already been reversed")
    END IF

    IF original.source_type != 'MANUAL' THEN
        THROW BusinessError(
            "Cannot reverse system-generated entry. " +
            "Reverse the source document instead."
        )
    END IF

    // 3. Validate reversal date
    validation = validate_transaction_date(original.organization_id, reversal_date)
    IF NOT validation.valid THEN
        THROW BusinessError(validation.message)
    END IF

    // 4. Generate reversal entry number
    reversal_number = get_next_journal_entry_number(
        original.organization_id,
        YEAR(reversal_date)
    )

    BEGIN TRANSACTION

        // 5. Create reversing entry (swap debits and credits)
        reversing = JournalEntry.create({
            organization_id: original.organization_id,
            entry_number: reversal_number,
            entry_date: reversal_date,
            description: "REVERSAL: " + original.description + " - " + reason,
            reference: "REV-" + original.entry_number,
            source_type: 'MANUAL',
            source_id: null,
            fiscal_period_id: validation.period.id,
            is_posted: true,
            reverses_id: original.id,
            total_debit: original.total_credit,   // Swapped
            total_credit: original.total_debit,   // Swapped
            created_by: user.id
        })

        // 6. Create reversed lines (swap amounts)
        line_number = 1
        FOR EACH original_line IN original.lines
            JournalLine.create({
                journal_entry_id: reversing.id,
                line_number: line_number,
                account_id: original_line.account_id,
                description: "REVERSAL: " + original_line.description,
                debit_amount: original_line.credit_amount,   // Swapped
                credit_amount: original_line.debit_amount    // Swapped
            })
            line_number = line_number + 1
        END FOR

        // 7. Mark original as reversed
        JournalEntryRepository.update(original.id, {
            is_reversed: true,
            reversed_by_id: reversing.id
        })

    COMMIT TRANSACTION

    RETURN {
        original_entry: JournalEntryRepository.find(original.id),
        reversing_entry: JournalEntryRepository.find_with_lines(reversing.id)
    }

END FUNCTION
```

### 7.3 Create Entry from Invoice (Internal)

```pseudocode
FUNCTION create_invoice_journal_entry(
    invoice: Invoice,
    user: User
) -> JournalEntry

    // Get customer's AR account
    customer = CustomerRepository.find(invoice.customer_id)
    ar_account = ChartOfAccountsRepository.find(customer.ar_account_id)

    // Collect revenue and tax lines
    revenue_lines = []
    tax_lines = []

    FOR EACH line IN invoice.lines
        // Aggregate revenue by account
        revenue_account = ChartOfAccountsRepository.find(line.revenue_account_id)
        existing_rev = revenue_lines.find(r => r.account_id == line.revenue_account_id)

        IF existing_rev THEN
            existing_rev.amount = existing_rev.amount + line.line_total
        ELSE
            revenue_lines.append({
                account_id: line.revenue_account_id,
                account: revenue_account,
                amount: line.line_total
            })
        END IF

        // Aggregate tax by account
        IF line.tax_code_id IS NOT NULL AND line.tax_amount > 0 THEN
            tax_code = TaxCodeRepository.find(line.tax_code_id)
            tax_account = ChartOfAccountsRepository.find(tax_code.tax_account_id)

            existing_tax = tax_lines.find(t => t.account_id == tax_code.tax_account_id)
            IF existing_tax THEN
                existing_tax.amount = existing_tax.amount + line.tax_amount
            ELSE
                tax_lines.append({
                    account_id: tax_code.tax_account_id,
                    account: tax_account,
                    amount: line.tax_amount
                })
            END IF
        END IF
    END FOR

    // Build journal lines array
    lines = []

    // DR: Accounts Receivable (total)
    lines.append({
        account_id: ar_account.id,
        description: "Invoice " + invoice.invoice_number,
        debit_amount: invoice.total_amount,
        credit_amount: 0
    })

    // CR: Revenue accounts
    FOR EACH rev IN revenue_lines
        lines.append({
            account_id: rev.account_id,
            description: "Revenue - " + invoice.invoice_number,
            debit_amount: 0,
            credit_amount: rev.amount
        })
    END FOR

    // CR: Tax accounts
    FOR EACH tax IN tax_lines
        lines.append({
            account_id: tax.account_id,
            description: "Tax - " + invoice.invoice_number,
            debit_amount: 0,
            credit_amount: tax.amount
        })
    END FOR

    // Create the entry (using internal function, not manual)
    entry = create_system_journal_entry({
        organization_id: invoice.organization_id,
        entry_date: invoice.invoice_date,
        description: "Invoice " + invoice.invoice_number + " - " + customer.name,
        reference: invoice.invoice_number,
        source_type: 'INVOICE',
        source_id: invoice.id,
        lines: lines
    }, user)

    RETURN entry

END FUNCTION
```

---

## 8. Validation Rules

### 8.1 Entry Header Validations

| Field | Rules | Error |
|-------|-------|-------|
| `entry_date` | Required, valid date, in open period | `Invalid date` |
| `description` | Required, 1-500 chars | `Description required` |
| `lines` | Required, at least 2 lines | `Minimum 2 lines required` |

### 8.2 Entry Line Validations

| Field | Rules | Error |
|-------|-------|-------|
| `account_id` | Required, must exist, must allow posting | `Invalid account` |
| `debit_amount` | >= 0 | `Invalid amount` |
| `credit_amount` | >= 0 | `Invalid amount` |
| (per line) | Either debit or credit, not both | `Single entry per line` |

### 8.3 Balance Rule

**CRITICAL:** Total debits MUST equal total credits

```
SUM(line.debit_amount) == SUM(line.credit_amount)
```

---

## 9. Edge Cases

### 9.1 Reversal of Reversed Entry

**Scenario:** User tries to reverse an already reversed entry
**Decision:** Block - entry can only be reversed once

### 9.2 Reversal of System Entry

**Scenario:** User tries to reverse an invoice-generated entry
**Decision:** Block - must void the source document instead

```pseudocode
IF entry.source_type != 'MANUAL' THEN
    THROW BusinessError(
        "This entry was generated from " + entry.source_type +
        ". To reverse it, void the source document."
    )
END IF
```

### 9.3 Entry Spanning Closed/Open Periods

**Scenario:** Reversal date is in different period than original
**Decision:** Allow if reversal period is open

### 9.4 Zero-Amount Lines

**Scenario:** Line with both debit and credit = 0
**Decision:** Allow but warn (useful for memo entries)

---

## 10. Related Modules

### 10.1 Invoice Integration

Invoices create journal entries on posting:
```
Invoice POST → JournalService.create_invoice_journal_entry()
Invoice VOID → JournalService.create_invoice_void_journal_entry()
```

See: [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md)

### 10.2 Chart of Accounts Integration

Every journal line references an account:
```sql
journal_lines.account_id → chart_of_accounts.id
```

Account balances updated via trigger.

See: [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md)

### 10.3 Fiscal Period Integration

Every journal entry belongs to a fiscal period:
```sql
journal_entries.fiscal_period_id → fiscal_periods.id
-- Period must be open for posting
```

See: [FISCAL_PERIOD_MODULE.md](../fiscal-period/FISCAL_PERIOD_MODULE.md)

---

**Document End**
