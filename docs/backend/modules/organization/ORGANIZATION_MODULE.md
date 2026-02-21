# Organization Module

**Module:** Organization (Multi-Tenant Foundation)
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

The Organization module is the **root entity** of the entire system. It provides multi-tenant data isolation, ensuring that each organization's data is completely separated from others.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Tenant Isolation** | All business data is scoped to an organization |
| **Configuration** | Organization-level settings and preferences |
| **Identity** | Unique identification for each business entity |
| **Hierarchy Root** | Parent entity for all other modules |

### 1.3 Business Context

An **Organization** represents:
- A company or business entity using the ERP
- The boundary for data isolation
- The scope for user access and permissions
- The container for all accounting data

---

## 2. Dependencies

### 2.1 This Module Depends On

```
None - This is the root module
```

### 2.2 Modules That Depend On This

| Module | Relationship |
|--------|--------------|
| [RBAC](../rbac/RBAC_MODULE.md) | Users belong to organizations |
| [Customer](../customer/CUSTOMER_MODULE.md) | Customers belong to organizations |
| [Chart of Accounts](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) | Accounts belong to organizations |
| [Invoice](../invoice/INVOICE_MODULE.md) | Invoices belong to organizations |
| All other modules | `organization_id` foreign key |

### 2.3 Dependency Diagram

```
                    ┌──────────────────┐
                    │   Organization   │
                    │     (ROOT)       │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │  RBAC   │         │   COA   │         │ Fiscal  │
   │         │         │         │         │ Period  │
   └─────────┘         └─────────┘         └─────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                    (All other modules)
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        organizations                             │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                 │
│ name            VARCHAR(255) NOT NULL                           │
│ code            VARCHAR(50) UNIQUE NOT NULL                     │
│ legal_name      VARCHAR(255)                                    │
│ tax_id          VARCHAR(50)                                     │
│ email           VARCHAR(255)                                    │
│ phone           VARCHAR(50)                                     │
│ website         VARCHAR(255)                                    │
│ address_line1   VARCHAR(255)                                    │
│ address_line2   VARCHAR(255)                                    │
│ city            VARCHAR(100)                                    │
│ state           VARCHAR(100)                                    │
│ postal_code     VARCHAR(20)                                     │
│ country         VARCHAR(100)                                    │
│ base_currency   VARCHAR(3) DEFAULT 'USD'                        │
│ fiscal_year_end_month INTEGER DEFAULT 12                        │
│ is_active       BOOLEAN DEFAULT true                            │
│ settings        JSONB DEFAULT '{}'                              │
│ created_at      TIMESTAMP WITH TIME ZONE                        │
│ updated_at      TIMESTAMP WITH TIME ZONE                        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ 1:N
                             ▼
              (users, customers, invoices, etc.)
```

### 3.2 Table Definition

