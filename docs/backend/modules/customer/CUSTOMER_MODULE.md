# Customer Module

**Module:** Customer (Master Data)
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

The Customer module manages customer master data for the ERP system. Customers are essential entities for Accounts Receivable transactions, serving as the counterparty in invoicing and payment processes.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Customer Registry** | Store and manage customer information |
| **AR Account Mapping** | Link customers to Accounts Receivable accounts |
| **Tax Configuration** | Set default tax codes per customer |
| **Contact Management** | Store primary and billing contacts |
| **Credit Management** | Track credit limits and payment terms |

### 1.3 Business Context

A **Customer** represents:
- A party that purchases goods or services from the organization
- The entity that owes payment on invoices (Accounts Receivable)
- A master data record used across multiple transactions

### 1.4 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Type** | Master Data |
| **Accounting Link** | Maps to AR account in Chart of Accounts |
| **Transaction Role** | Referenced by Invoices, Payments, Credit Notes |
| **Deletion** | Soft delete only (deactivate) |

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Required Fields | Link |
|--------|--------------|-----------------|------|
| Organization | Customers belong to org | `organization_id` | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |
| Chart of Accounts | AR account mapping | `ar_account_id` | [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |
| Tax Codes | Default tax code | `default_tax_code_id` | [TAX_CODES_MODULE.md](../tax-codes/TAX_CODES_MODULE.md) |

### 2.2 Modules That Depend On This

| Module | Relationship | Link |
|--------|--------------|------|
| Invoice | Invoice to customer | [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md) |
| Payment | Payment from customer | Phase 2 |
| Credit Note | Credit to customer | Phase 2 |

### 2.3 Dependency Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Organization   │     │ Chart of Accounts│     │    Tax Codes     │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Customer     │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Invoice  │ │ Payment  │ │  Credit  │
              │          │ │ (Ph. 2)  │ │  Note    │
              └──────────┘ └──────────┘ └──────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   organizations  │          │ chart_of_accounts│
│──────────────────│          │──────────────────│
│ id (PK)          │          │ id (PK)          │
│ name             │          │ account_code     │
│ ...              │          │ account_type     │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         │ 1:N                         │ 1:N (AR accounts)
         │                             │
         │                             │
         │     ┌───────────────────────┘
         │     │
         ▼     ▼
┌──────────────────────────────────────────────────────────────────┐
│                           customers                               │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ organization_id       UUID NOT NULL FK → organizations            │
│ customer_code         VARCHAR(50) UNIQUE per org                  │
│ name                  VARCHAR(255) NOT NULL                       │
│ legal_name            VARCHAR(255)                                │
│ email                 VARCHAR(255)                                │
│ phone                 VARCHAR(50)                                 │
│ website               VARCHAR(255)                                │
│ tax_id                VARCHAR(50)                                 │
│ address_line1         VARCHAR(255)                                │
│ address_line2         VARCHAR(255)                                │
│ city                  VARCHAR(100)                                │
│ state                 VARCHAR(100)                                │
│ postal_code           VARCHAR(20)                                 │
│ country               VARCHAR(100)                                │
│ billing_address_*     (same fields for billing)                   │
│ ar_account_id         UUID NOT NULL FK → chart_of_accounts        │
│ default_tax_code_id   UUID FK → tax_codes                         │
│ credit_limit          DECIMAL(18,2) DEFAULT 0                     │
│ payment_terms         INTEGER DEFAULT 30                          │
│ currency_code         VARCHAR(3) DEFAULT 'USD'                    │
│ is_active             BOOLEAN DEFAULT true                        │
│ notes                 TEXT                                        │
│ metadata              JSONB DEFAULT '{}'                          │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
│ updated_at            TIMESTAMP WITH TIME ZONE                    │
│ created_by            UUID FK → users                             │
│ updated_by            UUID FK → users                             │
└──────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       customer_contacts                           │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ customer_id           UUID NOT NULL FK → customers                │
│ contact_type          ENUM('primary','billing','shipping','other')│
│ name                  VARCHAR(255) NOT NULL                       │
│ title                 VARCHAR(100)                                │
│ email                 VARCHAR(255)                                │
│ phone                 VARCHAR(50)                                 │
│ is_primary            BOOLEAN DEFAULT false                       │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
│ updated_at            TIMESTAMP WITH TIME ZONE                    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Customers Table Definition

```sql
CREATE TABLE customers (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Customer Identity
    customer_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),

    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),

    -- Primary Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',

    -- Billing Address (if different)
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    use_primary_as_billing BOOLEAN DEFAULT true,

    -- Accounting Configuration
    ar_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    default_tax_code_id UUID REFERENCES tax_codes(id),

    -- Credit & Terms
    credit_limit DECIMAL(18,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,  -- Days
    currency_code VARCHAR(3) DEFAULT 'USD',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Additional Info
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_customer_code UNIQUE(organization_id, customer_code),
    CONSTRAINT chk_payment_terms CHECK (payment_terms >= 0),
    CONSTRAINT chk_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT chk_currency_code CHECK (char_length(currency_code) = 3)
);

-- Indexes
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_code ON customers(organization_id, customer_code);
CREATE INDEX idx_customers_name ON customers(organization_id, name);
CREATE INDEX idx_customers_email ON customers(organization_id, email);
CREATE INDEX idx_customers_active ON customers(organization_id, is_active)
    WHERE is_active = true;
CREATE INDEX idx_customers_ar_account ON customers(ar_account_id);

-- Trigger for updated_at
CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent deletion if customer has transactions
CREATE OR REPLACE FUNCTION prevent_customer_with_invoices_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM invoices WHERE customer_id = OLD.id LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot delete customer with existing invoices. Deactivate instead.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_customer_deletion
    BEFORE DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION prevent_customer_with_invoices_deletion();
```

### 3.3 Customer Contacts Table

```sql
CREATE TYPE contact_type AS ENUM ('primary', 'billing', 'shipping', 'other');

CREATE TABLE customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Contact Info
    contact_type contact_type NOT NULL DEFAULT 'primary',
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),

    -- Flags
    is_primary BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Only one primary contact per customer
CREATE UNIQUE INDEX idx_customer_contacts_primary
    ON customer_contacts(customer_id)
    WHERE is_primary = true;

CREATE INDEX idx_customer_contacts_customer ON customer_contacts(customer_id);

-- Trigger for updated_at
CREATE TRIGGER trg_customer_contacts_updated_at
    BEFORE UPDATE ON customer_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.4 Customer Number Sequence

```sql
CREATE TABLE customer_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    prefix VARCHAR(10) DEFAULT 'CUST',
    current_number BIGINT NOT NULL DEFAULT 0,
    padding_length INTEGER DEFAULT 5,  -- CUST-00001
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id)
);

