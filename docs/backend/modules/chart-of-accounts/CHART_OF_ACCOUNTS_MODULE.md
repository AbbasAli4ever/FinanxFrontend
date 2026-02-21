# Chart of Accounts Module

**Module:** Chart of Accounts (Accounting Core)
**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Phase 1 - Core Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [Account Types & Classification](#3-account-types--classification)
4. [Database Schema](#4-database-schema)
5. [Data Flow](#5-data-flow)
6. [API Design](#6-api-design)
7. [Business Logic](#7-business-logic)
8. [Validation Rules](#8-validation-rules)
9. [Edge Cases](#9-edge-cases)
10. [Related Modules](#10-related-modules)

---

## 1. Overview

### 1.1 Purpose

The Chart of Accounts (COA) module is the **foundation of the accounting system**. It defines all the accounts used to record financial transactions, following standard double-entry bookkeeping principles.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Account Registry** | Define and manage all ledger accounts |
| **Account Classification** | Categorize accounts by type and subtype |
| **Account Hierarchy** | Support parent-child account structures |
| **Balance Tracking** | Maintain current balances for reporting |
| **Account Validation** | Ensure proper account usage in transactions |

### 1.3 Accounting Fundamentals

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACCOUNTING EQUATION                                   │
│                                                                          │
│              Assets = Liabilities + Equity                               │
│                                                                          │
│   Expanded:  Assets = Liabilities + Equity + (Revenue - Expenses)       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    DEBIT/CREDIT RULES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Account Type   │  Debit         │  Credit        │  Normal Balance     │
│─────────────────┼────────────────┼────────────────┼─────────────────────│
│  Asset          │  Increase (+)  │  Decrease (-)  │  Debit              │
│  Liability      │  Decrease (-)  │  Increase (+)  │  Credit             │
│  Equity         │  Decrease (-)  │  Increase (+)  │  Credit             │
│  Revenue        │  Decrease (-)  │  Increase (+)  │  Credit             │
│  Expense        │  Increase (+)  │  Decrease (-)  │  Debit              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Hierarchical** | Accounts can have parent-child relationships |
| **Typed** | Every account has a type (Asset, Liability, etc.) |
| **Subtyped** | Further classification (AR, AP, Bank, etc.) |
| **Immutable History** | Posted transactions cannot be changed |

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Accounts belong to organizations | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |

### 2.2 Modules That Depend On This

| Module | Relationship | Link |
|--------|--------------|------|
| Customer | AR account mapping | [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md) |
| Tax Codes | Tax liability account | [TAX_CODES_MODULE.md](../tax-codes/TAX_CODES_MODULE.md) |
| Invoice | Revenue accounts, AR | [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md) |
| Journal Entry | All account postings | [JOURNAL_ENTRY_MODULE.md](../journal-entry/JOURNAL_ENTRY_MODULE.md) |

### 2.3 Dependency Diagram

```
┌──────────────────┐
│   Organization   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Chart of Accounts│
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
    ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Customer│ │Tax Code│ │Invoice │ │Journal │
│        │ │        │ │        │ │ Entry  │
└────────┘ └────────┘ └────────┘ └────────┘
```

---

## 3. Account Types & Classification

### 3.1 Account Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ACCOUNT TYPE HIERARCHY                              │
└─────────────────────────────────────────────────────────────────────────┘

ASSET (Normal Balance: Debit)
├── CURRENT_ASSET
│   ├── Cash
│   ├── Bank
│   ├── Accounts Receivable
│   └── Prepaid Expenses
├── FIXED_ASSET
│   ├── Property & Equipment
│   └── Accumulated Depreciation
└── OTHER_ASSET
    └── Long-term Investments

LIABILITY (Normal Balance: Credit)
├── CURRENT_LIABILITY
│   ├── Accounts Payable
│   ├── Tax Payable
│   └── Accrued Expenses
└── LONG_TERM_LIABILITY
    └── Notes Payable

EQUITY (Normal Balance: Credit)
├── OWNERS_EQUITY
│   └── Common Stock
└── RETAINED_EARNINGS
    └── Retained Earnings

REVENUE (Normal Balance: Credit)
├── OPERATING_REVENUE
│   └── Sales Revenue
└── OTHER_REVENUE
    └── Interest Income

EXPENSE (Normal Balance: Debit)
├── OPERATING_EXPENSE
│   ├── Salaries
│   └── Rent
├── COST_OF_GOODS_SOLD
│   └── COGS
└── OTHER_EXPENSE
    └── Interest Expense
```

### 3.2 Account Type Definitions

```sql
CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

CREATE TYPE account_subtype AS ENUM (
    -- Asset Subtypes
    'CASH',
    'BANK',
    'ACCOUNTS_RECEIVABLE',
    'INVENTORY',
    'PREPAID_EXPENSE',
    'CURRENT_ASSET',
    'FIXED_ASSET',
    'ACCUMULATED_DEPRECIATION',
    'OTHER_ASSET',

    -- Liability Subtypes
    'ACCOUNTS_PAYABLE',
    'TAX_PAYABLE',
    'ACCRUED_LIABILITY',
    'CURRENT_LIABILITY',
    'LONG_TERM_LIABILITY',

    -- Equity Subtypes
    'OWNERS_EQUITY',
    'RETAINED_EARNINGS',
    'COMMON_STOCK',

    -- Revenue Subtypes
    'OPERATING_REVENUE',
    'OTHER_REVENUE',

    -- Expense Subtypes
    'OPERATING_EXPENSE',
    'COST_OF_GOODS_SOLD',
    'OTHER_EXPENSE'
);
```

### 3.3 Account Type → Subtype Mapping

| Account Type | Valid Subtypes |
|--------------|----------------|
| ASSET | CASH, BANK, ACCOUNTS_RECEIVABLE, INVENTORY, PREPAID_EXPENSE, CURRENT_ASSET, FIXED_ASSET, ACCUMULATED_DEPRECIATION, OTHER_ASSET |
| LIABILITY | ACCOUNTS_PAYABLE, TAX_PAYABLE, ACCRUED_LIABILITY, CURRENT_LIABILITY, LONG_TERM_LIABILITY |
| EQUITY | OWNERS_EQUITY, RETAINED_EARNINGS, COMMON_STOCK |
| REVENUE | OPERATING_REVENUE, OTHER_REVENUE |
| EXPENSE | OPERATING_EXPENSE, COST_OF_GOODS_SOLD, OTHER_EXPENSE |

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CHART OF ACCOUNTS SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   organizations  │
│──────────────────│
│ id (PK)          │
│ name             │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      chart_of_accounts                            │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ organization_id       UUID NOT NULL FK → organizations            │
│ account_code          VARCHAR(20) NOT NULL                        │
│ account_name          VARCHAR(255) NOT NULL                       │
│ description           TEXT                                        │
│ account_type          ENUM (ASSET, LIABILITY, EQUITY, ...)       │
│ account_subtype       ENUM (CASH, BANK, AR, ...)                 │
│ parent_id             UUID FK → chart_of_accounts (self-ref)     │
│ level                 INTEGER DEFAULT 1                           │
│ is_active             BOOLEAN DEFAULT true                        │
│ is_system_account     BOOLEAN DEFAULT false                       │
│ allows_direct_posting BOOLEAN DEFAULT true                        │
│ current_balance       DECIMAL(18,2) DEFAULT 0                     │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
│ updated_at            TIMESTAMP WITH TIME ZONE                    │
└────────────────────────────────────────────────┬─────────────────┘
                                                  │
                                                  │ Self-referencing
                                                  │ (parent-child)
                                                  │
                                                  └─────────┐
                                                            │
┌───────────────────────────────────────────────────────────┼───────┐
│                     PARENT-CHILD RELATIONSHIP              │       │
│                                                            │       │
│   1000 - Assets (parent_id: NULL, level: 1)               │       │
│   ├── 1100 - Current Assets (parent_id: 1000, level: 2)   │       │
│   │   ├── 1110 - Cash (parent_id: 1100, level: 3)         │       │
│   │   ├── 1120 - Bank (parent_id: 1100, level: 3)         │       │
│   │   └── 1130 - Accounts Receivable (parent_id: 1100)    │◄──────┘
│   └── 1200 - Fixed Assets (parent_id: 1000, level: 2)
│       └── 1210 - Equipment (parent_id: 1200, level: 3)
│
└───────────────────────────────────────────────────────────────────┘
```

### 4.2 Chart of Accounts Table Definition

```sql
CREATE TABLE chart_of_accounts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Account Identity
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Classification
    account_type account_type NOT NULL,
    account_subtype account_subtype NOT NULL,

    -- Hierarchy
    parent_id UUID REFERENCES chart_of_accounts(id),
    level INTEGER DEFAULT 1,
    full_path VARCHAR(500),  -- e.g., "Assets > Current Assets > Cash"

    -- Behavior
    is_active BOOLEAN DEFAULT true,
    is_system_account BOOLEAN DEFAULT false,      -- System accounts cannot be deleted
    allows_direct_posting BOOLEAN DEFAULT true,   -- Header accounts may not allow posting

    -- Balance (denormalized for performance)
    current_balance DECIMAL(18,2) DEFAULT 0,
    balance_updated_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_account_code UNIQUE(organization_id, account_code),
    CONSTRAINT chk_level CHECK (level >= 1 AND level <= 10),
    CONSTRAINT chk_type_subtype CHECK (
        (account_type = 'ASSET' AND account_subtype IN (
            'CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'INVENTORY',
            'PREPAID_EXPENSE', 'CURRENT_ASSET', 'FIXED_ASSET',
            'ACCUMULATED_DEPRECIATION', 'OTHER_ASSET'
        )) OR
        (account_type = 'LIABILITY' AND account_subtype IN (
            'ACCOUNTS_PAYABLE', 'TAX_PAYABLE', 'ACCRUED_LIABILITY',
            'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'
        )) OR
        (account_type = 'EQUITY' AND account_subtype IN (
            'OWNERS_EQUITY', 'RETAINED_EARNINGS', 'COMMON_STOCK'
        )) OR
        (account_type = 'REVENUE' AND account_subtype IN (
            'OPERATING_REVENUE', 'OTHER_REVENUE'
        )) OR
        (account_type = 'EXPENSE' AND account_subtype IN (
            'OPERATING_EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_EXPENSE'
        ))
    )
);

-- Indexes
CREATE INDEX idx_coa_org ON chart_of_accounts(organization_id);
CREATE INDEX idx_coa_code ON chart_of_accounts(organization_id, account_code);
CREATE INDEX idx_coa_type ON chart_of_accounts(organization_id, account_type);
CREATE INDEX idx_coa_subtype ON chart_of_accounts(organization_id, account_subtype);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);
CREATE INDEX idx_coa_active ON chart_of_accounts(organization_id, is_active)
    WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER trg_coa_updated_at
    BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent deletion of system accounts
CREATE OR REPLACE FUNCTION prevent_system_account_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system_account THEN
        RAISE EXCEPTION 'System accounts cannot be deleted';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_system_account_deletion
    BEFORE DELETE ON chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_system_account_deletion();

-- Prevent deletion of accounts with journal entries
CREATE OR REPLACE FUNCTION prevent_account_with_entries_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM journal_lines WHERE account_id = OLD.id LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot delete account with journal entries. Deactivate instead.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_account_deletion
    BEFORE DELETE ON chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_account_with_entries_deletion();
```

### 4.3 Account Balance Update Function

```sql
-- Function to update account balance when journal entries are posted
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_account_type account_type;
    v_delta DECIMAL(18,2);
BEGIN
    -- Get account type
    SELECT account_type INTO v_account_type
    FROM chart_of_accounts
    WHERE id = NEW.account_id;

    -- Calculate delta based on account type
    -- ASSET and EXPENSE: Debit increases, Credit decreases
    -- LIABILITY, EQUITY, REVENUE: Credit increases, Debit decreases
    IF v_account_type IN ('ASSET', 'EXPENSE') THEN
        v_delta := NEW.debit_amount - NEW.credit_amount;
    ELSE
        v_delta := NEW.credit_amount - NEW.debit_amount;
    END IF;

    -- Update balance
    UPDATE chart_of_accounts
    SET current_balance = current_balance + v_delta,
        balance_updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_account_balance
    AFTER INSERT ON journal_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();
```

---

## 5. Data Flow

### 5.1 Account Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ACCOUNT CREATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    User                          Server                        Database
      │                             │                              │
      │  POST /accounts             │                              │
      │  {code, name, type, ...}    │                              │
      │────────────────────────────►│                              │
      │                             │                              │
      │                             │  Validate code uniqueness    │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Validate type/subtype match │
      │                             │                              │
      │                             │  Validate parent (if any)    │
      │                             │  - Must exist                │
      │                             │  - Must be same type         │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Calculate level             │
      │                             │  Generate full_path          │
      │                             │                              │
      │                             │  Create account              │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │  {account object}           │                              │
      │◄────────────────────────────│                              │
      │                             │                              │
```

### 5.2 Balance Update Flow (Journal Entry)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     BALANCE UPDATE FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

    Invoice Post                  Journal Entry                    Account
         │                             │                              │
         │  Create journal entry       │                              │
         │────────────────────────────►│                              │
         │                             │                              │
         │                             │  Insert journal header       │
         │                             │─────────────────────────────►│
         │                             │                              │
         │                             │  Insert line: DR AR          │
         │                             │─────────────────────────────►│
         │                             │                              │
         │                             │        (Trigger fires)       │
         │                             │         Update AR balance   │
         │                             │         +6,000.00            │
         │                             │                              │
         │                             │  Insert line: CR Revenue     │
         │                             │─────────────────────────────►│
         │                             │                              │
         │                             │        (Trigger fires)       │
         │                             │         Update Revenue bal  │
         │                             │         +5,500.00            │
         │                             │                              │
         │                             │  Insert line: CR Tax         │
         │                             │─────────────────────────────►│
         │                             │                              │
         │                             │        (Trigger fires)       │
         │                             │         Update Tax balance  │
         │                             │         +500.00              │
         │                             │                              │
```

---

## 6. API Design

### 6.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/accounts` | `account:read` | List accounts |
| POST | `/api/v1/accounts` | `account:create` | Create account |
| GET | `/api/v1/accounts/{id}` | `account:read` | Get account |
| PUT | `/api/v1/accounts/{id}` | `account:update` | Update account |
| DELETE | `/api/v1/accounts/{id}` | `account:delete` | Deactivate account |
| GET | `/api/v1/accounts/tree` | `account:read` | Get hierarchical tree |
| GET | `/api/v1/accounts/{id}/balance` | `account:read` | Get account balance |
| GET | `/api/v1/accounts/{id}/ledger` | `account:read` | Get account ledger |

### 6.2 List Accounts

**Endpoint:** `GET /api/v1/accounts`
**Permission:** `account:read`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 50 | Items per page |
| `type` | string | - | Filter by account type |
| `subtype` | string | - | Filter by subtype |
| `is_active` | boolean | true | Filter by status |
| `search` | string | - | Search code/name |
| `parent_id` | uuid | - | Filter by parent |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "account_code": "1100",
            "account_name": "Accounts Receivable",
            "account_type": "ASSET",
            "account_subtype": "ACCOUNTS_RECEIVABLE",
            "parent_id": "uuid",
            "parent_code": "1000",
            "level": 2,
            "full_path": "Assets > Current Assets > Accounts Receivable",
            "is_active": true,
            "is_system_account": true,
            "current_balance": 125000.00,
            "allows_direct_posting": true
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 50,
        "total_items": 45,
        "total_pages": 1
    }
}
```

### 6.3 Get Account Tree (Hierarchical)

**Endpoint:** `GET /api/v1/accounts/tree`
**Permission:** `account:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by account type |
| `include_balances` | boolean | Include current balances |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "account_code": "1000",
            "account_name": "Assets",
            "account_type": "ASSET",
            "level": 1,
            "current_balance": 500000.00,
            "children": [
                {
                    "id": "uuid",
                    "account_code": "1100",
                    "account_name": "Current Assets",
                    "level": 2,
                    "current_balance": 300000.00,
                    "children": [
                        {
                            "id": "uuid",
                            "account_code": "1110",
                            "account_name": "Cash",
                            "level": 3,
                            "current_balance": 50000.00,
                            "children": []
                        },
                        {
                            "id": "uuid",
                            "account_code": "1120",
                            "account_name": "Bank - Operating",
                            "level": 3,
                            "current_balance": 125000.00,
                            "children": []
                        }
                    ]
                }
            ]
        }
    ]
}
```

### 6.4 Create Account

**Endpoint:** `POST /api/v1/accounts`
**Permission:** `account:create`

**Request Body:**
```json
{
    "account_code": "1125",
    "account_name": "Bank - Savings",
    "description": "Business savings account",
    "account_type": "ASSET",
    "account_subtype": "BANK",
    "parent_id": "uuid-of-current-assets",
    "allows_direct_posting": true
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "account_code": "1125",
        "account_name": "Bank - Savings",
        "description": "Business savings account",
        "account_type": "ASSET",
        "account_subtype": "BANK",
        "parent_id": "uuid",
        "parent_code": "1100",
        "level": 3,
        "full_path": "Assets > Current Assets > Bank - Savings",
        "is_active": true,
        "is_system_account": false,
        "allows_direct_posting": true,
        "current_balance": 0,
        "created_at": "2026-01-21T10:00:00Z"
    }
}
```

### 6.5 Get Account Ledger

**Endpoint:** `GET /api/v1/accounts/{account_id}/ledger`
**Permission:** `account:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | date | Start date |
| `date_to` | date | End date |
| `page` | integer | Page number |
| `per_page` | integer | Items per page |

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "account": {
            "id": "uuid",
            "account_code": "1100",
            "account_name": "Accounts Receivable",
            "account_type": "ASSET"
        },
        "period": {
            "from": "2026-01-01",
            "to": "2026-01-31"
        },
        "opening_balance": 100000.00,
        "entries": [
            {
                "date": "2026-01-15",
                "entry_number": "JE-000001",
                "description": "Invoice INV-000001 - Acme Corp",
                "reference": "INV-000001",
                "debit": 6000.00,
                "credit": 0,
                "running_balance": 106000.00
            },
            {
                "date": "2026-01-20",
                "entry_number": "JE-000002",
                "description": "Invoice INV-000002 - Beta Inc",
                "reference": "INV-000002",
                "debit": 3500.00,
                "credit": 0,
                "running_balance": 109500.00
            }
        ],
        "totals": {
            "total_debits": 9500.00,
            "total_credits": 0,
            "net_change": 9500.00
        },
        "closing_balance": 109500.00
    },
    "pagination": {
        "page": 1,
        "per_page": 50,
        "total_items": 2,
        "total_pages": 1
    }
}
```

### 6.6 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ACCOUNT_NOT_FOUND` | 404 | Account not found |
| `ACCOUNT_CODE_EXISTS` | 409 | Account code already exists |
| `INVALID_ACCOUNT_TYPE` | 400 | Invalid account type |
| `INVALID_SUBTYPE_FOR_TYPE` | 400 | Subtype doesn't match type |
| `PARENT_NOT_FOUND` | 400 | Parent account not found |
| `PARENT_TYPE_MISMATCH` | 400 | Parent must be same type |
| `SYSTEM_ACCOUNT_PROTECTED` | 400 | Cannot modify system account |
| `ACCOUNT_HAS_ENTRIES` | 400 | Cannot delete account with entries |
| `CIRCULAR_REFERENCE` | 400 | Account cannot be its own ancestor |