```sql
-- Organizations table (tenants)
CREATE TABLE organizations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,  -- Short code for URLs, references
    legal_name VARCHAR(255),            -- Official registered name
    tax_id VARCHAR(50),                 -- Tax identification number

    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',

    -- Accounting Configuration
    base_currency VARCHAR(3) DEFAULT 'USD',
    fiscal_year_end_month INTEGER DEFAULT 12,  -- 1-12

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Flexible Settings (JSONB)
    settings JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_fiscal_year_month CHECK (fiscal_year_end_month BETWEEN 1 AND 12),
    CONSTRAINT chk_currency_length CHECK (char_length(base_currency) = 3)
);

-- Indexes
CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.3 Settings JSONB Structure

The `settings` column stores organization-specific configurations:

```json
{
    "invoice": {
        "prefix": "INV",
        "default_payment_terms": 30,
        "default_notes": "Thank you for your business!",
        "auto_number": true
    },
    "accounting": {
        "decimal_places": 2,
        "negative_format": "parentheses",
        "date_format": "MM/DD/YYYY"
    },
    "notifications": {
        "email_on_invoice_post": true,
        "email_on_payment_received": true
    },
    "branding": {
        "logo_url": null,
        "primary_color": "#1a73e8"
    }
}
```

---

## 4. Data Flow

### 4.1 Organization Creation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  ORGANIZATION CREATION FLOW                       │
└──────────────────────────────────────────────────────────────────┘

     Admin/System                                    Database
          │                                              │
          │  1. Create Organization Request              │
          │─────────────────────────────────────────────►│
          │                                              │
          │  2. Validate unique code                     │
          │◄─────────────────────────────────────────────│
          │                                              │
          │  3. Insert organization                      │
          │─────────────────────────────────────────────►│
          │                                              │
          │  4. Create default chart of accounts         │
          │─────────────────────────────────────────────►│
          │                                              │
          │  5. Create default tax codes                 │
          │─────────────────────────────────────────────►│
          │                                              │
          │  6. Create fiscal periods                    │
          │─────────────────────────────────────────────►│
          │                                              │
          │  7. Create admin user                        │
          │─────────────────────────────────────────────►│
          │                                              │
          │  8. Return organization + admin credentials  │
          │◄─────────────────────────────────────────────│
          │                                              │
```

### 4.2 Organization Context Flow (Every Request)

```
┌──────────────────────────────────────────────────────────────────┐
│               ORGANIZATION CONTEXT MIDDLEWARE                     │
└──────────────────────────────────────────────────────────────────┘

  Request with JWT
        │
        ▼
  ┌───────────────┐
  │ Extract JWT   │
  │ Get user_id   │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Get User's    │
  │ organization  │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Validate org  │──────► 403 Forbidden (if inactive)
  │ is_active     │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Set context:  │
  │ org_id in req │
  └───────┬───────┘
          │
          ▼
     Continue to
     route handler
```

---

## 5. API Design

### 5.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/api/v1/organizations` | `system:admin` | Create organization |
| GET | `/api/v1/organizations` | `system:admin` | List all organizations |
| GET | `/api/v1/organizations/{id}` | `organization:read` | Get organization |
| PUT | `/api/v1/organizations/{id}` | `organization:update` | Update organization |
| GET | `/api/v1/organization` | `authenticated` | Get current user's org |
| PUT | `/api/v1/organization` | `organization:update` | Update current user's org |

### 5.2 Create Organization

**Endpoint:** `POST /api/v1/organizations`
**Permission:** `system:admin` (Super admin only)

**Request Body:**
```json
{
    "name": "Acme Corporation",
    "code": "acme",
    "legal_name": "Acme Corporation Inc.",
    "tax_id": "12-3456789",
    "email": "admin@acme.com",
    "phone": "+1-555-123-4567",
    "address_line1": "123 Business Ave",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "United States",
    "base_currency": "USD",
    "fiscal_year_end_month": 12,
    "admin_user": {
        "email": "admin@acme.com",
        "first_name": "John",
        "last_name": "Admin",
        "password": "SecurePassword123!"
    }
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "organization": {
            "id": "uuid",
            "name": "Acme Corporation",
            "code": "acme",
            "is_active": true,
            "created_at": "2026-01-21T10:00:00Z"
        },
        "admin_user": {
            "id": "uuid",
            "email": "admin@acme.com",
            "first_name": "John",
            "last_name": "Admin"
        },
        "setup_completed": {
            "chart_of_accounts": true,
            "tax_codes": true,
            "fiscal_periods": true,
            "admin_role": true
        }
    }
}
```

### 5.3 Get Current Organization

