# Invoice Module - Backend Design Documentation

**Module:** Invoice (Accounts Receivable)
**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Phase 1 - Core Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Scope Definition](#2-scope-definition)
3. [Accounting Principles](#3-accounting-principles)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [Database Schema Design](#5-database-schema-design)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [State Machine](#7-state-machine)
8. [API Design](#8-api-design)
9. [Business Logic & Pseudocode](#9-business-logic--pseudocode)
10. [Validation Rules](#10-validation-rules)
11. [Edge Cases & Failure Scenarios](#11-edge-cases--failure-scenarios)
12. [Assumptions](#12-assumptions)
13. [Glossary](#13-glossary)

---

## 1. Overview

### 1.1 Purpose

The Invoice Module manages Accounts Receivable transactions in the FinanX Financial ERP system. It handles the creation, posting, and voiding of sales invoices while maintaining strict adherence to double-entry accounting principles.

### 1.2 Business Context

An **Invoice** represents:
- A sale of goods or services to a customer
- A legal document requesting payment
- A source document for Accounts Receivable recognition
- A trigger for Revenue recognition upon posting

### 1.3 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Accounting Type** | Accounts Receivable (Asset) |
| **Revenue Recognition** | Upon posting (not on draft creation) |
| **Immutability** | Posted invoices cannot be modified |
| **Audit Trail** | Full traceability via journal entries |

---

## 2. Scope Definition

### 2.1 Phase 1 - Included

| Feature | Description |
|---------|-------------|
| Invoice CRUD | Create, Read, Update (draft only), Delete (draft only) |
| Invoice Lines | Line item management with descriptions, quantities, prices |
| Tax Calculation | Basic tax computation per line item |
| Invoice Posting | Transition from draft to posted with journal generation |
| Invoice Voiding | Reversal of posted invoices with reversing entries |
| Journal Entry Generation | Automatic double-entry bookkeeping |

### 2.2 Phase 1 - Excluded

| Feature | Planned Phase |
|---------|---------------|
| Payment Recording | Phase 2 |
| Credit Notes | Phase 2 |
| Partial Payments | Phase 2 |
| Multi-currency | Phase 3 |
| Recurring Invoices | Phase 3 |
| Inventory Integration | Phase 4 |
| Discount Management | Phase 4 |
| PDF Generation | Phase 5 |
| Email Delivery | Phase 5 |

---

## 3. Accounting Principles

### 3.1 Double-Entry Rules (Authoritative)

These rules are **immutable** and must be enforced at the database level:

| Rule # | Description | Enforcement |
|--------|-------------|-------------|
| 1 | Every posted invoice MUST generate journal entries | Database trigger / Application service |
| 2 | Total debits MUST equal total credits | Database constraint + validation |
| 3 | Draft invoices have NO accounting impact | Status check before journal creation |
| 4 | Posted invoices are IMMUTABLE | Database trigger prevents UPDATE |
| 5 | Voiding requires reversing journal entry | Application service enforcement |

### 3.2 Journal Entry Structure for Invoice Posting

When an invoice transitions from `draft` → `posted`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    JOURNAL ENTRY STRUCTURE                       │
├─────────────────────────────────────────────────────────────────┤
│  Date: invoice.invoice_date                                      │
│  Reference: invoice.invoice_number                               │
│  Source: INVOICE                                                 │
│  Source ID: invoice.id                                           │
├─────────────────────────────────────────────────────────────────┤
│  DEBIT:  Accounts Receivable    invoice.total_amount            │
│  CREDIT: Revenue Account        invoice.subtotal                 │
│  CREDIT: Tax Payable            invoice.tax_total (if > 0)      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Journal Entry Structure for Invoice Voiding

When an invoice is voided:

```
┌─────────────────────────────────────────────────────────────────┐
│                 REVERSING JOURNAL ENTRY                          │
├─────────────────────────────────────────────────────────────────┤
│  Date: void_date (current date)                                  │
│  Reference: VOID-{invoice.invoice_number}                        │
│  Source: INVOICE_VOID                                            │
│  Source ID: invoice.id                                           │
├─────────────────────────────────────────────────────────────────┤
│  DEBIT:  Revenue Account        invoice.subtotal                 │
│  DEBIT:  Tax Payable            invoice.tax_total (if > 0)      │
│  CREDIT: Accounts Receivable    invoice.total_amount            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Role-Based Access Control (RBAC)

### 4.1 RBAC Architecture

The system implements a **granular permission model** with the following hierarchy:

```
Organization
    └── Users
         └── Roles
              └── Permissions
                   └── Module Actions
```

### 4.2 Core RBAC Entities

#### 4.2.1 Permission Matrix for Invoice Module

| Permission Code | Description | Scope |
|-----------------|-------------|-------|
| `invoice:create` | Create new draft invoices | Module |
| `invoice:read` | View invoices and details | Module |
| `invoice:update` | Edit draft invoices | Module |
| `invoice:delete` | Delete draft invoices | Module |
| `invoice:post` | Post invoices (triggers accounting) | Module |
| `invoice:void` | Void posted invoices | Module |
| `invoice:export` | Export invoice data | Module |
| `invoice_line:create` | Add line items | Sub-module |
| `invoice_line:update` | Edit line items | Sub-module |
| `invoice_line:delete` | Remove line items | Sub-module |

#### 4.2.2 Predefined Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| **Invoice Clerk** | `invoice:create`, `invoice:read`, `invoice:update`, `invoice_line:*` | Day-to-day invoice creation |
| **Invoice Manager** | All Invoice Clerk + `invoice:delete`, `invoice:post`, `invoice:export` | Approval and posting authority |
| **Accountant** | All Invoice Manager + `invoice:void` | Full invoice control including reversals |
| **Auditor** | `invoice:read`, `invoice:export` | Read-only access for audit purposes |
| **Admin** | `*:*` | Full system access |

### 4.3 RBAC Database Schema

```sql
-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, email)
);

-- Modules (System-defined)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,        -- e.g., 'invoice', 'payment', 'journal'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions (System-defined)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    code VARCHAR(100) UNIQUE NOT NULL,       -- e.g., 'invoice:create'
    name VARCHAR(100) NOT NULL,              -- e.g., 'Create Invoice'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles (Organization-specific)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,    -- System roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Role Permissions (Many-to-Many)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User Roles (Many-to-Many)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Indexes for RBAC performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_roles_organization ON roles(organization_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### 4.4 Permission Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION CHECK FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Request arrives with JWT token                               │
│              │                                                   │
│              ▼                                                   │
│  2. Extract user_id from token                                   │
│              │                                                   │
│              ▼                                                   │
│  3. Load user's roles (cached in Redis/memory)                   │
│              │                                                   │
│              ▼                                                   │
│  4. Aggregate all permissions from roles                         │
│              │                                                   │
│              ▼                                                   │
│  5. Check if required permission exists                          │
│              │                                                   │
│         ┌────┴────┐                                              │
│         │         │                                              │
│         ▼         ▼                                              │
│      GRANTED   DENIED                                            │
│         │         │                                              │
│         ▼         ▼                                              │
│    Proceed    403 Forbidden                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema Design

### 5.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INVOICE MODULE ERD                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐         ┌──────────────────┐
    │   organizations  │         │     modules      │
    │──────────────────│         │──────────────────│
    │ id (PK)          │         │ id (PK)          │
    │ name             │         │ code             │
    │ code             │         │ name             │
    │ is_active        │         │ description      │
    │ settings         │         │ is_active        │
    └────────┬─────────┘         └────────┬─────────┘
             │                            │
             │ 1:N                        │ 1:N
             │                            │
    ┌────────┴─────────┐         ┌────────┴─────────┐
    │      users       │         │   permissions    │
    │──────────────────│         │──────────────────│
    │ id (PK)          │         │ id (PK)          │
    │ organization_id  │◄────┐   │ module_id (FK)   │
    │ email            │     │   │ code             │
    │ password_hash    │     │   │ name             │
    │ first_name       │     │   └────────┬─────────┘
    │ last_name        │     │            │
    │ is_active        │     │            │ N:M
    └────────┬─────────┘     │            │
             │               │   ┌────────┴─────────┐
             │ N:M           │   │ role_permissions │
             │               │   │──────────────────│
    ┌────────┴─────────┐     │   │ role_id (FK)     │
    │   user_roles     │     │   │ permission_id    │
    │──────────────────│     │   └────────┬─────────┘
    │ user_id (FK)     │     │            │
    │ role_id (FK)     │     │            │ N:1
    │ assigned_by      │     │            │
    └────────┬─────────┘     │   ┌────────┴─────────┐
             │               │   │      roles       │
             │ N:1           │   │──────────────────│
             │               │   │ id (PK)          │
             └───────────────┼──►│ organization_id  │
                             │   │ name             │
                             │   │ is_system_role   │
                             │   └──────────────────┘
                             │
    ┌────────────────────────┼─────────────────────────────────────┐
    │                        │                                      │
    │   ┌──────────────────┐ │  ┌──────────────────┐               │
    │   │    customers     │ │  │ chart_of_accounts│               │
    │   │──────────────────│ │  │──────────────────│               │
    │   │ id (PK)          │ │  │ id (PK)          │               │
    │   │ organization_id  │◄┘  │ organization_id  │◄──────────┐   │
    │   │ name             │    │ account_code     │           │   │
    │   │ email            │    │ account_name     │           │   │
    │   │ ar_account_id────┼───►│ account_type     │           │   │
    │   │ default_tax_code │    │ parent_id        │           │   │
    │   └────────┬─────────┘    │ is_active        │           │   │
    │            │              └──────────────────┘           │   │
    │            │ 1:N                                         │   │
    │            │                                             │   │
    │   ┌────────┴─────────┐    ┌──────────────────┐           │   │
    │   │     invoices     │    │    tax_codes     │           │   │
    │   │──────────────────│    │──────────────────│           │   │
    │   │ id (PK)          │    │ id (PK)          │           │   │
    │   │ organization_id  │◄───┤ organization_id  │           │   │
    │   │ invoice_number   │    │ code             │           │   │
    │   │ customer_id (FK) │    │ name             │           │   │
    │   │ invoice_date     │    │ rate             │           │   │
    │   │ due_date         │    │ tax_account_id───┼───────────┘   │
    │   │ subtotal         │    │ is_active        │               │
    │   │ tax_total        │    └────────┬─────────┘               │
    │   │ total_amount     │             │                         │
    │   │ balance_due      │             │                         │
    │   │ status           │             │ 1:N                     │
    │   │ posted_at        │             │                         │
    │   │ posted_by        │    ┌────────┴─────────┐               │
    │   │ voided_at        │    │  invoice_lines   │               │
    │   │ voided_by        │    │──────────────────│               │
    │   │ void_reason      │    │ id (PK)          │               │
    │   │ created_by       │    │ invoice_id (FK)──┼───────┐       │
    │   │ updated_by       │    │ line_number      │       │       │
    │   └────────┬─────────┘    │ description      │       │       │
    │            │              │ quantity         │       │       │
    │            │              │ unit_price       │       │       │
    │            │              │ line_total       │       │       │
    │            │              │ tax_code_id (FK) │       │       │
    │            │              │ tax_amount       │       │       │
    │            │              │ revenue_account  │───────┼───┐   │
    │            │              └──────────────────┘       │   │   │
    │            │                                         │   │   │
    │            │ 1:N (via source_id)                     │   │   │
    │            │                                         │   │   │
    │   ┌────────┴─────────┐                               │   │   │
    │   │  journal_entries │                               │   │   │
    │   │──────────────────│                               │   │   │
    │   │ id (PK)          │                               │   │   │
    │   │ organization_id  │                               │   │   │
    │   │ entry_number     │                               │   │   │
    │   │ entry_date       │                               │   │   │
    │   │ description      │                               │   │   │
    │   │ source_type      │  ('INVOICE', 'INVOICE_VOID')  │   │   │
    │   │ source_id────────┼───────────────────────────────┘   │   │
    │   │ is_posted        │                                   │   │
    │   │ created_by       │                                   │   │
    │   └────────┬─────────┘                                   │   │
    │            │                                             │   │
    │            │ 1:N                                         │   │
    │            │                                             │   │
    │   ┌────────┴─────────┐                                   │   │
    │   │  journal_lines   │                                   │   │
    │   │──────────────────│                                   │   │
    │   │ id (PK)          │                                   │   │
    │   │ journal_entry_id │                                   │   │
    │   │ account_id───────┼───────────────────────────────────┘   │
    │   │ debit_amount     │                                       │
    │   │ credit_amount    │                                       │
    │   │ description      │                                       │
    │   └──────────────────┘                                       │
    │                                                              │
    └──────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  fiscal_periods  │
    │──────────────────│
    │ id (PK)          │
    │ organization_id  │
    │ period_name      │
    │ start_date       │
    │ end_date         │
    │ is_closed        │
    └──────────────────┘
```

### 5.2 Table Definitions

#### 5.2.1 Customers Table

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Basic Information
    customer_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Accounting
    ar_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    default_tax_code_id UUID REFERENCES tax_codes(id),
    credit_limit DECIMAL(18,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,  -- Days

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    UNIQUE(organization_id, customer_code)
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_name ON customers(organization_id, name);
CREATE INDEX idx_customers_code ON customers(organization_id, customer_code);
```

#### 5.2.2 Chart of Accounts Table

```sql
CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

CREATE TYPE account_subtype AS ENUM (
    -- Assets
    'CURRENT_ASSET',
    'FIXED_ASSET',
    'OTHER_ASSET',
    'ACCOUNTS_RECEIVABLE',
    'BANK',
    'CASH',

    -- Liabilities
    'CURRENT_LIABILITY',
    'LONG_TERM_LIABILITY',
    'ACCOUNTS_PAYABLE',
    'TAX_PAYABLE',

    -- Equity
    'OWNERS_EQUITY',
    'RETAINED_EARNINGS',

    -- Revenue
    'OPERATING_REVENUE',
    'OTHER_REVENUE',

    -- Expense
    'OPERATING_EXPENSE',
    'COST_OF_GOODS_SOLD',
    'OTHER_EXPENSE'
);

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

    -- Behavior
    is_active BOOLEAN DEFAULT true,
    is_system_account BOOLEAN DEFAULT false,  -- Cannot be deleted
    allows_direct_posting BOOLEAN DEFAULT true,

    -- Balance tracking (denormalized for performance)
    current_balance DECIMAL(18,2) DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization_id, account_code)
);

CREATE INDEX idx_coa_org ON chart_of_accounts(organization_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(organization_id, account_type);
CREATE INDEX idx_coa_subtype ON chart_of_accounts(organization_id, account_subtype);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);
```

#### 5.2.3 Tax Codes Table

```sql
CREATE TABLE tax_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rate DECIMAL(5,4) NOT NULL,  -- e.g., 0.0825 for 8.25%

    -- Accounting
    tax_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization_id, code)
);

CREATE INDEX idx_tax_codes_org ON tax_codes(organization_id);
```

#### 5.2.4 Fiscal Periods Table

```sql
CREATE TABLE fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    period_name VARCHAR(50) NOT NULL,  -- e.g., "January 2026"
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL,    -- 1-12 for monthly
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization_id, fiscal_year, period_number)
);

CREATE INDEX idx_fiscal_periods_org ON fiscal_periods(organization_id);
CREATE INDEX idx_fiscal_periods_dates ON fiscal_periods(organization_id, start_date, end_date);
```

#### 5.2.5 Invoices Table

```sql
CREATE TYPE invoice_status AS ENUM ('draft', 'posted', 'void');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Invoice Identity
    invoice_number VARCHAR(50) NOT NULL,

    -- Relationships
    customer_id UUID NOT NULL REFERENCES customers(id),

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Amounts (all in base currency for Phase 1)
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Status
    status invoice_status NOT NULL DEFAULT 'draft',

    -- Posting Information
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES users(id),
    fiscal_period_id UUID REFERENCES fiscal_periods(id),

    -- Void Information
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,

    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,
    terms_and_conditions TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    UNIQUE(organization_id, invoice_number)
);

-- Prevent updates to posted invoices
CREATE OR REPLACE FUNCTION prevent_posted_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' AND NEW.status = 'posted' THEN
        -- Allow only specific fields to be updated on posted invoices
        IF OLD.subtotal != NEW.subtotal OR
           OLD.tax_total != NEW.tax_total OR
           OLD.total_amount != NEW.total_amount OR
           OLD.customer_id != NEW.customer_id OR
           OLD.invoice_date != NEW.invoice_date THEN
            RAISE EXCEPTION 'Posted invoices cannot be modified';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_invoice_update
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_invoice_update();

-- Indexes
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_date ON invoices(organization_id, invoice_date);
CREATE INDEX idx_invoices_number ON invoices(organization_id, invoice_number);
CREATE INDEX idx_invoices_fiscal_period ON invoices(fiscal_period_id);
```

#### 5.2.6 Invoice Lines Table

```sql
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Line Details
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,

    -- Quantities and Pricing
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    line_total DECIMAL(18,2) NOT NULL,

    -- Tax
    tax_code_id UUID REFERENCES tax_codes(id),
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,

    -- Accounting
    revenue_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(invoice_id, line_number)
);

-- Prevent modification of lines on posted invoices
CREATE OR REPLACE FUNCTION prevent_posted_invoice_line_modification()
RETURNS TRIGGER AS $$
DECLARE
    invoice_status invoice_status;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT status INTO invoice_status FROM invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT status INTO invoice_status FROM invoices WHERE id = NEW.invoice_id;
    END IF;

    IF invoice_status = 'posted' THEN
        RAISE EXCEPTION 'Cannot modify lines on a posted invoice';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_invoice_line_modification
    BEFORE INSERT OR UPDATE OR DELETE ON invoice_lines
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_invoice_line_modification();

-- Indexes
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_tax_code ON invoice_lines(tax_code_id);
CREATE INDEX idx_invoice_lines_revenue_account ON invoice_lines(revenue_account_id);
```

#### 5.2.7 Journal Entries Table

```sql
CREATE TYPE journal_source_type AS ENUM (
    'MANUAL',
    'INVOICE',
    'INVOICE_VOID',
    'PAYMENT',
    'PAYMENT_VOID',
    'ADJUSTMENT'
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Entry Identity
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,

    -- Description
    description TEXT NOT NULL,
    reference VARCHAR(100),

    -- Source Tracking
    source_type journal_source_type NOT NULL,
    source_id UUID,  -- References the source document (invoice, payment, etc.)

    -- Fiscal Period
    fiscal_period_id UUID REFERENCES fiscal_periods(id),

    -- Status
    is_posted BOOLEAN DEFAULT true,

    -- Totals (denormalized for validation)
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    UNIQUE(organization_id, entry_number),

    -- Ensure debits = credits
    CONSTRAINT chk_balanced_entry CHECK (total_debit = total_credit)
);

-- Indexes
CREATE INDEX idx_journal_entries_org ON journal_entries(organization_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(organization_id, entry_date);
CREATE INDEX idx_journal_entries_source ON journal_entries(source_type, source_id);
CREATE INDEX idx_journal_entries_fiscal_period ON journal_entries(fiscal_period_id);
```

#### 5.2.8 Journal Lines Table

```sql
CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,

    -- Account
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Amounts (only one should be non-zero per line)
    debit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Description
    description TEXT,

    -- Line Order
    line_number INTEGER NOT NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure only debit OR credit is non-zero
    CONSTRAINT chk_single_entry CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (debit_amount = 0 AND credit_amount > 0) OR
        (debit_amount = 0 AND credit_amount = 0)
    )
);

-- Indexes
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
```

#### 5.2.9 Invoice Number Sequence Table

```sql
CREATE TABLE invoice_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    prefix VARCHAR(10) DEFAULT 'INV',
    current_number BIGINT NOT NULL DEFAULT 0,
    padding_length INTEGER DEFAULT 6,  -- INV-000001
    fiscal_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, fiscal_year)
);

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(
    p_organization_id UUID,
    p_fiscal_year INTEGER DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_next_number BIGINT;
    v_padding INTEGER;
    v_result VARCHAR(50);
BEGIN
    -- Lock and increment
    UPDATE invoice_number_sequences
    SET current_number = current_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = p_organization_id
      AND (fiscal_year = p_fiscal_year OR (fiscal_year IS NULL AND p_fiscal_year IS NULL))
    RETURNING prefix, current_number, padding_length
    INTO v_prefix, v_next_number, v_padding;

    -- If no sequence exists, create one
    IF v_next_number IS NULL THEN
        INSERT INTO invoice_number_sequences (organization_id, fiscal_year, current_number)
        VALUES (p_organization_id, p_fiscal_year, 1)
        RETURNING prefix, current_number, padding_length
        INTO v_prefix, v_next_number, v_padding;
    END IF;

    -- Format: INV-000001
    v_result := v_prefix || '-' || LPAD(v_next_number::TEXT, v_padding, '0');

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Audit Log Table (System-Wide)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- What changed
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,  -- INSERT, UPDATE, DELETE

    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Who and when
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## 6. Data Flow Diagrams

### 6.1 DFD Level 0 - Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DFD LEVEL 0 - CONTEXT                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                              Invoice Request
                    ┌──────────────────────────────────┐
                    │                                  │
                    │                                  ▼
    ┌─────────┐     │                        ┌─────────────────┐
    │         │     │     Customer Data      │                 │
    │  USER   │─────┼───────────────────────►│                 │
    │         │     │                        │    INVOICE      │
    │         │◄────┼────────────────────────│    MODULE       │
    │         │     │   Invoice Confirmation │                 │
    └─────────┘     │                        │                 │
                    │                        └────────┬────────┘
                    │                                 │
                    │                                 │ Journal Entries
                    │                                 │
                    │                        ┌────────▼────────┐
                    │                        │                 │
                    │                        │   GENERAL       │
                    └───────────────────────►│   LEDGER        │
                         Ledger Updates      │                 │
                                             └─────────────────┘

    ┌─────────┐
    │         │       Customer Info
    │CUSTOMER │◄─────────────────────────────────────────────────┐
    │ MASTER  │                                                  │
    │         │──────────────────────────────────────────────────┘
    └─────────┘       AR Account, Tax Code
```

### 6.2 DFD Level 1 - Main Processes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DFD LEVEL 1 - MAIN PROCESSES                          │
└─────────────────────────────────────────────────────────────────────────────────┘


    ┌─────────┐         Invoice Data           ┌─────────────────┐
    │         │───────────────────────────────►│                 │
    │  USER   │                                │  1.0 CREATE     │
    │         │◄───────────────────────────────│  INVOICE DRAFT  │
    └─────────┘         Draft Created          │                 │
         │                                     └────────┬────────┘
         │                                              │
         │                                              │ Draft Invoice
         │                                              ▼
         │                                     ┌─────────────────┐
         │         Line Item Data              │                 │
         ├────────────────────────────────────►│  2.0 MANAGE     │
         │                                     │  LINE ITEMS     │
         │◄────────────────────────────────────│                 │
         │         Updated Lines               └────────┬────────┘
         │                                              │
         │                                              │ Lines Updated
         │                                              ▼
         │                                     ┌─────────────────┐
         │                                     │                 │
         │                                     │  3.0 CALCULATE  │
         │                                     │  TOTALS         │
         │                                     │                 │
         │                                     └────────┬────────┘
         │                                              │
         │                                              │ Calculated Invoice
         │         Post Command                         ▼
         ├────────────────────────────────────►┌─────────────────┐
         │                                     │                 │
         │◄────────────────────────────────────│  4.0 POST       │
         │         Posted Confirmation         │  INVOICE        │
         │                                     │                 │
         │                                     └────────┬────────┘
         │                                              │
         │                                              │ Posted Invoice
         │                                              ▼
         │                                     ┌─────────────────┐
         │                                     │                 │
         │                                     │  5.0 GENERATE   │──────────►[D4 Journal
         │                                     │  JOURNAL ENTRY  │            Entries]
         │                                     │                 │
         │                                     └────────┬────────┘
         │                                              │
         │                                              │ Journal Entry
         │                                              ▼
         │         Void Command                ┌─────────────────┐
         ├────────────────────────────────────►│                 │
         │                                     │  6.0 VOID       │──────────►[D4 Journal
         │◄────────────────────────────────────│  INVOICE        │            Entries]
                   Void Confirmation           │                 │
                                               └─────────────────┘

    DATA STORES:
    [D1] Invoices
    [D2] Invoice Lines
    [D3] Customers
    [D4] Journal Entries
    [D5] Chart of Accounts
    [D6] Tax Codes
    [D7] Fiscal Periods
```

### 6.3 DFD Level 2 - Process 4.0 Post Invoice (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DFD LEVEL 2 - PROCESS 4.0 POST INVOICE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

    Post Command
         │
         ▼
┌─────────────────┐     Invoice Data     ┌─────────────────┐
│                 │◄────────────────────│                 │
│  4.1 VALIDATE   │                     │  [D1] Invoices  │
│  INVOICE        │                     │                 │
│                 │                     └─────────────────┘
└────────┬────────┘
         │
         │ Validation Result
         │
         ├─────────────[FAIL]─────────────► Error Response
         │
         │ [PASS]
         ▼
┌─────────────────┐     Period Data      ┌─────────────────┐
│                 │◄────────────────────│                 │
│  4.2 VALIDATE   │                     │  [D7] Fiscal    │
│  FISCAL PERIOD  │                     │      Periods    │
│                 │                     └─────────────────┘
└────────┬────────┘
         │
         │ Period Validation
         │
         ├─────────────[FAIL]─────────────► Error Response
         │
         │ [PASS]
         ▼
┌─────────────────┐     Accounts Data    ┌─────────────────┐
│                 │◄────────────────────│                 │
│  4.3 RESOLVE    │                     │  [D5] Chart of  │
│  ACCOUNTS       │                     │      Accounts   │
│                 │                     └─────────────────┘
└────────┬────────┘
         │
         │ Resolved Accounts
         ▼
┌─────────────────┐
│                 │
│  4.4 UPDATE     │─────────────────────►[D1] Invoices
│  INVOICE STATUS │                      (status = 'posted')
│                 │
└────────┬────────┘
         │
         │ Posted Invoice
         ▼
┌─────────────────┐
│                 │
│  4.5 CREATE     │─────────────────────►[D4] Journal Entries
│  JOURNAL ENTRY  │
│                 │
└────────┬────────┘
         │
         │ Journal Entry Created
         ▼
┌─────────────────┐
│                 │
│  4.6 UPDATE     │─────────────────────►[D5] Account Balances
│  LEDGER         │
│                 │
└────────┬────────┘
         │
         ▼
    Post Confirmation
```

### 6.4 DFD Level 2 - Process 6.0 Void Invoice

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DFD LEVEL 2 - PROCESS 6.0 VOID INVOICE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

    Void Command (invoice_id, reason)
         │
         ▼
┌─────────────────┐     Invoice Data     ┌─────────────────┐
│                 │◄────────────────────│                 │
│  6.1 VALIDATE   │                     │  [D1] Invoices  │
│  VOID REQUEST   │                     │                 │
│                 │                     └─────────────────┘
└────────┬────────┘
         │
         │ Validation Result
         │
         ├─────[Invoice not posted]──────► Error: "Only posted invoices can be voided"
         │
         ├─────[Already void]────────────► Error: "Invoice already voided"
         │
         ├─────[Has payments]────────────► Error: "Cannot void invoice with payments"
         │
         │ [PASS]
         ▼
┌─────────────────┐     Original Entry   ┌─────────────────┐
│                 │◄────────────────────│                 │
│  6.2 GET        │                     │  [D4] Journal   │
│  ORIGINAL ENTRY │                     │      Entries    │
│                 │                     └─────────────────┘
└────────┬────────┘
         │
         │ Original Journal Entry
         ▼
┌─────────────────┐
│                 │
│  6.3 CREATE     │─────────────────────►[D4] Journal Entries
│  REVERSING      │                      (Debits ↔ Credits swapped)
│  ENTRY          │
│                 │
└────────┬────────┘
         │
         │ Reversing Entry Created
         ▼
┌─────────────────┐
│                 │
│  6.4 UPDATE     │─────────────────────►[D1] Invoices
│  INVOICE STATUS │                      (status = 'void')
│                 │
└────────┬────────┘
         │
         │ Invoice Voided
         ▼
┌─────────────────┐
│                 │
│  6.5 UPDATE     │─────────────────────►[D5] Account Balances
│  LEDGER         │                      (Reverse original impact)
│                 │
└────────┬────────┘
         │
         ▼
    Void Confirmation
```

---

## 7. State Machine

### 7.1 Invoice State Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         INVOICE STATE MACHINE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │                 │
            CREATE            │     DRAFT       │
         ─────────────────────►                 │
                              │   (Editable)    │
                              │                 │
                              └────────┬────────┘
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                          ▼            │            ▼
                    ┌──────────┐       │      ┌──────────┐
                    │  UPDATE  │       │      │  DELETE  │
                    │  (lines, │       │      │  (hard   │
                    │  header) │       │      │  delete) │
                    └────┬─────┘       │      └──────────┘
                         │             │
                         └─────────────┤
                                       │
                                       │ POST
                                       │ (Validate + Journal)
                                       ▼
                              ┌─────────────────┐
                              │                 │
                              │     POSTED      │
                              │                 │
                              │  (Immutable)    │
                              │  (In Reports)   │
                              │                 │
                              └────────┬────────┘
                                       │
                                       │ VOID
                                       │ (Reversing Entry)
                                       ▼
                              ┌─────────────────┐
                              │                 │
                              │      VOID       │
                              │                 │
                              │  (Archived)     │
                              │  (No Actions)   │
                              │                 │
                              └─────────────────┘


    STATE TRANSITIONS SUMMARY:
    ┌──────────┬──────────────┬─────────────────────────────────────────┐
    │ From     │ To           │ Trigger / Conditions                     │
    ├──────────┼──────────────┼─────────────────────────────────────────┤
    │ (none)   │ draft        │ create_invoice_draft()                   │
    │ draft    │ draft        │ update_invoice(), add/edit/remove lines  │
    │ draft    │ (deleted)    │ delete_invoice() - hard delete           │
    │ draft    │ posted       │ post_invoice() - validation passes       │
    │ posted   │ void         │ void_invoice() - no payments applied     │
    │ void     │ (none)       │ Terminal state - no transitions          │
    └──────────┴──────────────┴─────────────────────────────────────────┘
```

### 7.2 State Permissions Matrix

| State | Create | Read | Update | Delete | Post | Void | Add Lines | Edit Lines | Remove Lines |
|-------|--------|------|--------|--------|------|------|-----------|------------|--------------|
| **draft** | - | Yes | Yes | Yes | Yes | No | Yes | Yes | Yes |
| **posted** | - | Yes | No* | No | No | Yes | No | No | No |
| **void** | - | Yes | No | No | No | No | No | No | No |

*Posted invoices allow only `balance_due` updates (via payments in Phase 2)

---

## 8. API Design

### 8.1 API Overview

**Base URL:** `/api/v1`
**Authentication:** Bearer Token (JWT)
**Content-Type:** `application/json`

### 8.2 Common Response Structure

#### Success Response
```json
{
    "success": true,
    "data": { },
    "meta": {
        "timestamp": "2026-01-21T10:30:00Z",
        "request_id": "uuid"
    }
}
```

#### Error Response
```json
{
    "success": false,
    "error": {
        "code": "INVOICE_NOT_FOUND",
        "message": "Invoice with ID xxx not found",
        "details": [],
        "field": null
    },
    "meta": {
        "timestamp": "2026-01-21T10:30:00Z",
        "request_id": "uuid"
    }
}
```

#### Paginated Response
```json
{
    "success": true,
    "data": [],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 150,
        "total_pages": 8,
        "has_next": true,
        "has_previous": false
    },
    "meta": {
        "timestamp": "2026-01-21T10:30:00Z",
        "request_id": "uuid"
    }
}
```

### 8.3 Invoice Endpoints

#### 8.3.1 Create Invoice Draft

**Endpoint:** `POST /api/v1/invoices`
**Permission:** `invoice:create`

**Request Body:**
```json
{
    "customer_id": "uuid",
    "invoice_date": "2026-01-21",
    "due_date": "2026-02-20",
    "internal_notes": "Optional internal notes",
    "customer_notes": "Optional notes visible to customer",
    "lines": [
        {
            "description": "Consulting Services - January 2026",
            "quantity": 40,
            "unit_price": 150.00,
            "tax_code_id": "uuid",
            "revenue_account_id": "uuid"
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
        "invoice_number": "INV-000001",
        "customer_id": "uuid",
        "customer": {
            "id": "uuid",
            "name": "Acme Corporation",
            "email": "billing@acme.com"
        },
        "invoice_date": "2026-01-21",
        "due_date": "2026-02-20",
        "subtotal": 6000.00,
        "tax_total": 495.00,
        "total_amount": 6495.00,
        "balance_due": 6495.00,
        "status": "draft",
        "lines": [
            {
                "id": "uuid",
                "line_number": 1,
                "description": "Consulting Services - January 2026",
                "quantity": 40.00,
                "unit_price": 150.00,
                "line_total": 6000.00,
                "tax_code_id": "uuid",
                "tax_rate": 0.0825,
                "tax_amount": 495.00,
                "revenue_account_id": "uuid"
            }
        ],
        "created_at": "2026-01-21T10:30:00Z",
        "created_by": "uuid"
    }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CUSTOMER_NOT_FOUND` | 404 | Customer ID does not exist |
| `INVALID_DATE_RANGE` | 400 | Due date before invoice date |
| `TAX_CODE_NOT_FOUND` | 404 | Tax code ID does not exist |
| `ACCOUNT_NOT_FOUND` | 404 | Revenue account ID does not exist |
| `VALIDATION_ERROR` | 400 | General validation failure |

---

#### 8.3.2 Get Invoice

**Endpoint:** `GET /api/v1/invoices/{invoice_id}`
**Permission:** `invoice:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "invoice_number": "INV-000001",
        "customer_id": "uuid",
        "customer": {
            "id": "uuid",
            "name": "Acme Corporation",
            "email": "billing@acme.com"
        },
        "invoice_date": "2026-01-21",
        "due_date": "2026-02-20",
        "subtotal": 6000.00,
        "tax_total": 495.00,
        "total_amount": 6495.00,
        "balance_due": 6495.00,
        "status": "draft",
        "posted_at": null,
        "posted_by": null,
        "voided_at": null,
        "voided_by": null,
        "void_reason": null,
        "internal_notes": "Optional internal notes",
        "customer_notes": "Optional notes visible to customer",
        "lines": [],
        "journal_entries": [],
        "created_at": "2026-01-21T10:30:00Z",
        "updated_at": "2026-01-21T10:30:00Z",
        "created_by": "uuid",
        "updated_by": "uuid"
    }
}
```

---

#### 8.3.3 List Invoices

**Endpoint:** `GET /api/v1/invoices`
**Permission:** `invoice:read`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 100) |
| `status` | string | - | Filter by status (draft, posted, void) |
| `customer_id` | uuid | - | Filter by customer |
| `date_from` | date | - | Invoice date from |
| `date_to` | date | - | Invoice date to |
| `search` | string | - | Search in invoice number, customer name |
| `sort_by` | string | created_at | Sort field |
| `sort_order` | string | desc | Sort order (asc, desc) |

**Example:** `GET /api/v1/invoices?status=posted&date_from=2026-01-01&sort_by=invoice_date`

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "invoice_number": "INV-000001",
            "customer": {
                "id": "uuid",
                "name": "Acme Corporation"
            },
            "invoice_date": "2026-01-21",
            "due_date": "2026-02-20",
            "total_amount": 6495.00,
            "balance_due": 6495.00,
            "status": "posted"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 1,
        "total_pages": 1
    }
}
```

---

#### 8.3.4 Update Invoice Draft

**Endpoint:** `PUT /api/v1/invoices/{invoice_id}`
**Permission:** `invoice:update`
**Constraint:** Invoice must be in `draft` status

**Request Body:**
```json
{
    "customer_id": "uuid",
    "invoice_date": "2026-01-22",
    "due_date": "2026-02-21",
    "internal_notes": "Updated notes",
    "customer_notes": "Updated customer notes"
}
```

**Response (200 OK):** Same as Get Invoice

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVOICE_NOT_EDITABLE` | 400 | Invoice is not in draft status |

---

#### 8.3.5 Delete Invoice Draft

**Endpoint:** `DELETE /api/v1/invoices/{invoice_id}`
**Permission:** `invoice:delete`
**Constraint:** Invoice must be in `draft` status

**Response (204 No Content)**

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVOICE_NOT_DELETABLE` | 400 | Invoice is not in draft status |

---

#### 8.3.6 Post Invoice

**Endpoint:** `POST /api/v1/invoices/{invoice_id}/post`
**Permission:** `invoice:post`
**Constraint:** Invoice must be in `draft` status

**Request Body:**
```json
{
    "posting_date": "2026-01-21"  // Optional, defaults to invoice_date
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "invoice_number": "INV-000001",
        "status": "posted",
        "posted_at": "2026-01-21T10:35:00Z",
        "posted_by": "uuid",
        "journal_entry": {
            "id": "uuid",
            "entry_number": "JE-000001",
            "entry_date": "2026-01-21",
            "total_debit": 6495.00,
            "total_credit": 6495.00,
            "lines": [
                {
                    "account_code": "1100",
                    "account_name": "Accounts Receivable",
                    "debit_amount": 6495.00,
                    "credit_amount": 0
                },
                {
                    "account_code": "4000",
                    "account_name": "Sales Revenue",
                    "debit_amount": 0,
                    "credit_amount": 6000.00
                },
                {
                    "account_code": "2100",
                    "account_name": "Sales Tax Payable",
                    "debit_amount": 0,
                    "credit_amount": 495.00
                }
            ]
        }
    }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVOICE_ALREADY_POSTED` | 400 | Invoice is already posted |
| `INVOICE_NO_LINES` | 400 | Invoice has no line items |
| `FISCAL_PERIOD_CLOSED` | 400 | Invoice date falls in closed fiscal period |
| `FISCAL_PERIOD_NOT_FOUND` | 400 | No fiscal period found for invoice date |

---

#### 8.3.7 Void Invoice

**Endpoint:** `POST /api/v1/invoices/{invoice_id}/void`
**Permission:** `invoice:void`
**Constraint:** Invoice must be in `posted` status

**Request Body:**
```json
{
    "void_reason": "Customer cancelled order - duplicate invoice"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "invoice_number": "INV-000001",
        "status": "void",
        "voided_at": "2026-01-22T09:00:00Z",
        "voided_by": "uuid",
        "void_reason": "Customer cancelled order - duplicate invoice",
        "reversing_journal_entry": {
            "id": "uuid",
            "entry_number": "JE-000002",
            "entry_date": "2026-01-22",
            "description": "Void Invoice INV-000001",
            "total_debit": 6495.00,
            "total_credit": 6495.00,
            "lines": [
                {
                    "account_code": "4000",
                    "account_name": "Sales Revenue",
                    "debit_amount": 6000.00,
                    "credit_amount": 0
                },
                {
                    "account_code": "2100",
                    "account_name": "Sales Tax Payable",
                    "debit_amount": 495.00,
                    "credit_amount": 0
                },
                {
                    "account_code": "1100",
                    "account_name": "Accounts Receivable",
                    "debit_amount": 0,
                    "credit_amount": 6495.00
                }
            ]
        }
    }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVOICE_NOT_POSTED` | 400 | Only posted invoices can be voided |
| `INVOICE_ALREADY_VOID` | 400 | Invoice is already voided |
| `INVOICE_HAS_PAYMENTS` | 400 | Cannot void invoice with payments applied |
| `VOID_REASON_REQUIRED` | 400 | Void reason is required |

---

### 8.4 Invoice Line Endpoints

#### 8.4.1 Add Invoice Line

**Endpoint:** `POST /api/v1/invoices/{invoice_id}/lines`
**Permission:** `invoice_line:create`
**Constraint:** Invoice must be in `draft` status

**Request Body:**
```json
{
    "description": "Additional consulting hours",
    "quantity": 8,
    "unit_price": 150.00,
    "tax_code_id": "uuid",
    "revenue_account_id": "uuid"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "line_number": 2,
        "description": "Additional consulting hours",
        "quantity": 8.00,
        "unit_price": 150.00,
        "line_total": 1200.00,
        "tax_code_id": "uuid",
        "tax_rate": 0.0825,
        "tax_amount": 99.00,
        "revenue_account_id": "uuid"
    },
    "invoice_totals": {
        "subtotal": 7200.00,
        "tax_total": 594.00,
        "total_amount": 7794.00,
        "balance_due": 7794.00
    }
}
```

---

#### 8.4.2 Update Invoice Line

**Endpoint:** `PUT /api/v1/invoices/{invoice_id}/lines/{line_id}`
**Permission:** `invoice_line:update`
**Constraint:** Invoice must be in `draft` status

**Request Body:**
```json
{
    "description": "Updated description",
    "quantity": 10,
    "unit_price": 160.00,
    "tax_code_id": "uuid",
    "revenue_account_id": "uuid"
}
```

**Response (200 OK):** Same as Add Invoice Line

---

#### 8.4.3 Remove Invoice Line

**Endpoint:** `DELETE /api/v1/invoices/{invoice_id}/lines/{line_id}`
**Permission:** `invoice_line:delete`
**Constraint:** Invoice must be in `draft` status

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "deleted_line_id": "uuid"
    },
    "invoice_totals": {
        "subtotal": 6000.00,
        "tax_total": 495.00,
        "total_amount": 6495.00,
        "balance_due": 6495.00
    }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `LAST_LINE_CANNOT_DELETE` | 400 | Cannot delete the last line item |

---

### 8.5 Calculation Endpoint

#### 8.5.1 Calculate Invoice Totals

**Endpoint:** `POST /api/v1/invoices/calculate`
**Permission:** `invoice:read`

This endpoint allows previewing calculations before creating an invoice.

**Request Body:**
```json
{
    "lines": [
        {
            "quantity": 40,
            "unit_price": 150.00,
            "tax_code_id": "uuid"
        },
        {
            "quantity": 8,
            "unit_price": 150.00,
            "tax_code_id": "uuid"
        }
    ]
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "lines": [
            {
                "quantity": 40.00,
                "unit_price": 150.00,
                "line_total": 6000.00,
                "tax_rate": 0.0825,
                "tax_amount": 495.00
            },
            {
                "quantity": 8.00,
                "unit_price": 150.00,
                "line_total": 1200.00,
                "tax_rate": 0.0825,
                "tax_amount": 99.00
            }
        ],
        "subtotal": 7200.00,
        "tax_total": 594.00,
        "total_amount": 7794.00
    }
}
```

---

## 9. Business Logic & Pseudocode

### 9.1 Create Invoice Draft

```pseudocode
FUNCTION create_invoice_draft(data: InvoiceCreateDTO, user: User) -> Invoice

    // Permission check
    IF NOT user.has_permission('invoice:create') THEN
        THROW ForbiddenError("Insufficient permissions")
    END IF

    // Validate customer exists
    customer = CustomerRepository.find(data.customer_id)
    IF customer IS NULL THEN
        THROW NotFoundError("Customer not found")
    END IF

    // Validate date range
    IF data.due_date < data.invoice_date THEN
        THROW ValidationError("Due date cannot be before invoice date")
    END IF

    // Generate invoice number
    invoice_number = get_next_invoice_number(user.organization_id)

    // Begin transaction
    BEGIN TRANSACTION

        // Create invoice header
        invoice = Invoice.create({
            organization_id: user.organization_id,
            invoice_number: invoice_number,
            customer_id: data.customer_id,
            invoice_date: data.invoice_date,
            due_date: data.due_date,
            status: 'draft',
            subtotal: 0,
            tax_total: 0,
            total_amount: 0,
            balance_due: 0,
            internal_notes: data.internal_notes,
            customer_notes: data.customer_notes,
            created_by: user.id
        })

        // Add lines if provided
        IF data.lines IS NOT EMPTY THEN
            FOR EACH line_data IN data.lines
                add_invoice_line(invoice.id, line_data, user)
            END FOR

            // Recalculate totals
            calculate_invoice_totals(invoice.id)
        END IF

    COMMIT TRANSACTION

    // Audit log
    AuditLog.record('invoices', invoice.id, 'INSERT', null, invoice)

    RETURN invoice

END FUNCTION
```

### 9.2 Calculate Invoice Totals

```pseudocode
FUNCTION calculate_invoice_totals(invoice_id: UUID) -> InvoiceTotals

    // Get all lines for this invoice
    lines = InvoiceLineRepository.find_by_invoice(invoice_id)

    subtotal = 0
    tax_total = 0

    FOR EACH line IN lines
        // Calculate line total
        line.line_total = line.quantity * line.unit_price

        // Calculate tax
        IF line.tax_code_id IS NOT NULL THEN
            tax_code = TaxCodeRepository.find(line.tax_code_id)
            line.tax_rate = tax_code.rate
            line.tax_amount = line.line_total * tax_code.rate
        ELSE
            line.tax_rate = 0
            line.tax_amount = 0
        END IF

        // Update line
        InvoiceLineRepository.update(line)

        // Accumulate totals
        subtotal = subtotal + line.line_total
        tax_total = tax_total + line.tax_amount
    END FOR

    total_amount = subtotal + tax_total

    // Update invoice totals
    InvoiceRepository.update_totals(invoice_id, {
        subtotal: subtotal,
        tax_total: tax_total,
        total_amount: total_amount,
        balance_due: total_amount
    })

    RETURN {
        subtotal: subtotal,
        tax_total: tax_total,
        total_amount: total_amount,
        balance_due: total_amount
    }

END FUNCTION
```

### 9.3 Post Invoice (Critical)

```pseudocode
FUNCTION post_invoice(invoice_id: UUID, posting_date: Date?, user: User) -> PostedInvoice

    // Permission check
    IF NOT user.has_permission('invoice:post') THEN
        THROW ForbiddenError("Insufficient permissions")
    END IF

    // Get invoice with lines
    invoice = InvoiceRepository.find_with_lines(invoice_id)

    IF invoice IS NULL THEN
        THROW NotFoundError("Invoice not found")
    END IF

    // ============================================
    // VALIDATION PHASE
    // ============================================

    // 1. Check status
    IF invoice.status != 'draft' THEN
        THROW BusinessRuleError("Only draft invoices can be posted")
    END IF

    // 2. Check lines exist
    IF invoice.lines IS EMPTY THEN
        THROW BusinessRuleError("Invoice must have at least one line item")
    END IF

    // 3. Validate all lines
    FOR EACH line IN invoice.lines
        IF line.quantity <= 0 THEN
            THROW ValidationError("Line quantity must be greater than 0")
        END IF
        IF line.unit_price < 0 THEN
            THROW ValidationError("Line unit price cannot be negative")
        END IF
    END FOR

    // 4. Verify totals are correct
    calculated_totals = calculate_invoice_totals(invoice_id)
    IF calculated_totals.total_amount != invoice.total_amount THEN
        // Auto-fix the totals
        invoice.subtotal = calculated_totals.subtotal
        invoice.tax_total = calculated_totals.tax_total
        invoice.total_amount = calculated_totals.total_amount
        invoice.balance_due = calculated_totals.total_amount
    END IF

    // 5. Validate fiscal period
    effective_date = posting_date ?? invoice.invoice_date
    fiscal_period = FiscalPeriodRepository.find_for_date(
        invoice.organization_id,
        effective_date
    )

    IF fiscal_period IS NULL THEN
        THROW BusinessRuleError("No fiscal period found for date: " + effective_date)
    END IF

    IF fiscal_period.is_closed THEN
        THROW BusinessRuleError("Fiscal period is closed: " + fiscal_period.period_name)
    END IF

    // ============================================
    // ACCOUNT RESOLUTION PHASE
    // ============================================

    // Get customer's AR account
    customer = CustomerRepository.find(invoice.customer_id)
    ar_account = ChartOfAccountsRepository.find(customer.ar_account_id)

    IF ar_account IS NULL OR ar_account.account_subtype != 'ACCOUNTS_RECEIVABLE' THEN
        THROW ConfigurationError("Invalid AR account for customer")
    END IF

    // Collect all revenue accounts and tax accounts
    revenue_entries = []
    tax_entries = []

    FOR EACH line IN invoice.lines
        // Revenue account
        revenue_account = ChartOfAccountsRepository.find(line.revenue_account_id)
        IF revenue_account IS NULL OR revenue_account.account_type != 'REVENUE' THEN
            THROW ConfigurationError("Invalid revenue account for line: " + line.line_number)
        END IF

        // Aggregate by account (in case multiple lines use same account)
        existing = revenue_entries.find(e => e.account_id == line.revenue_account_id)
        IF existing THEN
            existing.amount = existing.amount + line.line_total
        ELSE
            revenue_entries.append({
                account_id: line.revenue_account_id,
                account: revenue_account,
                amount: line.line_total
            })
        END IF

        // Tax account (if applicable)
        IF line.tax_code_id IS NOT NULL AND line.tax_amount > 0 THEN
            tax_code = TaxCodeRepository.find(line.tax_code_id)
            tax_account = ChartOfAccountsRepository.find(tax_code.tax_account_id)

            IF tax_account IS NULL OR tax_account.account_subtype != 'TAX_PAYABLE' THEN
                THROW ConfigurationError("Invalid tax account for tax code: " + tax_code.code)
            END IF

            existing_tax = tax_entries.find(e => e.account_id == tax_code.tax_account_id)
            IF existing_tax THEN
                existing_tax.amount = existing_tax.amount + line.tax_amount
            ELSE
                tax_entries.append({
                    account_id: tax_code.tax_account_id,
                    account: tax_account,
                    amount: line.tax_amount
                })
            END IF
        END IF
    END FOR

    // ============================================
    // JOURNAL ENTRY CREATION PHASE
    // ============================================

    BEGIN TRANSACTION

        // Generate journal entry number
        entry_number = get_next_journal_entry_number(invoice.organization_id)

        // Create journal entry header
        journal_entry = JournalEntry.create({
            organization_id: invoice.organization_id,
            entry_number: entry_number,
            entry_date: effective_date,
            description: "Invoice " + invoice.invoice_number + " - " + customer.name,
            reference: invoice.invoice_number,
            source_type: 'INVOICE',
            source_id: invoice.id,
            fiscal_period_id: fiscal_period.id,
            is_posted: true,
            total_debit: invoice.total_amount,
            total_credit: invoice.total_amount,
            created_by: user.id
        })

        line_number = 1

        // DEBIT: Accounts Receivable
        JournalLine.create({
            journal_entry_id: journal_entry.id,
            account_id: ar_account.id,
            debit_amount: invoice.total_amount,
            credit_amount: 0,
            description: "Invoice " + invoice.invoice_number,
            line_number: line_number++
        })

        // CREDIT: Revenue Account(s)
        FOR EACH revenue IN revenue_entries
            JournalLine.create({
                journal_entry_id: journal_entry.id,
                account_id: revenue.account_id,
                debit_amount: 0,
                credit_amount: revenue.amount,
                description: "Revenue - Invoice " + invoice.invoice_number,
                line_number: line_number++
            })
        END FOR

        // CREDIT: Tax Payable (if any)
        FOR EACH tax IN tax_entries
            JournalLine.create({
                journal_entry_id: journal_entry.id,
                account_id: tax.account_id,
                debit_amount: 0,
                credit_amount: tax.amount,
                description: "Tax - Invoice " + invoice.invoice_number,
                line_number: line_number++
            })
        END FOR

        // ============================================
        // LEDGER UPDATE PHASE
        // ============================================

        // Update account balances
        // DEBIT increases Asset accounts (AR)
        ChartOfAccountsRepository.adjust_balance(ar_account.id, invoice.total_amount)

        // CREDIT increases Revenue accounts
        FOR EACH revenue IN revenue_entries
            ChartOfAccountsRepository.adjust_balance(revenue.account_id, revenue.amount)
        END FOR

        // CREDIT increases Liability accounts (Tax Payable)
        FOR EACH tax IN tax_entries
            ChartOfAccountsRepository.adjust_balance(tax.account_id, tax.amount)
        END FOR

        // ============================================
        // INVOICE STATUS UPDATE PHASE
        // ============================================

        InvoiceRepository.update(invoice.id, {
            status: 'posted',
            posted_at: CURRENT_TIMESTAMP,
            posted_by: user.id,
            fiscal_period_id: fiscal_period.id,
            updated_at: CURRENT_TIMESTAMP,
            updated_by: user.id
        })

    COMMIT TRANSACTION

    // Audit log
    AuditLog.record('invoices', invoice.id, 'UPDATE',
        {status: 'draft'},
        {status: 'posted', posted_at: CURRENT_TIMESTAMP}
    )

    // Return posted invoice with journal entry
    RETURN {
        invoice: InvoiceRepository.find_with_lines(invoice_id),
        journal_entry: JournalEntryRepository.find_with_lines(journal_entry.id)
    }

END FUNCTION
```

### 9.4 Void Invoice (Critical)

```pseudocode
FUNCTION void_invoice(invoice_id: UUID, void_reason: String, user: User) -> VoidedInvoice

    // Permission check
    IF NOT user.has_permission('invoice:void') THEN
        THROW ForbiddenError("Insufficient permissions")
    END IF

    // Validate reason
    IF void_reason IS NULL OR void_reason.trim() IS EMPTY THEN
        THROW ValidationError("Void reason is required")
    END IF

    // Get invoice
    invoice = InvoiceRepository.find_with_lines(invoice_id)

    IF invoice IS NULL THEN
        THROW NotFoundError("Invoice not found")
    END IF

    // ============================================
    // VALIDATION PHASE
    // ============================================

    // 1. Check status
    IF invoice.status == 'draft' THEN
        THROW BusinessRuleError("Draft invoices should be deleted, not voided")
    END IF

    IF invoice.status == 'void' THEN
        THROW BusinessRuleError("Invoice is already voided")
    END IF

    // 2. Check for payments (Phase 2 consideration)
    // IF PaymentRepository.has_payments_for_invoice(invoice_id) THEN
    //     THROW BusinessRuleError("Cannot void invoice with payments applied")
    // END IF

    // 3. Get original journal entry
    original_entry = JournalEntryRepository.find_by_source('INVOICE', invoice_id)

    IF original_entry IS NULL THEN
        THROW IntegrityError("Original journal entry not found for posted invoice")
    END IF

    // 4. Check fiscal period for void date
    void_date = CURRENT_DATE
    fiscal_period = FiscalPeriodRepository.find_for_date(
        invoice.organization_id,
        void_date
    )

    IF fiscal_period IS NULL THEN
        THROW BusinessRuleError("No fiscal period found for void date")
    END IF

    IF fiscal_period.is_closed THEN
        THROW BusinessRuleError("Current fiscal period is closed")
    END IF

    // ============================================
    // REVERSING JOURNAL ENTRY CREATION
    // ============================================

    BEGIN TRANSACTION

        // Generate entry number
        entry_number = get_next_journal_entry_number(invoice.organization_id)

        // Create reversing journal entry
        reversing_entry = JournalEntry.create({
            organization_id: invoice.organization_id,
            entry_number: entry_number,
            entry_date: void_date,
            description: "VOID: Invoice " + invoice.invoice_number + " - " + void_reason,
            reference: "VOID-" + invoice.invoice_number,
            source_type: 'INVOICE_VOID',
            source_id: invoice.id,
            fiscal_period_id: fiscal_period.id,
            is_posted: true,
            total_debit: original_entry.total_debit,
            total_credit: original_entry.total_credit,
            created_by: user.id
        })

        // Create reversed lines (swap debits and credits)
        original_lines = JournalLineRepository.find_by_entry(original_entry.id)
        line_number = 1

        FOR EACH original_line IN original_lines
            JournalLine.create({
                journal_entry_id: reversing_entry.id,
                account_id: original_line.account_id,
                debit_amount: original_line.credit_amount,   // Swap!
                credit_amount: original_line.debit_amount,   // Swap!
                description: "VOID: " + original_line.description,
                line_number: line_number++
            })

            // Update account balance (reverse the original impact)
            IF original_line.debit_amount > 0 THEN
                // Original was debit, now credit
                ChartOfAccountsRepository.adjust_balance(
                    original_line.account_id,
                    -original_line.debit_amount
                )
            ELSE
                // Original was credit, now debit
                ChartOfAccountsRepository.adjust_balance(
                    original_line.account_id,
                    -original_line.credit_amount
                )
            END IF
        END FOR

        // ============================================
        // UPDATE INVOICE STATUS
        // ============================================

        InvoiceRepository.update(invoice.id, {
            status: 'void',
            voided_at: CURRENT_TIMESTAMP,
            voided_by: user.id,
            void_reason: void_reason,
            balance_due: 0,
            updated_at: CURRENT_TIMESTAMP,
            updated_by: user.id
        })

    COMMIT TRANSACTION

    // Audit log
    AuditLog.record('invoices', invoice.id, 'UPDATE',
        {status: 'posted'},
        {status: 'void', voided_at: CURRENT_TIMESTAMP, void_reason: void_reason}
    )

    RETURN {
        invoice: InvoiceRepository.find(invoice_id),
        reversing_entry: JournalEntryRepository.find_with_lines(reversing_entry.id)
    }

END FUNCTION
```

### 9.5 Permission Check Middleware

```pseudocode
FUNCTION check_permission(required_permission: String) -> Middleware

    RETURN FUNCTION(request, response, next)

        // Extract user from JWT
        user = request.user

        IF user IS NULL THEN
            RETURN response.status(401).json({
                error: "UNAUTHORIZED",
                message: "Authentication required"
            })
        END IF

        // Get user's permissions (cached)
        permissions = PermissionCache.get_user_permissions(user.id)

        IF permissions IS NULL THEN
            // Load from database
            roles = UserRoleRepository.find_roles_for_user(user.id)
            permissions = []

            FOR EACH role IN roles
                role_permissions = RolePermissionRepository.find_permissions_for_role(role.id)
                permissions = permissions.union(role_permissions)
            END FOR

            // Cache for 5 minutes
            PermissionCache.set(user.id, permissions, TTL: 300)
        END IF

        // Check if user has required permission
        has_permission = permissions.any(p =>
            p.code == required_permission OR
            p.code == '*:*' OR
            p.code.endsWith(':*') AND required_permission.startsWith(p.code.replace(':*', ':'))
        )

        IF NOT has_permission THEN
            RETURN response.status(403).json({
                error: "FORBIDDEN",
                message: "Insufficient permissions",
                required: required_permission
            })
        END IF

        next()

    END FUNCTION

END FUNCTION
```

---

## 10. Validation Rules

### 10.1 Invoice Header Validations

| Field | Rule | Error Code |
|-------|------|------------|
| `customer_id` | Must exist and be active | `CUSTOMER_NOT_FOUND` |
| `invoice_date` | Required, valid date | `INVALID_DATE` |
| `invoice_date` | Must be within open fiscal period | `FISCAL_PERIOD_CLOSED` |
| `due_date` | Required, valid date | `INVALID_DATE` |
| `due_date` | Must be >= invoice_date | `INVALID_DATE_RANGE` |
| `status` | Must be valid enum value | `INVALID_STATUS` |

### 10.2 Invoice Line Validations

| Field | Rule | Error Code |
|-------|------|------------|
| `description` | Required, max 500 chars | `INVALID_DESCRIPTION` |
| `quantity` | Required, > 0 | `INVALID_QUANTITY` |
| `unit_price` | Required, >= 0 | `INVALID_UNIT_PRICE` |
| `tax_code_id` | If provided, must exist | `TAX_CODE_NOT_FOUND` |
| `revenue_account_id` | Required, must be REVENUE type | `INVALID_REVENUE_ACCOUNT` |

### 10.3 Posting Validations

| Rule | Error Code |
|------|------------|
| Invoice must be in draft status | `INVOICE_ALREADY_POSTED` |
| Invoice must have at least one line | `INVOICE_NO_LINES` |
| Invoice date must be in open fiscal period | `FISCAL_PERIOD_CLOSED` |
| Total amount must equal subtotal + tax | `CALCULATION_ERROR` |
| All account references must be valid | `INVALID_ACCOUNT` |

### 10.4 Void Validations

| Rule | Error Code |
|------|------------|
| Invoice must be posted | `INVOICE_NOT_POSTED` |
| Invoice must not already be void | `INVOICE_ALREADY_VOID` |
| Invoice must not have payments | `INVOICE_HAS_PAYMENTS` |
| Void reason is required | `VOID_REASON_REQUIRED` |
| Current date must be in open fiscal period | `FISCAL_PERIOD_CLOSED` |

---

## 11. Edge Cases & Failure Scenarios

### 11.1 Race Conditions

#### Scenario: Concurrent Post Attempts
**Problem:** Two users attempt to post the same invoice simultaneously.
**Solution:**
- Use optimistic locking with version column
- First transaction wins, second fails with `INVOICE_ALREADY_POSTED`

```sql
-- Add version column for optimistic locking
ALTER TABLE invoices ADD COLUMN version INTEGER DEFAULT 1;

-- Update trigger
UPDATE invoices
SET status = 'posted', version = version + 1
WHERE id = ? AND status = 'draft' AND version = ?;

-- Check rows affected - if 0, someone else modified it
```

#### Scenario: Line Modification During Post
**Problem:** User adds line while another user is posting.
**Solution:**
- Transaction isolation level: SERIALIZABLE for post operation
- OR use explicit row locks: `SELECT FOR UPDATE`

### 11.2 Data Integrity Scenarios

#### Scenario: Orphaned Journal Entry
**Problem:** Invoice posts, journal created, but invoice status update fails.
**Solution:**
- All operations in single transaction
- Journal entry references invoice via `source_id`
- Cleanup job for orphaned entries (defensive)

#### Scenario: Imbalanced Journal Entry
**Problem:** Calculation error causes debits != credits.
**Solution:**
- Database constraint: `CHECK (total_debit = total_credit)`
- Application validates before insert
- Recalculate totals before posting

#### Scenario: Customer Deleted After Invoice Created
**Problem:** Customer soft-deleted but has draft invoices.
**Solution:**
- Prevent customer deletion if active invoices exist
- OR cascade to void/archive associated invoices
- Foreign key with ON DELETE RESTRICT

### 11.3 Fiscal Period Scenarios

#### Scenario: Invoice Date Changed to Closed Period
**Problem:** User edits invoice date to a closed period, then tries to post.
**Solution:**
- Validate fiscal period on post, not on save
- Return clear error: "Cannot post to closed period: January 2026"

#### Scenario: No Fiscal Period Exists
**Problem:** Invoice date falls outside any defined fiscal period.
**Solution:**
- Return error: "No fiscal period found for date"
- Admin must create fiscal period first

### 11.4 Numerical Precision Scenarios

#### Scenario: Floating Point Rounding Errors
**Problem:** 0.1 + 0.2 != 0.3 in floating point.
**Solution:**
- Use DECIMAL(18,2) in database
- Use decimal arithmetic library in application
- Round all calculations to 2 decimal places

#### Scenario: Very Large Invoice
**Problem:** Invoice total exceeds DECIMAL(18,2) range.
**Solution:**
- DECIMAL(18,2) supports up to 9,999,999,999,999,999.99
- Add application validation for reasonable limits
- Alert for invoices exceeding threshold

### 11.5 Error Recovery Scenarios

#### Scenario: Partial Post Failure
**Problem:** Power failure during post transaction.
**Solution:**
- Transaction ensures atomicity
- On restart, invoice remains in draft
- No partial journal entries

#### Scenario: Void Partial Failure
**Problem:** Reversing entry created but invoice status not updated.
**Solution:**
- Single transaction for all void operations
- If fails, nothing persists
- Retry safe

---

## 12. Assumptions

### 12.1 System Assumptions

| # | Assumption | Impact if Invalid |
|---|------------|-------------------|
| 1 | Single currency (base currency) for Phase 1 | Add currency_id fields later |
| 2 | Tax is calculated per line item | May need invoice-level tax option |
| 3 | One organization per database tenant | Multi-org needs schema changes |
| 4 | Sequential invoice numbers per organization | Concurrent number generation handled |
| 5 | Fiscal periods are pre-configured | Add auto-generation if needed |

### 12.2 Business Assumptions

| # | Assumption | Impact if Invalid |
|---|------------|-------------------|
| 1 | Invoices always credit revenue immediately | Deferred revenue needs separate account |
| 2 | Tax is always a liability (payable) | Input tax/refunds need different treatment |
| 3 | Customer always has one AR account | Multiple AR accounts need line-level assignment |
| 4 | Invoice voiding is reversing, not deletion | Historical audit requires this approach |
| 5 | Posted invoices never change | Adjustments via credit notes (Phase 2) |

### 12.3 Technical Assumptions

| # | Assumption | Impact if Invalid |
|---|------------|-------------------|
| 1 | PostgreSQL 14+ for UUID, JSONB support | Adjust syntax for older versions |
| 2 | Application handles transaction management | If using stored procs, move logic |
| 3 | Cache available for permission lookups | Performance impact without cache |
| 4 | UTC timezone for all timestamps | Add timezone handling if needed |
| 5 | API is stateless (JWT auth) | Session handling if different |

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Accounts Receivable (AR)** | Money owed to the company by customers for goods/services delivered |
| **Chart of Accounts (COA)** | Complete listing of all accounts used in the general ledger |
| **Credit** | Right side of journal entry; increases liability, equity, revenue |
| **Debit** | Left side of journal entry; increases asset, expense |
| **Double-Entry Accounting** | System where every transaction affects at least two accounts |
| **Draft Invoice** | Unpublished invoice that can be edited; no accounting impact |
| **Fiscal Period** | Accounting time period (usually monthly) for financial reporting |
| **General Ledger** | Master record of all financial transactions |
| **Journal Entry** | Record of a financial transaction with debits and credits |
| **Posted Invoice** | Finalized invoice; immutable; creates journal entries |
| **Revenue Recognition** | Accounting principle determining when revenue is recorded |
| **Reversing Entry** | Journal entry that reverses a previous entry (used in voiding) |
| **Tax Payable** | Liability account for taxes collected but not yet remitted |
| **Void Invoice** | Posted invoice that has been cancelled via reversing entry |

---

## Appendix A: Sample Data

### A.1 Chart of Accounts Setup

```sql
-- Standard accounts for invoice module
INSERT INTO chart_of_accounts (organization_id, account_code, account_name, account_type, account_subtype) VALUES
('org-uuid', '1100', 'Accounts Receivable', 'ASSET', 'ACCOUNTS_RECEIVABLE'),
('org-uuid', '2100', 'Sales Tax Payable', 'LIABILITY', 'TAX_PAYABLE'),
('org-uuid', '4000', 'Sales Revenue', 'REVENUE', 'OPERATING_REVENUE'),
('org-uuid', '4010', 'Service Revenue', 'REVENUE', 'OPERATING_REVENUE'),
('org-uuid', '4020', 'Consulting Revenue', 'REVENUE', 'OPERATING_REVENUE');
```

### A.2 Tax Codes Setup

```sql
INSERT INTO tax_codes (organization_id, code, name, rate, tax_account_id) VALUES
('org-uuid', 'STANDARD', 'Standard Tax 8.25%', 0.0825, 'tax-account-uuid'),
('org-uuid', 'REDUCED', 'Reduced Tax 5%', 0.0500, 'tax-account-uuid'),
('org-uuid', 'EXEMPT', 'Tax Exempt', 0.0000, 'tax-account-uuid');
```

---

## Appendix B: API Error Code Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `CUSTOMER_NOT_FOUND` | 404 | Customer does not exist |
| `INVOICE_NOT_FOUND` | 404 | Invoice does not exist |
| `INVOICE_NOT_EDITABLE` | 400 | Invoice is not in draft status |
| `INVOICE_NOT_DELETABLE` | 400 | Invoice is not in draft status |
| `INVOICE_ALREADY_POSTED` | 400 | Invoice is already posted |
| `INVOICE_NOT_POSTED` | 400 | Invoice is not posted |
| `INVOICE_ALREADY_VOID` | 400 | Invoice is already void |
| `INVOICE_NO_LINES` | 400 | Invoice has no line items |
| `INVOICE_HAS_PAYMENTS` | 400 | Invoice has payments applied |
| `FISCAL_PERIOD_CLOSED` | 400 | Fiscal period is closed |
| `FISCAL_PERIOD_NOT_FOUND` | 400 | No fiscal period for date |
| `TAX_CODE_NOT_FOUND` | 404 | Tax code does not exist |
| `ACCOUNT_NOT_FOUND` | 404 | Account does not exist |
| `INVALID_ACCOUNT` | 400 | Account type mismatch |
| `VOID_REASON_REQUIRED` | 400 | Void reason not provided |
| `CALCULATION_ERROR` | 500 | Internal calculation error |
| `LAST_LINE_CANNOT_DELETE` | 400 | Cannot delete last line |

---

**Document End**

*This documentation should be reviewed and approved before implementation begins.*
