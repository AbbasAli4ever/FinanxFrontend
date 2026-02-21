# Fiscal Period Module

**Module:** Fiscal Period (Accounting Core)
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

The Fiscal Period module manages accounting periods for financial reporting and transaction control. It ensures that transactions are posted to appropriate periods and provides the ability to close periods to prevent backdated entries.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Period Definition** | Define fiscal years and periods (monthly/quarterly) |
| **Period Control** | Open/close periods for transaction posting |
| **Transaction Validation** | Ensure transactions post to valid periods |
| **Year-End Close** | Support fiscal year closing process |

### 1.3 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Type** | Configuration/Control |
| **Granularity** | Typically monthly (12 periods/year) |
| **Control** | Closed periods reject new postings |
| **Overlap** | Periods should not overlap |

### 1.4 Fiscal Year Concept

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FISCAL YEAR 2026                                     │
│                    (Calendar Year Example)                               │
└─────────────────────────────────────────────────────────────────────────┘

 Period 1    Period 2    Period 3    Period 4   ...   Period 12
 January     February    March       April            December
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     ┌─────────┐
│ OPEN    │ │ CLOSED  │ │ CLOSED  │ │ OPEN    │ ... │ OPEN    │
│ 01/01   │ │ 02/01   │ │ 03/01   │ │ 04/01   │     │ 12/01   │
│ to      │ │ to      │ │ to      │ │ to      │     │ to      │
│ 01/31   │ │ 02/28   │ │ 03/31   │ │ 04/30   │     │ 12/31   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘     └─────────┘

Non-Calendar Fiscal Year Example (April - March):
┌─────────────────────────────────────────────────────────────────────────┐
│                     FISCAL YEAR 2026                                     │
│                    (April Start Example)                                 │
└─────────────────────────────────────────────────────────────────────────┘

 Period 1    Period 2    Period 3              Period 12
 April       May         June      ...         March
 2025        2025        2025                  2026
┌─────────┐ ┌─────────┐ ┌─────────┐           ┌─────────┐
│ 04/01/25│ │ 05/01/25│ │ 06/01/25│   ...     │ 03/01/26│
│ to      │ │ to      │ │ to      │           │ to      │
│ 04/30/25│ │ 05/31/25│ │ 06/30/25│           │ 03/31/26│
└─────────┘ └─────────┘ └─────────┘           └─────────┘
```

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Periods belong to org | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |
| RBAC | Period close permission | [RBAC_MODULE.md](../rbac/RBAC_MODULE.md) |

### 2.2 Modules That Depend On This

| Module | Relationship | Link |
|--------|--------------|------|
| Invoice | Posting validation | [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md) |
| Journal Entry | Posting validation | [JOURNAL_ENTRY_MODULE.md](../journal-entry/JOURNAL_ENTRY_MODULE.md) |

### 2.3 Dependency Diagram

```
┌──────────────────┐
│   Organization   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Fiscal Period   │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Invoice │ │Journal │
│        │ │ Entry  │
└────────┘ └────────┘

Transaction Validation:
┌─────────────────────────────────────────────────────────────────────────┐
│ When posting Invoice or Journal Entry:                                   │
│ 1. Find fiscal period for transaction date                              │
│ 2. Check period is_closed = false                                       │
│ 3. If closed → REJECT posting                                           │
│ 4. If open → ALLOW posting                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FISCAL PERIOD SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   organizations  │
│──────────────────│
│ id (PK)          │
│ name             │
│ fiscal_year_end  │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       fiscal_periods                              │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ organization_id       UUID NOT NULL FK → organizations            │
│ fiscal_year           INTEGER NOT NULL                            │
│ period_number         INTEGER NOT NULL (1-12 or 1-13)            │
│ period_name           VARCHAR(50) NOT NULL                        │
│ period_type           ENUM('REGULAR','ADJUSTMENT','CLOSING')     │
│ start_date            DATE NOT NULL                               │
│ end_date              DATE NOT NULL                               │
│ is_closed             BOOLEAN DEFAULT false                       │
│ closed_at             TIMESTAMP WITH TIME ZONE                    │
│ closed_by             UUID FK → users                             │
│ reopened_at           TIMESTAMP WITH TIME ZONE                    │
│ reopened_by           UUID FK → users                             │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
│ updated_at            TIMESTAMP WITH TIME ZONE                    │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Referenced by (fiscal_period_id)
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌────────┐      ┌────────────┐
│invoices│      │journal_    │
│        │      │entries     │
└────────┘      └────────────┘
```

### 3.2 Fiscal Periods Table Definition

```sql
-- Period type enum
CREATE TYPE period_type AS ENUM (
    'REGULAR',      -- Normal monthly/quarterly period
    'ADJUSTMENT',   -- Adjustment period (period 13)
    'CLOSING'       -- Year-end closing period
);