**Endpoint:** `GET /api/v1/organization`
**Permission:** `authenticated`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "Acme Corporation",
        "code": "acme",
        "legal_name": "Acme Corporation Inc.",
        "tax_id": "12-3456789",
        "email": "admin@acme.com",
        "phone": "+1-555-123-4567",
        "website": null,
        "address": {
            "line1": "123 Business Ave",
            "line2": null,
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "United States"
        },
        "accounting": {
            "base_currency": "USD",
            "fiscal_year_end_month": 12
        },
        "settings": {
            "invoice": {
                "prefix": "INV",
                "default_payment_terms": 30
            }
        },
        "is_active": true,
        "created_at": "2026-01-21T10:00:00Z",
        "updated_at": "2026-01-21T10:00:00Z"
    }
}
```

### 5.4 Update Organization

**Endpoint:** `PUT /api/v1/organization`
**Permission:** `organization:update`

**Request Body:**
```json
{
    "name": "Acme Corporation Updated",
    "phone": "+1-555-987-6543",
    "settings": {
        "invoice": {
            "prefix": "INV",
            "default_payment_terms": 45
        }
    }
}
```

**Response (200 OK):** Full organization object

### 5.5 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ORG_CODE_EXISTS` | 409 | Organization code already taken |
| `ORG_NOT_FOUND` | 404 | Organization not found |
| `ORG_INACTIVE` | 403 | Organization is deactivated |
| `INVALID_CURRENCY` | 400 | Invalid currency code |
| `INVALID_FISCAL_MONTH` | 400 | Fiscal month must be 1-12 |

---

## 6. Business Logic

### 6.1 Create Organization with Setup

```pseudocode
FUNCTION create_organization(data: CreateOrgDTO) -> Organization

    // Validate unique code
    existing = OrganizationRepository.find_by_code(data.code)
    IF existing IS NOT NULL THEN
        THROW ConflictError("Organization code already exists")
    END IF

    BEGIN TRANSACTION

        // 1. Create organization
        organization = Organization.create({
            name: data.name,
            code: data.code.toLowerCase(),
            legal_name: data.legal_name,
            tax_id: data.tax_id,
            email: data.email,
            phone: data.phone,
            address_line1: data.address_line1,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
            base_currency: data.base_currency ?? 'USD',
            fiscal_year_end_month: data.fiscal_year_end_month ?? 12,
            is_active: true,
            settings: default_settings()
        })

        // 2. Create default chart of accounts
        ChartOfAccountsService.create_defaults(organization.id)

        // 3. Create default tax codes
        TaxCodeService.create_defaults(organization.id)

        // 4. Create fiscal periods for current year
        FiscalPeriodService.create_year(organization.id, CURRENT_YEAR)

        // 5. Create admin role
        admin_role = RoleService.create_admin_role(organization.id)

        // 6. Create admin user (if provided)
        IF data.admin_user IS NOT NULL THEN
            admin_user = UserService.create({
                organization_id: organization.id,
                email: data.admin_user.email,
                first_name: data.admin_user.first_name,
                last_name: data.admin_user.last_name,
                password: data.admin_user.password,
                role_id: admin_role.id
            })
        END IF

    COMMIT TRANSACTION

    RETURN {
        organization: organization,
        admin_user: admin_user,
        setup_completed: {
            chart_of_accounts: true,
            tax_codes: true,
            fiscal_periods: true,
            admin_role: true
        }
    }

END FUNCTION
```

### 6.2 Default Settings Generator

```pseudocode
FUNCTION default_settings() -> JSONB

    RETURN {
        invoice: {
            prefix: "INV",
            default_payment_terms: 30,
            default_notes: "Thank you for your business!",
            auto_number: true
        },
        accounting: {
            decimal_places: 2,
            negative_format: "parentheses",
            date_format: "MM/DD/YYYY"
        },
        notifications: {
            email_on_invoice_post: false,
            email_on_payment_received: false
        }
    }

END FUNCTION
```

### 6.3 Organization Context Middleware