-- Function to get next customer code
CREATE OR REPLACE FUNCTION get_next_customer_code(p_organization_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_next_number BIGINT;
    v_padding INTEGER;
    v_result VARCHAR(50);
BEGIN
    -- Lock and increment
    UPDATE customer_number_sequences
    SET current_number = current_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = p_organization_id
    RETURNING prefix, current_number, padding_length
    INTO v_prefix, v_next_number, v_padding;

    -- If no sequence exists, create one
    IF v_next_number IS NULL THEN
        INSERT INTO customer_number_sequences (organization_id, current_number)
        VALUES (p_organization_id, 1)
        RETURNING prefix, current_number, padding_length
        INTO v_prefix, v_next_number, v_padding;
    END IF;

    -- Format: CUST-00001
    v_result := v_prefix || '-' || LPAD(v_next_number::TEXT, v_padding, '0');

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Data Flow

### 4.1 Customer Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER CREATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

    User                          Server                        Database
      │                             │                              │
      │  POST /customers            │                              │
      │  {name, email, ...}         │                              │
      │────────────────────────────►│                              │
      │                             │                              │
      │                             │  Validate AR account exists  │
      │                             │  and is correct type         │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Validate tax code (if any)  │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Generate customer code      │
      │                             │  (if not provided)           │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Create customer record      │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │                             │  Create primary contact      │
      │                             │  (if provided)               │
      │                             │─────────────────────────────►│
      │                             │◄─────────────────────────────│
      │                             │                              │
      │  {customer object}          │                              │
      │◄────────────────────────────│                              │
      │                             │                              │
```

### 4.2 Customer Usage in Invoice Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER → INVOICE RELATIONSHIP                       │
└─────────────────────────────────────────────────────────────────────────┘

    Customer                     Invoice Creation                  Journal
       │                              │                              │
       │  1. User selects customer    │                              │
       │─────────────────────────────►│                              │
       │                              │                              │
       │  2. Load customer defaults   │                              │
       │     - Payment terms          │                              │
       │     - Tax code               │                              │
       │     - AR account             │                              │
       │◄─────────────────────────────│                              │
       │                              │                              │
       │  3. Create invoice with      │                              │
       │     customer_id reference    │                              │
       │                              │                              │
       │  4. On POST: Get AR account  │                              │
       │     from customer            │                              │
       │─────────────────────────────►│                              │
       │                              │                              │
       │                              │  5. Create journal entry     │
       │                              │     DR: Customer's AR Acct   │
       │                              │     CR: Revenue              │
       │                              │─────────────────────────────►│
       │                              │                              │
```

---

## 5. API Design

### 5.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/customers` | `customer:read` | List customers |
| POST | `/api/v1/customers` | `customer:create` | Create customer |
| GET | `/api/v1/customers/{id}` | `customer:read` | Get customer |
| PUT | `/api/v1/customers/{id}` | `customer:update` | Update customer |
| DELETE | `/api/v1/customers/{id}` | `customer:delete` | Deactivate customer |
| GET | `/api/v1/customers/{id}/contacts` | `customer:read` | List contacts |
| POST | `/api/v1/customers/{id}/contacts` | `customer:update` | Add contact |
| PUT | `/api/v1/customers/{id}/contacts/{cid}` | `customer:update` | Update contact |
| DELETE | `/api/v1/customers/{id}/contacts/{cid}` | `customer:update` | Remove contact |
| GET | `/api/v1/customers/{id}/balance` | `customer:read` | Get AR balance |

### 5.2 List Customers

**Endpoint:** `GET /api/v1/customers`
**Permission:** `customer:read`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 100) |
| `search` | string | - | Search by name, code, email |
| `is_active` | boolean | true | Filter by active status |
| `sort_by` | string | name | Sort field |
| `sort_order` | string | asc | Sort order |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "customer_code": "CUST-00001",
            "name": "Acme Corporation",
            "email": "billing@acme.com",
            "phone": "+1-555-123-4567",
            "city": "New York",
            "state": "NY",
            "payment_terms": 30,
            "credit_limit": 50000.00,
            "is_active": true,
            "outstanding_balance": 12500.00,
            "created_at": "2026-01-01T10:00:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 45,
        "total_pages": 3
    }
}
```

### 5.3 Create Customer

**Endpoint:** `POST /api/v1/customers`
**Permission:** `customer:create`

**Request Body:**
```json
{
    "customer_code": "CUST-ACME",
    "name": "Acme Corporation",
    "legal_name": "Acme Corporation Inc.",
    "email": "billing@acme.com",
    "phone": "+1-555-123-4567",
    "website": "https://acme.com",
    "tax_id": "12-3456789",
    "address_line1": "123 Business Ave",
    "address_line2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "United States",
    "ar_account_id": "uuid",
    "default_tax_code_id": "uuid",
    "credit_limit": 50000.00,
    "payment_terms": 30,
    "notes": "Key enterprise client",
    "primary_contact": {
        "name": "John Smith",
        "title": "Finance Manager",
        "email": "john.smith@acme.com",
        "phone": "+1-555-123-4568"
    }
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "customer_code": "CUST-ACME",
        "name": "Acme Corporation",
        "legal_name": "Acme Corporation Inc.",
        "email": "billing@acme.com",
        "phone": "+1-555-123-4567",
        "website": "https://acme.com",
        "tax_id": "12-3456789",
        "address": {
            "line1": "123 Business Ave",
            "line2": "Suite 100",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "United States"
        },
        "billing_address": null,
        "use_primary_as_billing": true,
        "ar_account": {
            "id": "uuid",
            "code": "1100",
            "name": "Accounts Receivable"
        },
        "default_tax_code": {
            "id": "uuid",
            "code": "STANDARD",
            "rate": 0.0825
        },
        "credit_limit": 50000.00,
        "payment_terms": 30,
        "currency_code": "USD",
        "is_active": true,
        "notes": "Key enterprise client",
        "contacts": [
            {
                "id": "uuid",
                "name": "John Smith",
                "title": "Finance Manager",
                "email": "john.smith@acme.com",
                "phone": "+1-555-123-4568",
                "contact_type": "primary",
                "is_primary": true
            }
        ],
        "created_at": "2026-01-21T10:00:00Z"
    }
}
```

### 5.4 Get Customer Details

**Endpoint:** `GET /api/v1/customers/{customer_id}`
**Permission:** `customer:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "customer_code": "CUST-ACME",
        "name": "Acme Corporation",
        "email": "billing@acme.com",
        "address": { },
        "billing_address": { },
        "ar_account": { },
        "default_tax_code": { },
        "credit_limit": 50000.00,
        "payment_terms": 30,
        "is_active": true,
        "contacts": [ ],
        "statistics": {
            "total_invoiced": 125000.00,
            "total_paid": 112500.00,
            "outstanding_balance": 12500.00,
            "overdue_amount": 0.00,
            "invoice_count": 15,
            "last_invoice_date": "2026-01-15",
            "last_payment_date": "2026-01-10"
        },
        "created_at": "2026-01-01T10:00:00Z",
        "updated_at": "2026-01-15T14:30:00Z"
    }
}
```

### 5.5 Update Customer

**Endpoint:** `PUT /api/v1/customers/{customer_id}`
**Permission:** `customer:update`

**Request Body:**
```json
{
    "name": "Acme Corporation Updated",
    "phone": "+1-555-987-6543",
    "credit_limit": 75000.00,
    "payment_terms": 45
}
```

### 5.6 Deactivate Customer

**Endpoint:** `DELETE /api/v1/customers/{customer_id}`
**Permission:** `customer:delete`

This performs a soft delete (sets `is_active = false`).

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "customer_code": "CUST-ACME",
        "name": "Acme Corporation",
        "is_active": false,
        "deactivated_at": "2026-01-21T10:00:00Z"
    }
}
```