---

## 7. Business Logic

### 7.1 Create Account

```pseudocode
FUNCTION create_account(data: AccountCreateDTO, user: User) -> Account

    // 1. Validate type/subtype combination
    IF NOT is_valid_type_subtype(data.account_type, data.account_subtype) THEN
        THROW ValidationError("Invalid subtype for account type")
    END IF

    // 2. Check code uniqueness
    existing = AccountRepository.find_by_code(
        user.organization_id,
        data.account_code
    )
    IF existing IS NOT NULL THEN
        THROW ConflictError("Account code already exists")
    END IF

    // 3. Validate parent (if provided)
    level = 1
    full_path = data.account_name

    IF data.parent_id IS NOT NULL THEN
        parent = AccountRepository.find(data.parent_id)

        IF parent IS NULL THEN
            THROW NotFoundError("Parent account not found")
        END IF

        IF parent.organization_id != user.organization_id THEN
            THROW ForbiddenError("Parent belongs to different organization")
        END IF

        IF parent.account_type != data.account_type THEN
            THROW ValidationError("Parent must be same account type")
        END IF

        // Check for circular reference (if updating)
        IF would_create_circular_reference(data.parent_id, data.id) THEN
            THROW ValidationError("Circular reference detected")
        END IF

        level = parent.level + 1
        full_path = parent.full_path + " > " + data.account_name
    END IF

    // 4. Create account
    account = Account.create({
        organization_id: user.organization_id,
        account_code: data.account_code,
        account_name: data.account_name,
        description: data.description,
        account_type: data.account_type,
        account_subtype: data.account_subtype,
        parent_id: data.parent_id,
        level: level,
        full_path: full_path,
        is_active: true,
        is_system_account: false,
        allows_direct_posting: data.allows_direct_posting ?? true,
        current_balance: 0,
        created_by: user.id
    })

    // 5. Audit log
    AuditLog.record('chart_of_accounts', account.id, 'INSERT', null, account)

    RETURN account

END FUNCTION
```