CREATE TABLE fiscal_periods (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Period Identity
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL,  -- 1-12 for regular, 13 for adjustments
    period_name VARCHAR(50) NOT NULL,  -- e.g., "January 2026", "Q1 2026"
    period_type period_type NOT NULL DEFAULT 'REGULAR',

    -- Date Range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Status
    is_closed BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,  -- Locked for review before close

    -- Close/Reopen Tracking
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id),
    reopened_at TIMESTAMP WITH TIME ZONE,
    reopened_by UUID REFERENCES users(id),
    reopen_reason TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_fiscal_period UNIQUE(organization_id, fiscal_year, period_number),
    CONSTRAINT chk_period_number CHECK (period_number >= 1 AND period_number <= 13),
    CONSTRAINT chk_date_range CHECK (start_date <= end_date)
);

-- Indexes
CREATE INDEX idx_fiscal_periods_org ON fiscal_periods(organization_id);
CREATE INDEX idx_fiscal_periods_year ON fiscal_periods(organization_id, fiscal_year);
CREATE INDEX idx_fiscal_periods_dates ON fiscal_periods(organization_id, start_date, end_date);
CREATE INDEX idx_fiscal_periods_open ON fiscal_periods(organization_id, is_closed)
    WHERE is_closed = false;

-- Trigger for updated_at
CREATE TRIGGER trg_fiscal_periods_updated_at
    BEFORE UPDATE ON fiscal_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent overlapping periods
CREATE OR REPLACE FUNCTION check_period_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM fiscal_periods
        WHERE organization_id = NEW.organization_id
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
          AND (
              (NEW.start_date BETWEEN start_date AND end_date) OR
              (NEW.end_date BETWEEN start_date AND end_date) OR
              (start_date BETWEEN NEW.start_date AND NEW.end_date)
          )
    ) THEN
        RAISE EXCEPTION 'Fiscal period dates overlap with existing period';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_period_overlap
    BEFORE INSERT OR UPDATE ON fiscal_periods
    FOR EACH ROW
    EXECUTE FUNCTION check_period_overlap();
