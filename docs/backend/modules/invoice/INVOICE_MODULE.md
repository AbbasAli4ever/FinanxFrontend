# Invoice Module

**Module:** Invoice (Accounts Receivable)
**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Phase 1 - Core Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [Database Schema](#3-database-schema)
4. [State Machine](#4-state-machine)
5. [Data Flow](#5-data-flow)
6. [API Design](#6-api-design)
7. [Business Logic](#7-business-logic)
8. [Accounting Rules](#8-accounting-rules)
9. [Validation Rules](#9-validation-rules)
10. [Edge Cases](#10-edge-cases)
11. [Related Modules](#11-related-modules)

---

## 1. Overview

### 1.1 Purpose

The Invoice module manages **Accounts Receivable** transactions. It handles the complete lifecycle of sales invoices from draft creation through posting (which generates accounting entries) to voiding.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Invoice Management** | Create, edit, delete draft invoices |
| **Line Item Management** | Add, edit, remove line items with tax |
| **Invoice Posting** | Transition to posted with journal entry |
| **Invoice Voiding** | Reverse posted invoices |
| **AR Recognition** | Create Accounts Receivable on posting |

### 1.3 Business Context

An **Invoice** represents:
- A sale of goods or services to a customer
- A legal document requesting payment
- A source document for AR recognition
- A trigger for Revenue recognition upon posting

### 1.4 Phase 1 Scope

**Included:**
- Invoice CRUD (draft only editable)
- Line item management
- Tax calculation
- Posting with journal entry generation
- Voiding with reversing entry

**Excluded (Future Phases):**
- Payment recording (Phase 2)
- Credit notes (Phase 2)
- Multi-currency (Phase 3)
- Recurring invoices (Phase 3)

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Invoices scoped to org | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |
| Customer | Invoice to customer | [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md) |
| Chart of Accounts | Revenue & AR accounts | [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |
| Tax Codes | Line item tax | [TAX_CODES_MODULE.md](../tax-codes/TAX_CODES_MODULE.md) |
| Fiscal Period | Posting validation | [FISCAL_PERIOD_MODULE.md](../fiscal-period/FISCAL_PERIOD_MODULE.md) |
| Journal Entry | Auto-generated on post | [JOURNAL_ENTRY_MODULE.md](../journal-entry/JOURNAL_ENTRY_MODULE.md) |
| RBAC | Permissions | [RBAC_MODULE.md](../rbac/RBAC_MODULE.md) |

### 2.2 Dependency Diagram

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Organization │  │   Customer   │  │     COA      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │     INVOICE      │
               │    (Header)      │
               └────────┬─────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  Lines   │ │ Tax Code │ │  Fiscal  │
    │          │ │          │ │  Period  │
    └──────────┘ └──────────┘ └──────────┘
                        │
                        ▼ (on POST)
               ┌──────────────────┐
               │  Journal Entry   │
               └──────────────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            INVOICE SCHEMA                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ organizations│  │  customers   │  │ fiscal_period│  │    users     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       │ 1:N             │ 1:N             │ 1:N             │ created_by
       │                 │                 │                 │ posted_by
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              invoices                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY                                         │
│ organization_id     UUID NOT NULL FK                                         │
│ invoice_number      VARCHAR(50) UNIQUE per org                              │
│ customer_id         UUID NOT NULL FK                                         │
│ invoice_date        DATE NOT NULL                                            │
│ due_date            DATE NOT NULL                                            │
│ subtotal            DECIMAL(18,2) DEFAULT 0                                  │
│ tax_total           DECIMAL(18,2) DEFAULT 0                                  │
│ total_amount        DECIMAL(18,2) DEFAULT 0                                  │
│ balance_due         DECIMAL(18,2) DEFAULT 0                                  │
│ status              ENUM('draft','posted','void')                           │
│ posted_at           TIMESTAMP                                                │
│ posted_by           UUID FK                                                  │
│ voided_at           TIMESTAMP                                                │
│ voided_by           UUID FK                                                  │
│ void_reason         TEXT                                                     │
│ fiscal_period_id    UUID FK                                                  │
│ internal_notes      TEXT                                                     │
│ customer_notes      TEXT                                                     │
│ created_at          TIMESTAMP                                                │
│ created_by          UUID FK                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ 1:N
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           invoice_lines                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY                                         │
│ invoice_id          UUID NOT NULL FK                                         │
│ line_number         INTEGER NOT NULL                                         │
│ description         TEXT NOT NULL                                            │
│ quantity            DECIMAL(10,2) NOT NULL                                   │
│ unit_price          DECIMAL(18,2) NOT NULL                                   │
│ line_total          DECIMAL(18,2) NOT NULL                                   │
│ tax_code_id         UUID FK                                                  │
│ tax_rate            DECIMAL(7,4) DEFAULT 0                                   │
│ tax_amount          DECIMAL(18,2) DEFAULT 0                                  │
│ revenue_account_id  UUID NOT NULL FK                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Invoices Table

```sql
CREATE TYPE invoice_status AS ENUM ('draft', 'posted', 'void');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Identity
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Amounts
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Status
    status invoice_status NOT NULL DEFAULT 'draft',

    -- Posting
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES users(id),
    fiscal_period_id UUID REFERENCES fiscal_periods(id),

    -- Voiding
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,

    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    UNIQUE(organization_id, invoice_number)
);

-- Indexes
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_date ON invoices(organization_id, invoice_date);

-- Prevent modification of posted invoices
CREATE OR REPLACE FUNCTION prevent_posted_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' AND NEW.status = 'posted' THEN
        IF OLD.subtotal != NEW.subtotal OR
           OLD.tax_total != NEW.tax_total OR
           OLD.total_amount != NEW.total_amount OR
           OLD.customer_id != NEW.customer_id THEN
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
```

### 3.3 Invoice Lines Table

```sql
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Line Details
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    line_total DECIMAL(18,2) NOT NULL,

    -- Tax
    tax_code_id UUID REFERENCES tax_codes(id),
    tax_rate DECIMAL(7,4) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,

    -- Accounting
    revenue_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(invoice_id, line_number)
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
```

---

## 4. State Machine

### 4.1 Invoice States

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INVOICE STATE MACHINE                               │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │                 │
            CREATE            │     DRAFT       │◄───────┐
         ─────────────────────►                 │        │
                              │   (Editable)    │────────┘
                              │                 │   UPDATE
                              └────────┬────────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                          │ POST                    │ DELETE
                          │ (validates,             │ (hard delete)
                          │  creates journal)       │
                          ▼                         ▼
                 ┌─────────────────┐          (removed)
                 │                 │
                 │     POSTED      │
                 │                 │
                 │  (Immutable)    │
                 │                 │
                 └────────┬────────┘
                          │
                          │ VOID
                          │ (creates reversing
                          │  journal entry)
                          ▼
                 ┌─────────────────┐
                 │                 │
                 │      VOID       │
                 │                 │
                 │   (Terminal)    │
                 │                 │
                 └─────────────────┘
```

### 4.2 State Transition Rules

| From | To | Action | Validation |
|------|-----|--------|------------|
| - | draft | Create | - |
| draft | draft | Update | - |
| draft | - | Delete | Hard delete |
| draft | posted | Post | Lines exist, period open |
| posted | void | Void | No payments, reason required |
| void | - | - | Terminal state |

### 4.3 State Permissions

| State | Read | Update | Delete | Post | Void |
|-------|------|--------|--------|------|------|
| draft | Yes | Yes | Yes | Yes | No |
| posted | Yes | No | No | No | Yes |
| void | Yes | No | No | No | No |

---

## 5. Data Flow

### 5.1 Invoice Creation Flow

```
User                          API                           Database
  │                            │                              │
  │  POST /invoices            │                              │
  │  {customer_id, date, ...}  │                              │
  │───────────────────────────►│                              │
  │                            │  Validate customer exists    │
  │                            │─────────────────────────────►│
  │                            │◄─────────────────────────────│
  │                            │                              │
  │                            │  Generate invoice number     │
  │                            │─────────────────────────────►│
  │                            │◄─────────────────────────────│
  │                            │                              │
  │                            │  Create invoice (draft)      │
  │                            │─────────────────────────────►│
  │                            │◄─────────────────────────────│
  │                            │                              │
  │  {invoice object}          │                              │
  │◄───────────────────────────│                              │
```

### 5.2 Invoice Posting Flow (Critical)

```
User                          API                           Database
  │                            │                              │
  │  POST /invoices/{id}/post  │                              │
  │───────────────────────────►│                              │
  │                            │                              │
  │                            │  1. Validate status = draft  │
  │                            │  2. Validate lines exist     │
  │                            │  3. Validate fiscal period   │
  │                            │─────────────────────────────►│
  │                            │◄─────────────────────────────│
  │                            │                              │
  │                            │  4. Get customer AR account  │
  │                            │  5. Get revenue accounts     │
  │                            │  6. Get tax accounts         │
  │                            │─────────────────────────────►│
  │                            │◄─────────────────────────────│
  │                            │                              │
  │                            │  BEGIN TRANSACTION           │
  │                            │                              │
  │                            │  7. Create journal entry     │
  │                            │     DR: AR (total_amount)    │
  │                            │     CR: Revenue (subtotal)   │
  │                            │     CR: Tax (tax_total)      │
  │                            │─────────────────────────────►│
  │                            │                              │
  │                            │  8. Update invoice status    │
  │                            │─────────────────────────────►│
  │                            │                              │
  │                            │  COMMIT                      │
  │                            │                              │
  │  {posted invoice +         │                              │
  │   journal entry}           │                              │
  │◄───────────────────────────│                              │
```

### 5.3 Invoice Voiding Flow

```
User                          API                           Database
  │                            │                              │
  │  POST /invoices/{id}/void  │                              │
  │  {reason: "..."}           │                              │
  │───────────────────────────►│                              │
  │                            │                              │
  │                            │  1. Validate status = posted │
  │                            │  2. Validate no payments     │
  │                            │  3. Validate reason provided │
  │                            │                              │
  │                            │  BEGIN TRANSACTION           │
  │                            │                              │
  │                            │  4. Create reversing entry   │
  │                            │     DR: Revenue (subtotal)   │
  │                            │     DR: Tax (tax_total)      │
  │                            │     CR: AR (total_amount)    │
  │                            │─────────────────────────────►│
  │                            │                              │
  │                            │  5. Update invoice status    │
  │                            │─────────────────────────────►│
  │                            │                              │
  │                            │  COMMIT                      │
  │                            │                              │
  │  {voided invoice +         │                              │
  │   reversing entry}         │                              │
  │◄───────────────────────────│                              │
```

---

## 6. API Design

### 6.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/invoices` | `invoice:read` | List invoices |
| POST | `/api/v1/invoices` | `invoice:create` | Create draft |
| GET | `/api/v1/invoices/{id}` | `invoice:read` | Get invoice |
| PUT | `/api/v1/invoices/{id}` | `invoice:update` | Update draft |
| DELETE | `/api/v1/invoices/{id}` | `invoice:delete` | Delete draft |
| POST | `/api/v1/invoices/{id}/post` | `invoice:post` | Post invoice |
| POST | `/api/v1/invoices/{id}/void` | `invoice:void` | Void invoice |
| POST | `/api/v1/invoices/{id}/lines` | `invoice:update` | Add line |
| PUT | `/api/v1/invoices/{id}/lines/{lid}` | `invoice:update` | Update line |
| DELETE | `/api/v1/invoices/{id}/lines/{lid}` | `invoice:update` | Remove line |

### 6.2 Create Invoice

**Endpoint:** `POST /api/v1/invoices`

**Request:**
```json
{
    "customer_id": "uuid",
    "invoice_date": "2026-01-21",
    "due_date": "2026-02-20",
    "lines": [
        {
            "description": "Consulting Services",
            "quantity": 40,
            "unit_price": 150.00,
            "tax_code_id": "uuid",
            "revenue_account_id": "uuid"
        }
    ]
}
```

**Response (201):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "invoice_number": "INV-000001",
        "customer": {"id": "uuid", "name": "Acme Corp"},
        "invoice_date": "2026-01-21",
        "due_date": "2026-02-20",
        "subtotal": 6000.00,
        "tax_total": 495.00,
        "total_amount": 6495.00,
        "status": "draft",
        "lines": [...]
    }
}
```

### 6.3 Post Invoice

**Endpoint:** `POST /api/v1/invoices/{id}/post`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "invoice_number": "INV-000001",
        "status": "posted",
        "posted_at": "2026-01-21T10:30:00Z",
        "journal_entry": {
            "id": "uuid",
            "entry_number": "JE-2026-00001",
            "lines": [
                {"account": "1130 AR", "debit": 6495.00, "credit": 0},
                {"account": "4100 Revenue", "debit": 0, "credit": 6000.00},
                {"account": "2120 Tax", "debit": 0, "credit": 495.00}
            ]
        }
    }
}
```

### 6.4 Void Invoice

**Endpoint:** `POST /api/v1/invoices/{id}/void`

**Request:**
```json
{
    "void_reason": "Customer cancelled order"
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "status": "void",
        "voided_at": "2026-01-22T09:00:00Z",
        "void_reason": "Customer cancelled order",
        "reversing_entry": {
            "id": "uuid",
            "entry_number": "JE-2026-00002"
        }
    }
}
```

### 6.5 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVOICE_NOT_FOUND` | 404 | Invoice not found |
| `INVOICE_NOT_EDITABLE` | 400 | Not in draft status |
| `INVOICE_ALREADY_POSTED` | 400 | Already posted |
| `INVOICE_ALREADY_VOID` | 400 | Already voided |
| `INVOICE_NO_LINES` | 400 | No line items |
| `INVOICE_HAS_PAYMENTS` | 400 | Has payments (Phase 2) |
| `FISCAL_PERIOD_CLOSED` | 400 | Period is closed |
| `VOID_REASON_REQUIRED` | 400 | Reason not provided |

---

## 7. Business Logic

### 7.1 Calculate Totals

```pseudocode
FUNCTION calculate_invoice_totals(invoice_id: UUID) -> Totals

    lines = InvoiceLineRepository.find_by_invoice(invoice_id)

    subtotal = 0
    tax_total = 0

    FOR EACH line IN lines
        line.line_total = line.quantity * line.unit_price

        IF line.tax_code_id IS NOT NULL THEN
            tax_code = TaxCodeRepository.find(line.tax_code_id)
            line.tax_rate = tax_code.rate
            line.tax_amount = ROUND(line.line_total * tax_code.rate, 2)
        END IF

        subtotal += line.line_total
        tax_total += line.tax_amount
    END FOR

    total_amount = subtotal + tax_total

    RETURN {subtotal, tax_total, total_amount}

END FUNCTION
```

### 7.2 Post Invoice

```pseudocode
FUNCTION post_invoice(invoice_id: UUID, user: User) -> PostedInvoice

    invoice = InvoiceRepository.find_with_lines(invoice_id)

    // Validations
    ASSERT invoice.status == 'draft', "Only draft invoices can be posted"
    ASSERT invoice.lines.length > 0, "Invoice must have lines"

    // Validate fiscal period
    period = FiscalPeriodService.find_for_date(invoice.invoice_date)
    ASSERT period IS NOT NULL, "No fiscal period for date"
    ASSERT NOT period.is_closed, "Fiscal period is closed"

    // Get accounts
    customer = CustomerRepository.find(invoice.customer_id)
    ar_account = customer.ar_account_id

    // Build journal lines
    journal_lines = []

    // DR: Accounts Receivable
    journal_lines.add({
        account_id: ar_account,
        debit: invoice.total_amount,
        credit: 0
    })

    // CR: Revenue (aggregated by account)
    FOR EACH line IN invoice.lines
        // Add or aggregate revenue
    END FOR

    // CR: Tax (aggregated by account)
    FOR EACH line IN invoice.lines WHERE tax_amount > 0
        // Add or aggregate tax
    END FOR

    BEGIN TRANSACTION
        // Create journal entry
        journal = JournalEntryService.create({
            entry_date: invoice.invoice_date,
            description: "Invoice " + invoice.invoice_number,
            source_type: 'INVOICE',
            source_id: invoice.id,
            lines: journal_lines
        })

        // Update invoice
        invoice.status = 'posted'
        invoice.posted_at = NOW()
        invoice.posted_by = user.id
        invoice.fiscal_period_id = period.id
        InvoiceRepository.save(invoice)
    COMMIT

    RETURN {invoice, journal}

END FUNCTION
```

### 7.3 Void Invoice

```pseudocode
FUNCTION void_invoice(invoice_id: UUID, reason: String, user: User) -> VoidedInvoice

    invoice = InvoiceRepository.find(invoice_id)

    // Validations
    ASSERT invoice.status == 'posted', "Only posted invoices can be voided"
    ASSERT reason IS NOT EMPTY, "Void reason required"
    // ASSERT no payments (Phase 2)

    // Get original journal entry
    original_entry = JournalEntryRepository.find_by_source('INVOICE', invoice_id)

    BEGIN TRANSACTION
        // Create reversing entry (swap debits/credits)
        reversing = JournalEntryService.create_reversal(original_entry, {
            entry_date: TODAY,
            description: "VOID: " + invoice.invoice_number + " - " + reason,
            source_type: 'INVOICE_VOID',
            source_id: invoice.id
        })

        // Update invoice
        invoice.status = 'void'
        invoice.voided_at = NOW()
        invoice.voided_by = user.id
        invoice.void_reason = reason
        InvoiceRepository.save(invoice)
    COMMIT

    RETURN {invoice, reversing}

END FUNCTION
```

---

## 8. Accounting Rules

### 8.1 Double-Entry Rules (Authoritative)

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Posted invoice MUST generate journal entry | Service layer |
| 2 | Debits MUST equal credits | DB constraint |
| 3 | Draft invoices have NO accounting impact | Status check |
| 4 | Posted invoices are IMMUTABLE | DB trigger |
| 5 | Voiding requires reversing entry | Service layer |

### 8.2 Journal Entry for Invoice Post

```
DR  Accounts Receivable    invoice.total_amount
CR  Revenue Account(s)     invoice.subtotal
CR  Tax Payable           invoice.tax_total
```

### 8.3 Journal Entry for Invoice Void

```
DR  Revenue Account(s)     invoice.subtotal
DR  Tax Payable           invoice.tax_total
CR  Accounts Receivable    invoice.total_amount
```

---

## 9. Validation Rules

### 9.1 Invoice Validations

| Field | Rule |
|-------|------|
| `customer_id` | Required, must exist |
| `invoice_date` | Required, in open fiscal period |
| `due_date` | Required, >= invoice_date |
| `lines` | At least one for posting |

### 9.2 Line Validations

| Field | Rule |
|-------|------|
| `description` | Required |
| `quantity` | > 0 |
| `unit_price` | >= 0 |
| `revenue_account_id` | Required, must be REVENUE type |
| `tax_code_id` | Optional, must exist if provided |

### 9.3 Posting Validations

| Rule | Error Code |
|------|------------|
| Status must be draft | `INVOICE_ALREADY_POSTED` |
| Must have lines | `INVOICE_NO_LINES` |
| Period must be open | `FISCAL_PERIOD_CLOSED` |

### 9.4 Void Validations

| Rule | Error Code |
|------|------------|
| Status must be posted | `INVOICE_NOT_POSTED` |
| Must not have payments | `INVOICE_HAS_PAYMENTS` |
| Reason required | `VOID_REASON_REQUIRED` |

---

## 10. Edge Cases

### 10.1 Concurrent Posting

**Scenario:** Two users try to post same invoice
**Solution:** Optimistic locking + status check in transaction

### 10.2 Period Closed After Draft Created

**Scenario:** Invoice dated in now-closed period
**Solution:** Validate on POST, not on CREATE

### 10.3 Customer Deactivated

**Scenario:** Customer deactivated after invoice created
**Solution:** Allow existing drafts, block new invoices

---

## 11. Related Modules

| Module | Relationship | Link |
|--------|--------------|------|
| Customer | Invoice → Customer (AR account) | [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md) |
| COA | Revenue accounts, AR account | [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |
| Tax Codes | Line item taxes | [TAX_CODES_MODULE.md](../tax-codes/TAX_CODES_MODULE.md) |
| Fiscal Period | Posting validation | [FISCAL_PERIOD_MODULE.md](../fiscal-period/FISCAL_PERIOD_MODULE.md) |
| Journal Entry | Auto-generated on post/void | [JOURNAL_ENTRY_MODULE.md](../journal-entry/JOURNAL_ENTRY_MODULE.md) |
| Audit Log | All changes logged | [AUDIT_LOG_MODULE.md](../audit-log/AUDIT_LOG_MODULE.md) |

---

**Document End**