### 7.2 Create Default Chart of Accounts

```pseudocode
FUNCTION create_default_chart_of_accounts(organization_id: UUID)

    default_accounts = [
        // ASSETS
        {code: "1000", name: "Assets", type: "ASSET", subtype: "CURRENT_ASSET", parent: null, system: true, posting: false},
        {code: "1100", name: "Current Assets", type: "ASSET", subtype: "CURRENT_ASSET", parent: "1000", system: true, posting: false},
        {code: "1110", name: "Cash", type: "ASSET", subtype: "CASH", parent: "1100", system: true, posting: true},
        {code: "1120", name: "Bank - Operating", type: "ASSET", subtype: "BANK", parent: "1100", system: true, posting: true},
        {code: "1130", name: "Accounts Receivable", type: "ASSET", subtype: "ACCOUNTS_RECEIVABLE", parent: "1100", system: true, posting: true},
        {code: "1200", name: "Fixed Assets", type: "ASSET", subtype: "FIXED_ASSET", parent: "1000", system: true, posting: false},
        {code: "1210", name: "Equipment", type: "ASSET", subtype: "FIXED_ASSET", parent: "1200", system: true, posting: true},

        // LIABILITIES
        {code: "2000", name: "Liabilities", type: "LIABILITY", subtype: "CURRENT_LIABILITY", parent: null, system: true, posting: false},
        {code: "2100", name: "Current Liabilities", type: "LIABILITY", subtype: "CURRENT_LIABILITY", parent: "2000", system: true, posting: false},
        {code: "2110", name: "Accounts Payable", type: "LIABILITY", subtype: "ACCOUNTS_PAYABLE", parent: "2100", system: true, posting: true},
        {code: "2120", name: "Sales Tax Payable", type: "LIABILITY", subtype: "TAX_PAYABLE", parent: "2100", system: true, posting: true},
        {code: "2130", name: "Accrued Expenses", type: "LIABILITY", subtype: "ACCRUED_LIABILITY", parent: "2100", system: true, posting: true},

        // EQUITY
        {code: "3000", name: "Equity", type: "EQUITY", subtype: "OWNERS_EQUITY", parent: null, system: true, posting: false},
        {code: "3100", name: "Owner's Equity", type: "EQUITY", subtype: "OWNERS_EQUITY", parent: "3000", system: true, posting: true},
        {code: "3200", name: "Retained Earnings", type: "EQUITY", subtype: "RETAINED_EARNINGS", parent: "3000", system: true, posting: true},

        // REVENUE
        {code: "4000", name: "Revenue", type: "REVENUE", subtype: "OPERATING_REVENUE", parent: null, system: true, posting: false},
        {code: "4100", name: "Sales Revenue", type: "REVENUE", subtype: "OPERATING_REVENUE", parent: "4000", system: true, posting: true},
        {code: "4200", name: "Service Revenue", type: "REVENUE", subtype: "OPERATING_REVENUE", parent: "4000", system: true, posting: true},
        {code: "4900", name: "Other Revenue", type: "REVENUE", subtype: "OTHER_REVENUE", parent: "4000", system: true, posting: true},

        // EXPENSES
        {code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", subtype: "COST_OF_GOODS_SOLD", parent: null, system: true, posting: true},
        {code: "6000", name: "Operating Expenses", type: "EXPENSE", subtype: "OPERATING_EXPENSE", parent: null, system: true, posting: false},
        {code: "6100", name: "Salaries & Wages", type: "EXPENSE", subtype: "OPERATING_EXPENSE", parent: "6000", system: true, posting: true},
        {code: "6200", name: "Rent Expense", type: "EXPENSE", subtype: "OPERATING_EXPENSE", parent: "6000", system: true, posting: true},
        {code: "6300", name: "Utilities", type: "EXPENSE", subtype: "OPERATING_EXPENSE", parent: "6000", system: true, posting: true},
        {code: "6400", name: "Office Supplies", type: "EXPENSE", subtype: "OPERATING_EXPENSE", parent: "6000", system: true, posting: true},
    ]

    // Create accounts in order (parents first)
    account_map = {}

    FOR EACH acc IN default_accounts
        parent_id = null
        IF acc.parent IS NOT NULL THEN
            parent_id = account_map[acc.parent].id
        END IF

        account = Account.create({
            organization_id: organization_id,
            account_code: acc.code,
            account_name: acc.name,
            account_type: acc.type,
            account_subtype: acc.subtype,
            parent_id: parent_id,
            is_system_account: acc.system,
            allows_direct_posting: acc.posting
        })

        account_map[acc.code] = account
    END FOR

    RETURN account_map

END FUNCTION
```