### 5.7 Get Customer Balance

**Endpoint:** `GET /api/v1/customers/{customer_id}/balance`
**Permission:** `customer:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "customer_id": "uuid",
        "customer_name": "Acme Corporation",
        "currency_code": "USD",
        "balance": {
            "total_invoiced": 125000.00,
            "total_paid": 112500.00,
            "total_credits": 0.00,
            "outstanding_balance": 12500.00,
            "overdue_amount": 0.00
        },
        "aging": {
            "current": 12500.00,
            "days_1_30": 0.00,
            "days_31_60": 0.00,
            "days_61_90": 0.00,
            "days_over_90": 0.00
        },
        "credit": {
            "credit_limit": 50000.00,
            "available_credit": 37500.00,
            "utilization_percent": 25.00
        },
        "as_of_date": "2026-01-21"
    }
}
```

### 5.8 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CUSTOMER_NOT_FOUND` | 404 | Customer not found |
| `CUSTOMER_CODE_EXISTS` | 409 | Customer code already exists |
| `AR_ACCOUNT_NOT_FOUND` | 400 | AR account not found |
| `AR_ACCOUNT_INVALID_TYPE` | 400 | Account is not AR type |
| `TAX_CODE_NOT_FOUND` | 400 | Tax code not found |
| `CUSTOMER_HAS_TRANSACTIONS` | 400 | Cannot delete customer with transactions |
| `CREDIT_LIMIT_EXCEEDED` | 400 | Credit limit would be exceeded |