```pseudocode
FUNCTION organization_context_middleware(request, response, next)

    // Get user from JWT (already extracted by auth middleware)
    user = request.user

    IF user IS NULL THEN
        RETURN response.status(401).json({
            error: "UNAUTHORIZED"
        })
    END IF

    // Get user's organization
    organization = OrganizationRepository.find(user.organization_id)

    IF organization IS NULL THEN
        RETURN response.status(404).json({
            error: "ORG_NOT_FOUND",
            message: "Organization not found"
        })
    END IF

    IF NOT organization.is_active THEN
        RETURN response.status(403).json({
            error: "ORG_INACTIVE",
            message: "Organization is deactivated"
        })
    END IF

    // Set organization in request context
    request.organization = organization
    request.organization_id = organization.id

    next()

END FUNCTION
```

---

## 7. Validation Rules

### 7.1 Field Validations

| Field | Rules | Error |
|-------|-------|-------|
| `name` | Required, 1-255 chars | `Name is required` |
| `code` | Required, 2-50 chars, alphanumeric + hyphen | `Invalid code format` |
| `code` | Unique across system | `Code already exists` |
| `email` | Valid email format | `Invalid email` |
| `phone` | Valid phone format (optional) | `Invalid phone` |
| `base_currency` | Exactly 3 chars, valid ISO code | `Invalid currency` |
| `fiscal_year_end_month` | Integer 1-12 | `Invalid month` |

### 7.2 Code Format Rules

```
Valid codes:
- acme
- acme-corp
- company123
- my-company-2026

Invalid codes:
- ACME (uppercase - will be lowercased)
- acme corp (spaces not allowed)
- @acme (special characters)
- a (too short)
```

---

## 8. Edge Cases

### 8.1 Organization Deactivation

**Scenario:** Admin deactivates an organization
**Impact:**
- All users cannot log in
- API calls return 403 Forbidden
- Data is preserved but inaccessible

**Implementation:**
```sql
-- Deactivate organization
UPDATE organizations SET is_active = false WHERE id = $1;

-- All subsequent requests for this org's users will fail
-- in organization_context_middleware
```

### 8.2 Code Change Attempt

**Scenario:** Admin tries to change organization code
**Rule:** Organization code is immutable after creation
**Implementation:**
```sql
-- Trigger to prevent code changes
CREATE OR REPLACE FUNCTION prevent_org_code_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.code != NEW.code THEN
        RAISE EXCEPTION 'Organization code cannot be changed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_org_code_change
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_org_code_change();
```

### 8.3 Orphan Prevention

**Scenario:** Attempt to delete organization with data
**Rule:** Organizations with any related data cannot be deleted
**Implementation:** Use ON DELETE RESTRICT for all foreign keys

---

## 9. Related Modules

### 9.1 Direct Relationships

| Module | Relationship | Link |
|--------|--------------|------|
| RBAC | Users belong to organization | [RBAC_MODULE.md](../rbac/RBAC_MODULE.md) |
| Customer | Customers scoped to organization | [CUSTOMER_MODULE.md](../customer/CUSTOMER_MODULE.md) |
| Chart of Accounts | Accounts scoped to organization | [CHART_OF_ACCOUNTS_MODULE.md](../chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |

### 9.2 Usage in Other Modules

Every module that stores business data includes:

```sql
organization_id UUID NOT NULL REFERENCES organizations(id)
```

Every API endpoint validates organization context:

```typescript
// In every route handler
const orgId = req.organization_id; // Set by middleware
const data = await repository.find({ organization_id: orgId, ...filters });
```

---

## Appendix A: Sample Data

```sql
INSERT INTO organizations (
    name, code, legal_name, tax_id,
    email, phone,
    address_line1, city, state, postal_code, country,
    base_currency, fiscal_year_end_month
) VALUES (
    'Demo Company',
    'demo',
    'Demo Company LLC',
    '98-7654321',
    'admin@demo.com',
    '+1-555-000-0000',
    '456 Demo Street',
    'San Francisco',
    'CA',
    '94102',
    'United States',
    'USD',
    12
);
```

---

**Document End**