### 7.3 Get Account Balance with Period

```pseudocode
FUNCTION get_account_balance(
    account_id: UUID,
    as_of_date: Date
) -> AccountBalance

    account = AccountRepository.find(account_id)
    IF account IS NULL THEN
        THROW NotFoundError("Account not found")
    END IF

    // Get balance from journal entries up to date
    balance_data = SQL """
        SELECT
            COALESCE(SUM(jl.debit_amount), 0) as total_debits,
            COALESCE(SUM(jl.credit_amount), 0) as total_credits
        FROM journal_lines jl
        JOIN journal_entries je ON je.id = jl.journal_entry_id
        WHERE jl.account_id = $1
          AND je.entry_date <= $2
          AND je.is_posted = true
    """(account_id, as_of_date)

    // Calculate balance based on account type
    IF account.account_type IN ('ASSET', 'EXPENSE') THEN
        balance = balance_data.total_debits - balance_data.total_credits
    ELSE
        balance = balance_data.total_credits - balance_data.total_debits
    END IF

    RETURN {
        account_id: account_id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        as_of_date: as_of_date,
        total_debits: balance_data.total_debits,
        total_credits: balance_data.total_credits,
        balance: balance,
        normal_balance: IF account.account_type IN ('ASSET', 'EXPENSE') THEN 'DEBIT' ELSE 'CREDIT'
    }

END FUNCTION
```