```

### 3.3 Helper Function: Find Period for Date

```sql
-- Function to find fiscal period for a given date
CREATE OR REPLACE FUNCTION get_fiscal_period_for_date(
    p_organization_id UUID,
    p_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_period_id UUID;
BEGIN
    SELECT id INTO v_period_id
    FROM fiscal_periods
    WHERE organization_id = p_organization_id
      AND p_date BETWEEN start_date AND end_date
      AND period_type = 'REGULAR'
    LIMIT 1;

    RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a date is in an open period
CREATE OR REPLACE FUNCTION is_period_open_for_date(
    p_organization_id UUID,
    p_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_closed BOOLEAN;
BEGIN
    SELECT is_closed INTO v_is_closed
    FROM fiscal_periods
    WHERE organization_id = p_organization_id
      AND p_date BETWEEN start_date AND end_date
      AND period_type = 'REGULAR'
    LIMIT 1;

    IF v_is_closed IS NULL THEN
        -- No period found
        RETURN false;
    END IF;

    RETURN NOT v_is_closed;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Data Flow

### 4.1 Fiscal Year Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   FISCAL YEAR GENERATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    Admin                          Server                        Database
      │                             │                              │
      │  POST /fiscal-periods/      │                              │
      │       generate-year         │                              │
      │  {fiscal_year: 2026}        │                              │
      │────────────────────────────►│                              │
      │                             │                              │
      │                             │  Get org fiscal year end     │
      │                             │  month (e.g., 12 = December) │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Check periods don't exist   │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Generate 12 periods:        │
      │                             │  ┌─────────────────────────┐ │
      │                             │  │ Period 1: Jan 1-31      │ │
      │                             │  │ Period 2: Feb 1-28/29   │ │
      │                             │  │ Period 3: Mar 1-31      │ │
      │                             │  │ ...                     │ │
      │                             │  │ Period 12: Dec 1-31     │ │
      │                             │  └─────────────────────────┘ │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │  {periods: [...]}           │                              │
      │◄────────────────────────────│                              │
      │                             │                              │
```

### 4.2 Period Close Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PERIOD CLOSE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

    Accountant                     Server                        Database
         │                            │                              │
         │  POST /fiscal-periods/     │                              │
         │       {id}/close           │                              │
         │────────────────────────────►│                              │
         │                            │                              │
         │                            │  Check user permission       │
         │                            │  'fiscal_period:close'       │
         │                            │                              │
         │                            │  Check previous periods      │
         │                            │  are closed                  │
         │                            │─────────────────────────────►│
         │                            │◄─────────────────────────────│
         │                            │                              │
         │                            │  Check no draft invoices     │
         │                            │  in this period              │
         │                            │─────────────────────────────►│
         │                            │◄─────────────────────────────│
         │                            │                              │
         │                            │  Update period:              │
         │                            │  is_closed = true            │
         │                            │  closed_at = NOW()           │
         │                            │  closed_by = user_id         │
         │                            │─────────────────────────────►│
         │                            │◄─────────────────────────────│
         │                            │                              │
         │  {period: {is_closed:true}}│                              │
         │◄────────────────────────────│                              │
         │                            │                              │
```

### 4.3 Transaction Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 TRANSACTION → PERIOD VALIDATION                          │
└─────────────────────────────────────────────────────────────────────────┘

    Invoice Post                  Fiscal Period                   Result
         │                        Validation                         │
         │                            │                              │
         │  Validate period for       │                              │
         │  invoice_date: 2026-01-15  │                              │
         │───────────────────────────►│                              │
         │                            │                              │
         │                            │  Find period containing      │
         │                            │  2026-01-15                  │
         │                            │                              │
         │                            │  Period found: January 2026  │
         │                            │  is_closed: false            │
         │                            │                              │
         │◄───────────────────────────│                              │
         │  ✓ Period is OPEN          │                              │
         │  Proceed with posting      │                              │
         │                            │                              │

    ALTERNATIVE (Closed Period):
         │                            │                              │
         │  Validate period for       │                              │
         │  invoice_date: 2025-12-15  │                              │
         │───────────────────────────►│                              │
         │                            │                              │
         │                            │  Period found: December 2025 │
         │                            │  is_closed: true             │
         │                            │                              │
         │◄───────────────────────────│                              │
         │  ✗ Period is CLOSED        │                              │
         │  REJECT posting            │                              │
         │                            │                              │
```

---

## 5. API Design

### 5.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/fiscal-periods` | `fiscal_period:read` | List periods |
| POST | `/api/v1/fiscal-periods` | `fiscal_period:create` | Create period |
| POST | `/api/v1/fiscal-periods/generate-year` | `fiscal_period:create` | Generate year |
| GET | `/api/v1/fiscal-periods/{id}` | `fiscal_period:read` | Get period |
| PUT | `/api/v1/fiscal-periods/{id}` | `fiscal_period:update` | Update period |
| POST | `/api/v1/fiscal-periods/{id}/close` | `fiscal_period:close` | Close period |
| POST | `/api/v1/fiscal-periods/{id}/reopen` | `fiscal_period:reopen` | Reopen period |
| GET | `/api/v1/fiscal-periods/current` | `fiscal_period:read` | Get current period |

### 5.2 List Fiscal Periods

**Endpoint:** `GET /api/v1/fiscal-periods`
**Permission:** `fiscal_period:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `fiscal_year` | integer | Filter by fiscal year |
| `is_closed` | boolean | Filter by closed status |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "fiscal_year": 2026,
            "period_number": 1,
            "period_name": "January 2026",
            "period_type": "REGULAR",
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
            "is_closed": false,
            "is_locked": false,
            "closed_at": null,
            "closed_by": null,
            "transaction_count": 45,
            "journal_entry_count": 23
        },
        {
            "id": "uuid",
            "fiscal_year": 2025,
            "period_number": 12,
            "period_name": "December 2025",
            "period_type": "REGULAR",
            "start_date": "2025-12-01",
            "end_date": "2025-12-31",
            "is_closed": true,
            "closed_at": "2026-01-05T10:00:00Z",
            "closed_by": {
                "id": "uuid",
                "name": "John Accountant"
            }
        }
    ]
}
```

### 5.3 Generate Fiscal Year

**Endpoint:** `POST /api/v1/fiscal-periods/generate-year`
**Permission:** `fiscal_period:create`

**Request Body:**
```json
{
    "fiscal_year": 2026,
    "period_structure": "MONTHLY"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "fiscal_year": 2026,
        "periods_created": 12,
        "periods": [
            {
                "id": "uuid",
                "period_number": 1,
                "period_name": "January 2026",
                "start_date": "2026-01-01",
                "end_date": "2026-01-31"
            },
            {
                "id": "uuid",
                "period_number": 2,
                "period_name": "February 2026",
                "start_date": "2026-02-01",
                "end_date": "2026-02-28"
            }
        ]
    }
}
```

### 5.4 Close Period

**Endpoint:** `POST /api/v1/fiscal-periods/{period_id}/close`
**Permission:** `fiscal_period:close`

**Request Body:**
```json
{
    "confirm": true,
    "notes": "Month-end close completed"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "period_name": "January 2026",
        "is_closed": true,
        "closed_at": "2026-02-01T10:00:00Z",
        "closed_by": {
            "id": "uuid",
            "name": "John Accountant"
        },
        "summary": {
            "invoices_posted": 45,
            "journal_entries": 23,
            "total_debits": 125000.00,
            "total_credits": 125000.00
        }
    }
}
```

### 5.5 Reopen Period

**Endpoint:** `POST /api/v1/fiscal-periods/{period_id}/reopen`
**Permission:** `fiscal_period:reopen`

**Request Body:**
```json
{
    "reason": "Need to post correcting entry for invoice adjustment",
    "confirm": true
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "period_name": "January 2026",
        "is_closed": false,
        "reopened_at": "2026-02-05T14:30:00Z",
        "reopened_by": {
            "id": "uuid",
            "name": "Senior Accountant"
        },
        "reopen_reason": "Need to post correcting entry for invoice adjustment"
    }
}
```

### 5.6 Get Current Period

**Endpoint:** `GET /api/v1/fiscal-periods/current`
**Permission:** `fiscal_period:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "fiscal_year": 2026,
        "period_number": 1,
        "period_name": "January 2026",
        "start_date": "2026-01-01",
        "end_date": "2026-01-31",
        "is_closed": false,
        "days_remaining": 10,
        "is_current": true
    }
}
```

### 5.7 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PERIOD_NOT_FOUND` | 404 | Fiscal period not found |
| `PERIODS_EXIST` | 409 | Periods already exist for year |
| `PERIOD_OVERLAP` | 400 | Period dates overlap existing |
| `PERIOD_ALREADY_CLOSED` | 400 | Period is already closed |
| `PERIOD_NOT_CLOSED` | 400 | Period is not closed (for reopen) |
| `PREVIOUS_PERIODS_OPEN` | 400 | Cannot close with open prior periods |
| `DRAFT_TRANSACTIONS_EXIST` | 400 | Draft transactions exist in period |
| `SUBSEQUENT_PERIOD_CLOSED` | 400 | Cannot reopen with closed future periods |

---

## 6. Business Logic

### 6.1 Generate Fiscal Year Periods

```pseudocode
FUNCTION generate_fiscal_year(
    organization_id: UUID,
    fiscal_year: Integer,
    structure: String = "MONTHLY"
) -> List<FiscalPeriod>

    // 1. Check periods don't already exist
    existing = FiscalPeriodRepository.count_by_year(organization_id, fiscal_year)
    IF existing > 0 THEN
        THROW ConflictError("Fiscal periods already exist for year " + fiscal_year)
    END IF

    // 2. Get organization's fiscal year end month
    org = OrganizationRepository.find(organization_id)
    fy_end_month = org.fiscal_year_end_month  // e.g., 12 for December

    // 3. Calculate start date
    // If FY ends in December, year starts Jan 1 of same year
    // If FY ends in March, year starts Apr 1 of previous year
    IF fy_end_month == 12 THEN
        start_year = fiscal_year
        start_month = 1
    ELSE
        start_year = fiscal_year - 1
        start_month = fy_end_month + 1
    END IF

    periods = []

    // 4. Generate 12 monthly periods
    FOR period_num = 1 TO 12
        month = ((start_month - 1 + period_num - 1) % 12) + 1
        year = start_year + FLOOR((start_month - 1 + period_num - 1) / 12)

        start_date = DATE(year, month, 1)
        end_date = LAST_DAY_OF_MONTH(year, month)

        period = FiscalPeriod.create({
            organization_id: organization_id,
            fiscal_year: fiscal_year,
            period_number: period_num,
            period_name: MONTH_NAME(month) + " " + year,
            period_type: 'REGULAR',
            start_date: start_date,
            end_date: end_date,
            is_closed: false
        })

        periods.append(period)
    END FOR

    RETURN periods

END FUNCTION
```

### 6.2 Close Fiscal Period

```pseudocode
FUNCTION close_fiscal_period(
    period_id: UUID,
    user: User
) -> FiscalPeriod

    period = FiscalPeriodRepository.find(period_id)

    IF period IS NULL THEN
        THROW NotFoundError("Fiscal period not found")
    END IF

    // 1. Check not already closed
    IF period.is_closed THEN
        THROW BusinessError("Period is already closed")
    END IF

    // 2. Check previous periods are closed
    open_prior = FiscalPeriodRepository.count_open_prior(
        period.organization_id,
        period.fiscal_year,
        period.period_number
    )
    IF open_prior > 0 THEN
        THROW BusinessError("Cannot close period with open prior periods")
    END IF

    // 3. Check for draft invoices in this period
    draft_invoices = InvoiceRepository.count_draft_in_period(
        period.organization_id,
        period.start_date,
        period.end_date
    )
    IF draft_invoices > 0 THEN
        THROW BusinessError("Cannot close period with " + draft_invoices + " draft invoices")
    END IF

    // 4. Close the period
    FiscalPeriodRepository.update(period_id, {
        is_closed: true,
        closed_at: CURRENT_TIMESTAMP,
        closed_by: user.id
    })

    // 5. Audit log
    AuditLog.record('fiscal_periods', period_id, 'UPDATE',
        {is_closed: false},
        {is_closed: true, closed_at: CURRENT_TIMESTAMP, closed_by: user.id}
    )

    RETURN FiscalPeriodRepository.find(period_id)

END FUNCTION
```

### 6.3 Reopen Fiscal Period

```pseudocode
FUNCTION reopen_fiscal_period(
    period_id: UUID,
    reason: String,
    user: User
) -> FiscalPeriod

    period = FiscalPeriodRepository.find(period_id)

    IF period IS NULL THEN
        THROW NotFoundError("Fiscal period not found")
    END IF

    // 1. Check is closed
    IF NOT period.is_closed THEN
        THROW BusinessError("Period is not closed")
    END IF

    // 2. Check subsequent periods are open (can't reopen if later closed)
    closed_subsequent = FiscalPeriodRepository.count_closed_subsequent(
        period.organization_id,
        period.fiscal_year,
        period.period_number
    )
    IF closed_subsequent > 0 THEN
        THROW BusinessError("Cannot reopen period when subsequent periods are closed")
    END IF

    // 3. Validate reason provided
    IF reason IS NULL OR reason.trim() IS EMPTY THEN
        THROW ValidationError("Reopen reason is required")
    END IF

    // 4. Reopen the period
    FiscalPeriodRepository.update(period_id, {
        is_closed: false,
        reopened_at: CURRENT_TIMESTAMP,
        reopened_by: user.id,
        reopen_reason: reason
    })

    // 5. Audit log
    AuditLog.record('fiscal_periods', period_id, 'UPDATE',
        {is_closed: true},
        {is_closed: false, reopened_at: CURRENT_TIMESTAMP, reopen_reason: reason}
    )

    RETURN FiscalPeriodRepository.find(period_id)

END FUNCTION
```

### 6.4 Validate Transaction Date

```pseudocode
FUNCTION validate_transaction_date(
    organization_id: UUID,
    transaction_date: Date
) -> ValidationResult

    // Find period for date
    period = FiscalPeriodRepository.find_for_date(organization_id, transaction_date)

    IF period IS NULL THEN
        RETURN {
            valid: false,
            error: "NO_PERIOD",
            message: "No fiscal period found for date " + transaction_date
        }
    END IF

    IF period.is_closed THEN
        RETURN {
            valid: false,
            error: "PERIOD_CLOSED",
            message: "Fiscal period '" + period.period_name + "' is closed",
            period: period
        }
    END IF

    RETURN {
        valid: true,
        period: period
    }

END FUNCTION
```

---

## 7. Validation Rules

### 7.1 Field Validations

| Field | Rules | Error |
|-------|-------|-------|
| `fiscal_year` | Required, reasonable range (2000-2100) | `Invalid year` |
| `period_number` | Required, 1-13 | `Invalid period number` |
| `period_name` | Required, 1-50 chars | `Name required` |
| `start_date` | Required, valid date | `Invalid start date` |
| `end_date` | Required, >= start_date | `Invalid end date` |

### 7.2 Business Rules

| Rule | Description |
|------|-------------|
| No Overlap | Period dates cannot overlap within organization |
| Sequential Close | Periods must be closed in order |
| Sequential Reopen | Can only reopen if subsequent periods are open |
| Draft Check | Cannot close with draft transactions |
| Unique Period | fiscal_year + period_number unique per org |

---

## 8. Edge Cases

### 8.1 Leap Year Handling

**Scenario:** Generating periods for a leap year (Feb 29)
**Solution:** Use LAST_DAY_OF_MONTH function that handles leap years

```pseudocode
FUNCTION last_day_of_month(year: Integer, month: Integer) -> Date
    // Returns 28/29 for Feb, 30/31 for other months
    next_month = DATE(year, month + 1, 1)
    RETURN next_month - 1 DAY
END FUNCTION
```

### 8.2 Non-Calendar Fiscal Year

**Scenario:** Fiscal year April 1 - March 31
**Solution:** fiscal_year represents the ending year

```
Fiscal Year 2026 (April-March):
- Period 1:  April 2025     (04/01/2025 - 04/30/2025)
- Period 2:  May 2025       (05/01/2025 - 05/31/2025)
- ...
- Period 12: March 2026     (03/01/2026 - 03/31/2026)
```

### 8.3 Period 13 (Adjustment Period)

**Scenario:** Need an adjustment period for year-end entries
**Solution:** Support period_number = 13 with same date range as period 12

```pseudocode
FUNCTION create_adjustment_period(organization_id: UUID, fiscal_year: Integer)

    period_12 = FiscalPeriodRepository.find_by_number(
        organization_id, fiscal_year, 12
    )

    adjustment_period = FiscalPeriod.create({
        organization_id: organization_id,
        fiscal_year: fiscal_year,
        period_number: 13,
        period_name: "Adjustment Period " + fiscal_year,
        period_type: 'ADJUSTMENT',
        start_date: period_12.end_date,  // Same last day
        end_date: period_12.end_date,
        is_closed: false
    })

    RETURN adjustment_period

END FUNCTION
```

### 8.4 Backdated Transaction in Closed Period

**Scenario:** User tries to post an invoice dated in a closed period
**Decision:** Reject with clear error message

```pseudocode
// In invoice posting
validation = validate_transaction_date(org_id, invoice.invoice_date)

IF NOT validation.valid THEN
    IF validation.error == "PERIOD_CLOSED" THEN
        THROW BusinessError(
            "Cannot post invoice dated " + invoice.invoice_date +
            ". Fiscal period '" + validation.period.period_name + "' is closed."
        )
    END IF
END IF
```

---

## 9. Related Modules

### 9.1 Invoice Integration

Invoices must post to open fiscal periods:
```sql
-- Invoice references fiscal period
invoices.fiscal_period_id → fiscal_periods.id
-- Set when invoice is posted, period must be open
```

See: [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md)

### 9.2 Journal Entry Integration

Journal entries must post to open fiscal periods:
```sql
-- Journal entry references fiscal period
journal_entries.fiscal_period_id → fiscal_periods.id
-- Period must be open for posting
```

See: [JOURNAL_ENTRY_MODULE.md](../journal-entry/JOURNAL_ENTRY_MODULE.md)

---

## Appendix A: Month Names Helper

```sql
CREATE OR REPLACE FUNCTION get_month_name(month_number INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE month_number
        WHEN 1 THEN 'January'
        WHEN 2 THEN 'February'
        WHEN 3 THEN 'March'
        WHEN 4 THEN 'April'
        WHEN 5 THEN 'May'
        WHEN 6 THEN 'June'
        WHEN 7 THEN 'July'
        WHEN 8 THEN 'August'
        WHEN 9 THEN 'September'
        WHEN 10 THEN 'October'
        WHEN 11 THEN 'November'
        WHEN 12 THEN 'December'
    END;
END;
$$ LANGUAGE plpgsql;
```

---

**Document End**