---

## 6. Business Logic

### 6.1 Create Customer

```pseudocode
FUNCTION create_customer(data: CustomerCreateDTO, user: User) -> Customer

    // 1. Generate customer code if not provided
    IF data.customer_code IS NULL OR data.customer_code IS EMPTY THEN
        data.customer_code = get_next_customer_code(user.organization_id)
    END IF

    // 2. Check code uniqueness
    existing = CustomerRepository.find_by_code(
        user.organization_id,
        data.customer_code
    )
    IF existing IS NOT NULL THEN
        THROW ConflictError("Customer code already exists")
    END IF

    // 3. Validate AR account
    ar_account = ChartOfAccountsRepository.find(data.ar_account_id)
    IF ar_account IS NULL THEN
        THROW NotFoundError("AR account not found")
    END IF
    IF ar_account.organization_id != user.organization_id THEN
        THROW ForbiddenError("AR account belongs to different organization")
    END IF
    IF ar_account.account_subtype != 'ACCOUNTS_RECEIVABLE' THEN
        THROW ValidationError("Account must be of type Accounts Receivable")
    END IF

    // 4. Validate tax code (if provided)
    IF data.default_tax_code_id IS NOT NULL THEN
        tax_code = TaxCodeRepository.find(data.default_tax_code_id)
        IF tax_code IS NULL THEN
            THROW NotFoundError("Tax code not found")
        END IF
        IF tax_code.organization_id != user.organization_id THEN
            THROW ForbiddenError("Tax code belongs to different organization")
        END IF
    END IF

    BEGIN TRANSACTION

        // 5. Create customer
        customer = Customer.create({
            organization_id: user.organization_id,
            customer_code: data.customer_code,
            name: data.name,
            legal_name: data.legal_name,
            email: data.email,
            phone: data.phone,
            website: data.website,
            tax_id: data.tax_id,
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country ?? 'United States',
            ar_account_id: data.ar_account_id,
            default_tax_code_id: data.default_tax_code_id,
            credit_limit: data.credit_limit ?? 0,
            payment_terms: data.payment_terms ?? 30,
            currency_code: data.currency_code ?? 'USD',
            is_active: true,
            notes: data.notes,
            created_by: user.id
        })

        // 6. Create primary contact if provided
        IF data.primary_contact IS NOT NULL THEN
            CustomerContact.create({
                customer_id: customer.id,
                contact_type: 'primary',
                name: data.primary_contact.name,
                title: data.primary_contact.title,
                email: data.primary_contact.email,
                phone: data.primary_contact.phone,
                is_primary: true
            })
        END IF

    COMMIT TRANSACTION

    // 7. Audit log
    AuditLog.record('customers', customer.id, 'INSERT', null, customer)

    RETURN customer

END FUNCTION
```