---

## 8. Validation Rules

### 8.1 Field Validations

| Field | Rules | Error |
|-------|-------|-------|
| `account_code` | Required, 1-20 chars, unique per org | `Invalid code` |
| `account_name` | Required, 1-255 chars | `Name required` |
| `account_type` | Required, valid enum | `Invalid type` |
| `account_subtype` | Required, must match type | `Invalid subtype` |
| `parent_id` | If set, must exist and be same type | `Invalid parent` |

### 8.2 Business Rules

| Rule | Description |
|------|-------------|
| Type-Subtype Match | Subtype must be valid for the account type |
| Parent Type Match | Parent account must be same type |
| No Circular Reference | Account cannot be its own ancestor |
| System Account Protection | System accounts cannot be deleted |
| Entry Protection | Accounts with entries cannot be deleted |
| Code Immutability | Code cannot change after journal entries |

---

## 9. Edge Cases

### 9.1 Account Code Change with Entries

**Scenario:** User tries to change account code after journal entries exist
**Decision:** Block the change to maintain audit trail integrity

```pseudocode
FUNCTION update_account(account_id: UUID, data: AccountUpdateDTO)

    // Check for journal entries
    IF data.account_code IS NOT NULL THEN
        entry_count = JournalLineRepository.count_by_account(account_id)
        IF entry_count > 0 THEN
            THROW BusinessError("Cannot change code for account with journal entries")
        END IF
    END IF

    // Proceed with other updates
    // ...

END FUNCTION
```

