# Tax Codes Module

**Module:** Tax Codes (Accounting Core)
**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Phase 1 - Core Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [Database Schema](#3-database-schema)
4. [Data Flow](#4-data-flow)
5. [API Design](#5-api-design)
6. [Business Logic](#6-business-logic)
7. [Validation Rules](#7-validation-rules)
8. [Edge Cases](#8-edge-cases)
9. [Related Modules](#9-related-modules)

---

## 1. Overview

### 1.1 Purpose

The Tax Codes module manages tax rate definitions used throughout the ERP system. It supports various tax types (sales tax, VAT, GST) and links each tax code to the appropriate liability account in the Chart of Accounts.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Tax Rate Management** | Define and maintain tax rates |
| **Account Mapping** | Link tax codes to liability accounts |
| **Tax Calculation** | Provide rates for transaction calculations |
| **Default Assignment** | Serve as defaults for customers/products |

### 1.3 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Type** | Configuration/Master Data |
| **Scope** | Organization-specific |
| **Usage** | Invoice lines, Purchase lines |
| **Accounting Impact** | Credits Tax Payable on invoice posting |

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Tax codes belong to org | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |
| Chart of Accounts | Tax liability account | [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |

### 2.2 Modules That Depend On This

| Module | Relationship | Link |
|--------|--------------|------|
| Customer | Default tax code | [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md) |
| Invoice | Line item tax code | [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md) |

### 2.3 Dependency Diagram

```
┌──────────────────┐     ┌──────────────────┐
│   Organization   │     │ Chart of Accounts│
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │                        │ (Tax Payable account)
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
              ┌──────────────────┐
              │    Tax Codes     │
              └────────┬─────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌──────────┐              ┌──────────┐
    │ Customer │              │ Invoice  │
    │ (default)│              │ (lines)  │
    └──────────┘              └──────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TAX CODES SCHEMA                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   organizations  │          │ chart_of_accounts│
│──────────────────│          │──────────────────│
│ id (PK)          │          │ id (PK)          │
│ name             │          │ account_code     │
│ ...              │          │ account_subtype  │
└────────┬─────────┘          │ (TAX_PAYABLE)    │
         │                    └────────┬─────────┘
         │ 1:N                         │
         │                             │ 1:N
         │     ┌───────────────────────┘
         │     │
         ▼     ▼
┌──────────────────────────────────────────────────────────────────┐
│                           tax_codes                               │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ organization_id       UUID NOT NULL FK → organizations            │
│ code                  VARCHAR(20) NOT NULL                        │
│ name                  VARCHAR(100) NOT NULL                       │
│ description           TEXT                                        │
│ rate                  DECIMAL(7,4) NOT NULL                       │
│ tax_type              ENUM('SALES','VAT','GST','EXCISE','EXEMPT')│
│ tax_account_id        UUID NOT NULL FK → chart_of_accounts        │
│ is_compound           BOOLEAN DEFAULT false                       │
│ is_recoverable        BOOLEAN DEFAULT true                        │
│ is_active             BOOLEAN DEFAULT true                        │
│ effective_from        DATE                                        │
│ effective_to          DATE                                        │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
│ updated_at            TIMESTAMP WITH TIME ZONE                    │
│ created_by            UUID FK → users                             │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Referenced by
         ▼
┌──────────────────┐     ┌──────────────────┐
│    customers     │     │  invoice_lines   │
│──────────────────│     │──────────────────│
│ default_tax_code │     │ tax_code_id      │
└──────────────────┘     └──────────────────┘
```

### 3.2 Tax Codes Table Definition

```sql
-- Tax type enum
CREATE TYPE tax_type AS ENUM (
    'SALES',    -- Sales tax (US)
    'VAT',      -- Value Added Tax (EU, UK)
    'GST',      -- Goods and Services Tax (AU, CA, IN)
    'EXCISE',   -- Excise/specific goods tax
    'EXEMPT'    -- Tax exempt (0% rate)
);

CREATE TABLE tax_codes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Tax Code Identity
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Tax Rate (stored as decimal, e.g., 0.0825 for 8.25%)
    rate DECIMAL(7,4) NOT NULL,

    -- Tax Type
    tax_type tax_type NOT NULL DEFAULT 'SALES',

    -- Accounting
    tax_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Behavior
    is_compound BOOLEAN DEFAULT false,      -- Applied after other taxes
    is_recoverable BOOLEAN DEFAULT true,    -- Can be claimed as input tax

    -- Validity Period
    effective_from DATE,
    effective_to DATE,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_tax_code UNIQUE(organization_id, code),
    CONSTRAINT chk_rate_range CHECK (rate >= 0 AND rate <= 1),
    CONSTRAINT chk_effective_dates CHECK (
        effective_from IS NULL OR effective_to IS NULL OR effective_from <= effective_to
    )
);

-- Indexes
CREATE INDEX idx_tax_codes_org ON tax_codes(organization_id);
CREATE INDEX idx_tax_codes_code ON tax_codes(organization_id, code);
CREATE INDEX idx_tax_codes_active ON tax_codes(organization_id, is_active)
    WHERE is_active = true;
CREATE INDEX idx_tax_codes_account ON tax_codes(tax_account_id);

-- Trigger for updated_at
CREATE TRIGGER trg_tax_codes_updated_at
    BEFORE UPDATE ON tax_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validate tax account is TAX_PAYABLE type
CREATE OR REPLACE FUNCTION validate_tax_account()
RETURNS TRIGGER AS $$
DECLARE
    v_subtype account_subtype;
BEGIN
    SELECT account_subtype INTO v_subtype
    FROM chart_of_accounts
    WHERE id = NEW.tax_account_id;

    IF v_subtype != 'TAX_PAYABLE' THEN
        RAISE EXCEPTION 'Tax account must be of subtype TAX_PAYABLE';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_tax_account
    BEFORE INSERT OR UPDATE ON tax_codes
    FOR EACH ROW
    EXECUTE FUNCTION validate_tax_account();
```

---

## 4. Data Flow

### 4.1 Tax Code Usage in Invoice

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   TAX CODE USAGE IN INVOICE FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

    User selects                Tax Code                    Invoice Line
    Tax Code                    Repository                  Calculation
         │                          │                           │
         │  1. Lookup tax code      │                           │
         │─────────────────────────►│                           │
         │                          │                           │
         │  2. Return rate & info   │                           │
         │◄─────────────────────────│                           │
         │                          │                           │
         │  3. Calculate line tax   │                           │
         │─────────────────────────────────────────────────────►│
         │                          │                           │
         │                          │     line_total = qty * price
         │                          │     tax_amount = line_total * rate
         │                          │                           │
         │  4. Return calculated    │                           │
         │     values               │                           │
         │◄─────────────────────────────────────────────────────│
         │                          │                           │

    ON INVOICE POST:
    ┌─────────────────────────────────────────────────────────────────────┐
    │ Tax code's tax_account_id is CREDITED with total tax amount         │
    │                                                                      │
    │ Journal Entry:                                                       │
    │   DR  Accounts Receivable     $1,082.50                             │
    │   CR  Revenue                 $1,000.00                             │
    │   CR  Sales Tax Payable       $   82.50  ◄── tax_code.tax_account   │
    └─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tax Calculation Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TAX CALCULATION PROCESS                             │
└─────────────────────────────────────────────────────────────────────────┘

    INPUT:
    ├── line_total: $1,000.00
    └── tax_code: STANDARD (8.25%)

    CALCULATION:
    ┌────────────────────────────────────────┐
    │ tax_amount = line_total × rate         │
    │ tax_amount = $1,000.00 × 0.0825        │
    │ tax_amount = $82.50                    │
    └────────────────────────────────────────┘

    OUTPUT:
    ├── line_total: $1,000.00
    ├── tax_rate: 0.0825 (8.25%)
    ├── tax_amount: $82.50
    └── total_with_tax: $1,082.50

    COMPOUND TAX EXAMPLE (if applicable):
    ┌────────────────────────────────────────┐
    │ Base: $1,000.00                        │
    │ Tax 1 (GST 5%): $50.00                 │
    │ Subtotal: $1,050.00                    │
    │ Tax 2 (PST 7%, compound): $73.50       │
    │ Total: $1,123.50                       │
    └────────────────────────────────────────┘
```

---

## 5. API Design

### 5.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/tax-codes` | `tax_code:read` | List tax codes |
| POST | `/api/v1/tax-codes` | `tax_code:create` | Create tax code |
| GET | `/api/v1/tax-codes/{id}` | `tax_code:read` | Get tax code |
| PUT | `/api/v1/tax-codes/{id}` | `tax_code:update` | Update tax code |
| DELETE | `/api/v1/tax-codes/{id}` | `tax_code:delete` | Deactivate tax code |
| POST | `/api/v1/tax-codes/calculate` | `tax_code:read` | Calculate tax |

### 5.2 List Tax Codes

**Endpoint:** `GET /api/v1/tax-codes`
**Permission:** `tax_code:read`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `is_active` | boolean | true | Filter by status |
| `tax_type` | string | - | Filter by tax type |
| `effective_date` | date | - | Filter by effective date |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "code": "STANDARD",
            "name": "Standard Sales Tax",
            "description": "Standard state sales tax rate",
            "rate": 0.0825,
            "rate_display": "8.25%",
            "tax_type": "SALES",
            "tax_account": {
                "id": "uuid",
                "code": "2120",
                "name": "Sales Tax Payable"
            },
            "is_compound": false,
            "is_recoverable": true,
            "is_active": true,
            "effective_from": null,
            "effective_to": null
        },
        {
            "id": "uuid",
            "code": "REDUCED",
            "name": "Reduced Rate",
            "rate": 0.05,
            "rate_display": "5.00%",
            "tax_type": "SALES",
            "is_active": true
        },
        {
            "id": "uuid",
            "code": "EXEMPT",
            "name": "Tax Exempt",
            "rate": 0,
            "rate_display": "0.00%",
            "tax_type": "EXEMPT",
            "is_active": true
        }
    ]
}
```

### 5.3 Create Tax Code

**Endpoint:** `POST /api/v1/tax-codes`
**Permission:** `tax_code:create`

**Request Body:**
```json
{
    "code": "LUXURY",
    "name": "Luxury Goods Tax",
    "description": "Additional tax on luxury items",
    "rate": 0.15,
    "tax_type": "EXCISE",
    "tax_account_id": "uuid",
    "is_compound": true,
    "effective_from": "2026-01-01"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "code": "LUXURY",
        "name": "Luxury Goods Tax",
        "description": "Additional tax on luxury items",
        "rate": 0.15,
        "rate_display": "15.00%",
        "tax_type": "EXCISE",
        "tax_account": {
            "id": "uuid",
            "code": "2125",
            "name": "Excise Tax Payable"
        },
        "is_compound": true,
        "is_recoverable": true,
        "is_active": true,
        "effective_from": "2026-01-01",
        "effective_to": null,
        "created_at": "2026-01-21T10:00:00Z"
    }
}
```

### 5.4 Calculate Tax

**Endpoint:** `POST /api/v1/tax-codes/calculate`
**Permission:** `tax_code:read`

**Request Body:**
```json
{
    "amount": 1000.00,
    "tax_code_id": "uuid"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "base_amount": 1000.00,
        "tax_code": {
            "id": "uuid",
            "code": "STANDARD",
            "name": "Standard Sales Tax",
            "rate": 0.0825
        },
        "tax_amount": 82.50,
        "total_amount": 1082.50,
        "calculation": "1000.00 × 8.25% = 82.50"
    }
}
```

### 5.5 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TAX_CODE_NOT_FOUND` | 404 | Tax code not found |
| `TAX_CODE_EXISTS` | 409 | Tax code already exists |
| `INVALID_TAX_ACCOUNT` | 400 | Account is not TAX_PAYABLE type |
| `INVALID_RATE` | 400 | Rate must be 0-100% |
| `TAX_CODE_IN_USE` | 400 | Cannot delete tax code in use |

---

## 6. Business Logic

### 6.1 Create Tax Code

```pseudocode
FUNCTION create_tax_code(data: TaxCodeCreateDTO, user: User) -> TaxCode

    // 1. Check code uniqueness
    existing = TaxCodeRepository.find_by_code(
        user.organization_id,
        data.code
    )
    IF existing IS NOT NULL THEN
        THROW ConflictError("Tax code already exists")
    END IF

    // 2. Validate tax account
    tax_account = ChartOfAccountsRepository.find(data.tax_account_id)

    IF tax_account IS NULL THEN
        THROW NotFoundError("Tax account not found")
    END IF

    IF tax_account.organization_id != user.organization_id THEN
        THROW ForbiddenError("Tax account belongs to different organization")
    END IF

    IF tax_account.account_subtype != 'TAX_PAYABLE' THEN
        THROW ValidationError("Account must be of subtype TAX_PAYABLE")
    END IF

    // 3. Validate rate
    IF data.rate < 0 OR data.rate > 1 THEN
        THROW ValidationError("Rate must be between 0 and 1 (0% to 100%)")
    END IF

    // 4. Create tax code
    tax_code = TaxCode.create({
        organization_id: user.organization_id,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        rate: data.rate,
        tax_type: data.tax_type ?? 'SALES',
        tax_account_id: data.tax_account_id,
        is_compound: data.is_compound ?? false,
        is_recoverable: data.is_recoverable ?? true,
        effective_from: data.effective_from,
        effective_to: data.effective_to,
        is_active: true,
        created_by: user.id
    })

    // 5. Audit log
    AuditLog.record('tax_codes', tax_code.id, 'INSERT', null, tax_code)

    RETURN tax_code

END FUNCTION
```

### 6.2 Calculate Tax Amount

```pseudocode
FUNCTION calculate_tax(
    amount: Decimal,
    tax_code_id: UUID,
    as_of_date: Date = CURRENT_DATE
) -> TaxCalculation

    // 1. Get tax code
    tax_code = TaxCodeRepository.find(tax_code_id)

    IF tax_code IS NULL THEN
        THROW NotFoundError("Tax code not found")
    END IF

    // 2. Check if tax code is active and effective
    IF NOT tax_code.is_active THEN
        THROW ValidationError("Tax code is inactive")
    END IF

    IF tax_code.effective_from IS NOT NULL AND as_of_date < tax_code.effective_from THEN
        THROW ValidationError("Tax code not yet effective")
    END IF

    IF tax_code.effective_to IS NOT NULL AND as_of_date > tax_code.effective_to THEN
        THROW ValidationError("Tax code has expired")
    END IF

    // 3. Calculate tax
    tax_amount = ROUND(amount * tax_code.rate, 2)
    total_amount = amount + tax_amount

    RETURN {
        base_amount: amount,
        tax_code: tax_code,
        tax_rate: tax_code.rate,
        tax_amount: tax_amount,
        total_amount: total_amount
    }

END FUNCTION
```

### 6.3 Create Default Tax Codes

```pseudocode
FUNCTION create_default_tax_codes(organization_id: UUID, tax_account_id: UUID)

    default_codes = [
        {
            code: "STANDARD",
            name: "Standard Sales Tax",
            description: "Standard state/local sales tax",
            rate: 0.0825,
            tax_type: "SALES"
        },
        {
            code: "REDUCED",
            name: "Reduced Rate",
            description: "Reduced tax rate for qualifying items",
            rate: 0.05,
            tax_type: "SALES"
        },
        {
            code: "EXEMPT",
            name: "Tax Exempt",
            description: "No tax applied",
            rate: 0,
            tax_type: "EXEMPT"
        }
    ]

    FOR EACH tc IN default_codes
        TaxCode.create({
            organization_id: organization_id,
            code: tc.code,
            name: tc.name,
            description: tc.description,
            rate: tc.rate,
            tax_type: tc.tax_type,
            tax_account_id: tax_account_id,
            is_active: true
        })
    END FOR

END FUNCTION
```

---

## 7. Validation Rules

### 7.1 Field Validations

| Field | Rules | Error |
|-------|-------|-------|
| `code` | Required, 1-20 chars, unique per org | `Invalid code` |
| `name` | Required, 1-100 chars | `Name required` |
| `rate` | Required, 0 to 1 (0% to 100%) | `Invalid rate` |
| `tax_type` | Required, valid enum | `Invalid tax type` |
| `tax_account_id` | Required, must be TAX_PAYABLE | `Invalid account` |
| `effective_from` | Must be <= effective_to | `Invalid date range` |

### 7.2 Business Rules

| Rule | Description |
|------|-------------|
| Unique Code | Tax code must be unique within organization |
| Tax Account Type | Tax account must be TAX_PAYABLE subtype |
| Same Organization | Tax account must belong to same organization |
| Rate Precision | Rate stored with 4 decimal places (0.0825) |
| Effective Dates | If both set, from must be <= to |

---

## 8. Edge Cases

### 8.1 Tax Rate Change

**Scenario:** Tax rate changes but historical invoices must retain old rate
**Solution:** Store rate on invoice line at time of creation

```sql
-- invoice_lines stores the rate at transaction time
tax_rate DECIMAL(7,4)  -- Copied from tax_code at line creation
```

### 8.2 Tax Code Expiration

**Scenario:** Tax code expires while invoice is still in draft
**Decision:** Warn user but allow, block on posting if expired

```pseudocode
FUNCTION validate_tax_code_for_invoice(tax_code_id: UUID, invoice_date: Date)

    tax_code = TaxCodeRepository.find(tax_code_id)

    IF tax_code.effective_to IS NOT NULL AND invoice_date > tax_code.effective_to THEN
        THROW ValidationError("Tax code expired as of " + invoice_date)
    END IF

END FUNCTION
```

### 8.3 Tax Code Deletion with Usage

**Scenario:** User tries to delete tax code used in invoices
**Decision:** Soft delete only; hard delete only if never used

```pseudocode
FUNCTION delete_tax_code(tax_code_id: UUID)

    // Check usage in invoice lines
    usage_count = InvoiceLineRepository.count_by_tax_code(tax_code_id)

    IF usage_count > 0 THEN
        // Soft delete
        TaxCodeRepository.update(tax_code_id, {is_active: false})
        RETURN {deleted: false, deactivated: true, reason: "In use by invoices"}
    ELSE
        // Hard delete
        TaxCodeRepository.delete(tax_code_id)
        RETURN {deleted: true}
    END IF

END FUNCTION
```

---

## 9. Related Modules

### 9.1 Customer Integration

Customers can have a default tax code:
```sql
-- Customer's default tax code
customers.default_tax_code_id → tax_codes.id
-- Used as default when creating invoice lines for customer
```

See: [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md)

### 9.2 Invoice Integration

Invoice lines reference tax codes:
```sql
-- Invoice line's tax code
invoice_lines.tax_code_id → tax_codes.id
-- Rate is copied to invoice_lines.tax_rate at creation
```

See: [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md)

### 9.3 Chart of Accounts Integration

Tax codes point to liability accounts:
```sql
-- Tax code's liability account (credited on invoice post)
tax_codes.tax_account_id → chart_of_accounts.id
-- WHERE account_subtype = 'TAX_PAYABLE'
```

See: [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md)

---

## Appendix A: Common Tax Rates

| Jurisdiction | Type | Common Rates |
|--------------|------|--------------|
| US (varies by state) | Sales Tax | 0% - 10.25% |
| UK | VAT | 0%, 5%, 20% |
| EU (varies by country) | VAT | 0% - 27% |
| Canada | GST | 5% |
| Canada (varies by province) | PST/HST | 0% - 15% |
| Australia | GST | 10% |
| India | GST | 0%, 5%, 12%, 18%, 28% |

---

**Document End**