### 6.2 Calculate Customer Balance

```pseudocode
FUNCTION get_customer_balance(customer_id: UUID) -> CustomerBalance

    customer = CustomerRepository.find(customer_id)
    IF customer IS NULL THEN
        THROW NotFoundError("Customer not found")
    END IF

    // Get invoice totals
    invoice_stats = SQL """
        SELECT
            COALESCE(SUM(total_amount), 0) as total_invoiced,
            COALESCE(SUM(balance_due), 0) as outstanding_balance
        FROM invoices
        WHERE customer_id = $1
          AND status = 'posted'
    """(customer_id)

    // Get payment totals (Phase 2)
    // payment_stats = ...

    // Calculate aging buckets
    today = CURRENT_DATE
    aging = SQL """
        SELECT
            COALESCE(SUM(CASE WHEN due_date >= $2 THEN balance_due ELSE 0 END), 0) as current,
            COALESCE(SUM(CASE WHEN due_date < $2 AND due_date >= $2 - 30 THEN balance_due ELSE 0 END), 0) as days_1_30,
            COALESCE(SUM(CASE WHEN due_date < $2 - 30 AND due_date >= $2 - 60 THEN balance_due ELSE 0 END), 0) as days_31_60,
            COALESCE(SUM(CASE WHEN due_date < $2 - 60 AND due_date >= $2 - 90 THEN balance_due ELSE 0 END), 0) as days_61_90,
            COALESCE(SUM(CASE WHEN due_date < $2 - 90 THEN balance_due ELSE 0 END), 0) as days_over_90
        FROM invoices
        WHERE customer_id = $1
          AND status = 'posted'
          AND balance_due > 0
    """(customer_id, today)

    RETURN {
        customer_id: customer_id,
        customer_name: customer.name,
        currency_code: customer.currency_code,
        balance: {
            total_invoiced: invoice_stats.total_invoiced,
            total_paid: invoice_stats.total_invoiced - invoice_stats.outstanding_balance,
            outstanding_balance: invoice_stats.outstanding_balance
        },
        aging: aging,
        credit: {
            credit_limit: customer.credit_limit,
            available_credit: customer.credit_limit - invoice_stats.outstanding_balance,
            utilization_percent: (invoice_stats.outstanding_balance / customer.credit_limit) * 100
        }
    }

END FUNCTION
```