### 9.2 Parent Account Deactivation

**Scenario:** User deactivates a parent account
**Decision:** Deactivate all child accounts as well

```pseudocode
FUNCTION deactivate_account(account_id: UUID)

    BEGIN TRANSACTION
        // Deactivate this account
        AccountRepository.update(account_id, {is_active: false})

        // Recursively deactivate children
        children = AccountRepository.find_children(account_id)
        FOR EACH child IN children
            deactivate_account(child.id)
        END FOR
    COMMIT

END FUNCTION
```

### 9.3 Balance Recalculation

**Scenario:** Current balance drifts from actual (rare edge case)
**Solution:** Periodic reconciliation job

```pseudocode
FUNCTION reconcile_account_balances(organization_id: UUID)

    accounts = AccountRepository.find_all(organization_id)

    FOR EACH account IN accounts
        // Calculate actual balance from journal entries
        actual = get_account_balance(account.id, CURRENT_DATE)

        IF actual.balance != account.current_balance THEN
            LOG.warn("Balance mismatch for account " + account.account_code +
                     ": stored=" + account.current_balance +
                     ", calculated=" + actual.balance)

            // Update to correct value
            AccountRepository.update(account.id, {
                current_balance: actual.balance,
                balance_updated_at: CURRENT_TIMESTAMP
            })
        END IF
    END FOR

END FUNCTION
```

---

## 10. Related Modules

### 10.1 Customer Integration

Customers reference AR accounts for invoice posting:
```sql
-- Customer points to AR account
customers.ar_account_id → chart_of_accounts.id
-- WHERE account_subtype = 'ACCOUNTS_RECEIVABLE'
```

See: [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md)

### 10.2 Tax Codes Integration

Tax codes reference liability accounts:
```sql
-- Tax code points to tax payable account
tax_codes.tax_account_id → chart_of_accounts.id
-- WHERE account_subtype = 'TAX_PAYABLE'
```

See: [TAX_CODES_MODULE.md](../tax-codes/TAX_CODES_MODULE.md)

### 10.3 Journal Entry Integration

All journal lines reference accounts:
```sql
-- Journal line posts to account
journal_lines.account_id → chart_of_accounts.id
```

See: [JOURNAL_ENTRY_MODULE.md](../journal-entry/JOURNAL_ENTRY_MODULE.md)

---

## Appendix A: Default Account Codes

| Code | Name | Type | Subtype |
|------|------|------|---------|
| 1000 | Assets | ASSET | CURRENT_ASSET |
| 1100 | Current Assets | ASSET | CURRENT_ASSET |
| 1110 | Cash | ASSET | CASH |
| 1120 | Bank - Operating | ASSET | BANK |
| 1130 | Accounts Receivable | ASSET | ACCOUNTS_RECEIVABLE |
| 2000 | Liabilities | LIABILITY | CURRENT_LIABILITY |
| 2110 | Accounts Payable | LIABILITY | ACCOUNTS_PAYABLE |
| 2120 | Sales Tax Payable | LIABILITY | TAX_PAYABLE |
| 3000 | Equity | EQUITY | OWNERS_EQUITY |
| 3200 | Retained Earnings | EQUITY | RETAINED_EARNINGS |
| 4000 | Revenue | REVENUE | OPERATING_REVENUE |
| 4100 | Sales Revenue | REVENUE | OPERATING_REVENUE |
| 6000 | Operating Expenses | EXPENSE | OPERATING_EXPENSE |

---

**Document End**