### 6.3 Deactivate Customer

```pseudocode
FUNCTION deactivate_customer(customer_id: UUID, user: User) -> Customer

    customer = CustomerRepository.find(customer_id)
    IF customer IS NULL THEN
        THROW NotFoundError("Customer not found")
    END IF

    // Check for open balances
    balance = get_customer_balance(customer_id)
    IF balance.outstanding_balance > 0 THEN
        // Warning but don't prevent
        LOG.warn("Deactivating customer with outstanding balance: " + balance.outstanding_balance)
    END IF

    // Update customer
    CustomerRepository.update(customer_id, {
        is_active: false,
        updated_at: CURRENT_TIMESTAMP,
        updated_by: user.id
    })

    // Audit log
    AuditLog.record('customers', customer_id, 'UPDATE',
        {is_active: true},
        {is_active: false}
    )

    RETURN CustomerRepository.find(customer_id)

END FUNCTION
```

---

## 7. Validation Rules

### 7.1 Field Validations

| Field | Rules | Error |
|-------|-------|-------|
| `customer_code` | 2-50 chars, alphanumeric + hyphen, unique per org | `Invalid code` |
| `name` | Required, 1-255 chars | `Name is required` |
| `email` | Valid email format | `Invalid email` |
| `phone` | Valid phone format | `Invalid phone` |
| `ar_account_id` | Required, must be AR type account | `Invalid AR account` |
| `payment_terms` | >= 0 | `Invalid payment terms` |
| `credit_limit` | >= 0 | `Invalid credit limit` |
| `currency_code` | Exactly 3 chars | `Invalid currency` |

### 7.2 Business Rules

| Rule | Description |
|------|-------------|
| Unique code per org | Customer code must be unique within organization |
| AR account type | AR account must be of subtype ACCOUNTS_RECEIVABLE |
| Same organization | AR account and tax code must belong to same org |
| Cannot delete with transactions | Customers with invoices cannot be deleted |

---

## 8. Edge Cases

### 8.1 Customer with Outstanding Balance Deactivation

**Scenario:** User tries to deactivate a customer with unpaid invoices
**Behavior:** Allow deactivation but warn user
**Reason:** Business may need to deactivate non-paying customers

```pseudocode
IF balance.outstanding_balance > 0 THEN
    // Log warning but proceed
    response.warnings.push({
        code: "OUTSTANDING_BALANCE",
        message: "Customer has outstanding balance of " + balance.outstanding_balance
    })
END IF
```

### 8.2 Customer Code Change

**Scenario:** User tries to change customer code after creation
**Decision:** Allow change if no posted invoices exist

```pseudocode
FUNCTION update_customer_code(customer_id: UUID, new_code: String)

    // Check for posted invoices
    posted_invoices = InvoiceRepository.count_posted(customer_id)
    IF posted_invoices > 0 THEN
        THROW BusinessError("Cannot change code for customer with posted invoices")
    END IF

    // Proceed with update
    CustomerRepository.update(customer_id, {customer_code: new_code})

END FUNCTION
```

### 8.3 AR Account Change

**Scenario:** User changes customer's AR account after invoices exist
**Decision:** Only affect future invoices; existing invoices retain their journal entries

```pseudocode
FUNCTION update_ar_account(customer_id: UUID, new_ar_account_id: UUID)

    // Validate new account
    validate_ar_account(new_ar_account_id)

    // Update customer - only affects future invoices
    CustomerRepository.update(customer_id, {ar_account_id: new_ar_account_id})

    // Note: Existing posted invoices retain original journal entries
    // No retroactive changes

END FUNCTION
```

### 8.4 Credit Limit Enforcement

**Scenario:** Invoice would exceed customer's credit limit
**Decision:** Warn on draft creation, block on posting (configurable)

```pseudocode
FUNCTION check_credit_limit(customer_id: UUID, invoice_amount: Decimal)

    customer = CustomerRepository.find(customer_id)

    IF customer.credit_limit == 0 THEN
        // No credit limit set - allow
        RETURN true
    END IF

    balance = get_customer_balance(customer_id)
    new_total = balance.outstanding_balance + invoice_amount

    IF new_total > customer.credit_limit THEN
        THROW CreditLimitError({
            credit_limit: customer.credit_limit,
            current_balance: balance.outstanding_balance,
            invoice_amount: invoice_amount,
            would_exceed_by: new_total - customer.credit_limit
        })
    END IF

    RETURN true

END FUNCTION
```

---

## 9. Related Modules

### 9.1 Chart of Accounts Integration

The customer's `ar_account_id` determines which account is debited when invoices are posted.

```sql
-- When posting an invoice:
-- DEBIT: customer.ar_account_id
-- CREDIT: invoice_line.revenue_account_id
```

See: [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md)

### 9.2 Tax Codes Integration

The customer's `default_tax_code_id` is used as the default when creating invoice lines.

See: [TAX_CODES_MODULE.md](../tax-codes/TAX_CODES_MODULE.md)

### 9.3 Invoice Integration

Invoices reference customers and use customer data for:
- AR account (for journal entries)
- Default tax code (for new lines)
- Payment terms (for due date calculation)
- Billing address (for invoice display)

See: [INVOICE_MODULE.md](../invoice/INVOICE_MODULE.md)

---

## Appendix A: Sample Data

```sql
-- Sample customers
INSERT INTO customers (
    organization_id, customer_code, name, legal_name,
    email, phone,
    address_line1, city, state, postal_code, country,
    ar_account_id, default_tax_code_id,
    credit_limit, payment_terms
) VALUES
(
    'org-uuid', 'CUST-00001', 'Acme Corporation', 'Acme Corporation Inc.',
    'billing@acme.com', '+1-555-123-4567',
    '123 Business Ave', 'New York', 'NY', '10001', 'United States',
    'ar-account-uuid', 'tax-code-uuid',
    50000.00, 30
),
(
    'org-uuid', 'CUST-00002', 'Beta Industries', 'Beta Industries LLC',
    'ap@beta.com', '+1-555-987-6543',
    '456 Industrial Blvd', 'Los Angeles', 'CA', '90001', 'United States',
    'ar-account-uuid', 'tax-code-uuid',
    25000.00, 45
);
```

---

**Document End**
