# FinanX ERP - Backend Architecture Overview

**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Active Development

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Module Structure](#3-module-structure)
4. [Module Dependency Graph](#4-module-dependency-graph)
5. [Technology Stack](#5-technology-stack)
6. [Database Design Principles](#6-database-design-principles)
7. [API Standards](#7-api-standards)
8. [Security Architecture](#8-security-architecture)
9. [Implementation Order](#9-implementation-order)

---

## 1. System Overview

FinanX is a **Financial ERP System** designed for small to medium businesses requiring robust accounting capabilities. The system follows **double-entry accounting principles** and provides comprehensive financial management features.

### 1.1 Core Capabilities

| Capability | Description | Phase |
|------------|-------------|-------|
| Multi-tenant | Organization-based data isolation | 1 |
| Role-Based Access | Granular permission control | 1 |
| Double-Entry Accounting | Standard accounting principles | 1 |
| Accounts Receivable | Invoice management | 1 |
| Accounts Payable | Bill management | 2 |
| Payment Processing | Payment recording and matching | 2 |
| Financial Reporting | Balance sheet, P&L, etc. | 3 |
| Multi-Currency | Foreign currency transactions | 3 |

### 1.2 System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM CONTEXT                                   │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   Web App    │         │  Mobile App  │         │   Desktop    │
    │  (Next.js)   │         │   (Future)   │         │   (Tauri)    │
    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   API Gateway   │
                          │   (REST API)    │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌─────────────┐ ┌───────────┐ ┌─────────────┐
            │    RBAC     │ │  Business │ │  Accounting │
            │   Module    │ │  Modules  │ │   Engine    │
            └─────────────┘ └───────────┘ └─────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   PostgreSQL    │
                          │    Database     │
                          └─────────────────┘
```

---

## 2. Architecture Principles

### 2.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Modular Design** | Each module is self-contained with clear boundaries |
| **Single Responsibility** | Each module handles one domain area |
| **Explicit Dependencies** | Module relationships are documented and enforced |
| **Immutable Audit Trail** | Posted transactions cannot be modified |
| **Data Integrity First** | Database constraints enforce business rules |

### 2.2 Accounting Principles (Enforced)

These principles are **non-negotiable** and enforced at multiple levels:

1. **Double-Entry Bookkeeping**: Every transaction has equal debits and credits
2. **Immutability**: Posted entries cannot be modified, only reversed
3. **Audit Trail**: All changes are logged with user and timestamp
4. **Period Control**: Transactions only allowed in open fiscal periods
5. **Account Type Enforcement**: Correct account types for each transaction

---

## 3. Module Structure

### 3.1 Module Categories

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODULE CATEGORIES                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        FOUNDATION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Organization │  │     RBAC     │  │  Audit Log   │                   │
│  │    Module    │  │    Module    │  │    Module    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ACCOUNTING CORE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │    Chart of  │  │  Tax Codes   │  │   Fiscal     │                   │
│  │   Accounts   │  │    Module    │  │   Periods    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
│  ┌──────────────┐                                                        │
│  │   Journal    │                                                        │
│  │   Entries    │                                                        │
│  └──────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MASTER DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Customer   │  │   Vendor     │  │   Product    │                   │
│  │    Module    │  │   Module     │  │   Module     │                   │
│  │              │  │  (Phase 2)   │  │  (Phase 4)   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       TRANSACTION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Invoice    │  │    Bill      │  │   Payment    │                   │
│  │   Module     │  │   Module     │  │   Module     │                   │
│  │  (Phase 1)   │  │  (Phase 2)   │  │  (Phase 2)   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Module List with Documentation Links

| Module | Category | Phase | Documentation |
|--------|----------|-------|---------------|
| Organization | Foundation | 1 | [ORGANIZATION_MODULE.md](../modules/organization/ORGANIZATION_MODULE.md) |
| RBAC | Foundation | 1 | [RBAC_MODULE.md](../modules/rbac/RBAC_MODULE.md) |
| Audit Log | Foundation | 1 | [AUDIT_LOG_MODULE.md](../modules/audit-log/AUDIT_LOG_MODULE.md) |
| Chart of Accounts | Accounting Core | 1 | [CHART_OF_ACCOUNTS_MODULE.md](../modules/chart-of-accounts/CHART_OF_ACCOUNTS_MODULE.md) |
| Tax Codes | Accounting Core | 1 | [TAX_CODES_MODULE.md](../modules/tax-codes/TAX_CODES_MODULE.md) |
| Fiscal Periods | Accounting Core | 1 | [FISCAL_PERIOD_MODULE.md](../modules/fiscal-period/FISCAL_PERIOD_MODULE.md) |
| Journal Entry | Accounting Core | 1 | [JOURNAL_ENTRY_MODULE.md](../modules/journal-entry/JOURNAL_ENTRY_MODULE.md) |
| Customer | Master Data | 1 | [CUSTOMER_MODULE.md](../modules/customer/CUSTOMER_MODULE.md) |
| Invoice | Transaction | 1 | [INVOICE_MODULE.md](../modules/invoice/INVOICE_MODULE.md) |

---

## 4. Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MODULE DEPENDENCY GRAPH                             │
│                                                                          │
│   Direction: Arrow points FROM dependent TO dependency                   │
│   Example: Invoice ──► Customer means Invoice depends on Customer        │
└─────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │   Organization   │
                            │     (Root)       │
                            └────────┬─────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
    │       RBAC       │   │    Audit Log     │   │  Fiscal Period   │
    │   (Users, Roles) │   │                  │   │                  │
    └────────┬─────────┘   └──────────────────┘   └────────┬─────────┘
             │                                             │
             │                                             │
             ▼                                             │
    ┌──────────────────┐                                   │
    │  Chart of        │◄──────────────────────────────────┘
    │  Accounts        │
    └────────┬─────────┘
             │
    ┌────────┼─────────────────────────────┐
    │        │                             │
    ▼        ▼                             ▼
┌────────┐ ┌──────────────────┐   ┌──────────────────┐
│  Tax   │ │    Customer      │   │  Journal Entry   │
│ Codes  │ │                  │   │                  │
└───┬────┘ └────────┬─────────┘   └────────┬─────────┘
    │               │                      │
    │               │                      │
    └───────────────┼──────────────────────┘
                    │
                    ▼
           ┌──────────────────┐
           │     Invoice      │
           │                  │
           └──────────────────┘


DEPENDENCY MATRIX:
┌─────────────────┬─────┬──────┬───────┬─────┬─────┬────────┬─────────┬──────────┬─────────┐
│                 │ Org │ RBAC │ Audit │ COA │ Tax │ Fiscal │ Journal │ Customer │ Invoice │
├─────────────────┼─────┼──────┼───────┼─────┼─────┼────────┼─────────┼──────────┼─────────┤
│ Organization    │  -  │  -   │   -   │  -  │  -  │   -    │    -    │    -     │    -    │
│ RBAC            │  ✓  │  -   │   -   │  -  │  -  │   -    │    -    │    -     │    -    │
│ Audit Log       │  ✓  │  ✓   │   -   │  -  │  -  │   -    │    -    │    -     │    -    │
│ Chart of Accts  │  ✓  │  -   │   -   │  -  │  -  │   -    │    -    │    -     │    -    │
│ Tax Codes       │  ✓  │  -   │   -   │  ✓  │  -  │   -    │    -    │    -     │    -    │
│ Fiscal Period   │  ✓  │  -   │   -   │  -  │  -  │   -    │    -    │    -     │    -    │
│ Journal Entry   │  ✓  │  ✓   │   -   │  ✓  │  -  │   ✓    │    -    │    -     │    -    │
│ Customer        │  ✓  │  -   │   -   │  ✓  │  ✓  │   -    │    -    │    -     │    -    │
│ Invoice         │  ✓  │  ✓   │   -   │  ✓  │  ✓  │   ✓    │    ✓    │    ✓     │    -    │
└─────────────────┴─────┴──────┴───────┴─────┴─────┴────────┴─────────┴──────────┴─────────┘

Legend: ✓ = Depends on, - = No dependency
```

---

## 5. Technology Stack

### 5.1 Backend Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 20+ | JavaScript runtime |
| **Framework** | Express.js / Fastify | HTTP server |
| **Language** | TypeScript 5+ | Type safety |
| **Database** | PostgreSQL 15+ | Primary data store |
| **ORM** | Prisma / TypeORM | Database access |
| **Validation** | Zod / Joi | Request validation |
| **Auth** | JWT + bcrypt | Authentication |
| **Cache** | Redis | Session/permission cache |

### 5.2 Database Features Required

| Feature | Purpose |
|---------|---------|
| UUID generation | `gen_random_uuid()` |
| JSONB | Flexible settings storage |
| Triggers | Enforce business rules |
| Check constraints | Data validation |
| Partial indexes | Performance optimization |

---

## 6. Database Design Principles

### 6.1 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `invoices`, `journal_entries` |
| Columns | snake_case | `created_at`, `invoice_number` |
| Primary Keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign Keys | `{table}_id` | `customer_id`, `invoice_id` |
| Indexes | `idx_{table}_{columns}` | `idx_invoices_customer` |
| Constraints | `chk_{table}_{rule}` | `chk_invoice_positive_amount` |
| Triggers | `trg_{table}_{action}` | `trg_invoices_prevent_update` |

### 6.2 Standard Columns

Every table should include:

```sql
-- Audit columns (required for all tables)
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

-- Multi-tenant (required for business data tables)
organization_id UUID NOT NULL REFERENCES organizations(id),

-- User tracking (recommended for transactional tables)
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id)
```

### 6.3 Soft Delete vs Hard Delete

| Table Type | Delete Strategy | Reason |
|------------|----------------|--------|
| Transactions | Soft delete (status) | Audit trail |
| Master data | Soft delete (is_active) | Referential integrity |
| User sessions | Hard delete | Privacy |
| Audit logs | Never delete | Compliance |

---

## 7. API Standards

### 7.1 URL Structure

```
Base: /api/v1

Resources:
  GET    /api/v1/{resource}           - List all
  POST   /api/v1/{resource}           - Create new
  GET    /api/v1/{resource}/{id}      - Get one
  PUT    /api/v1/{resource}/{id}      - Update
  DELETE /api/v1/{resource}/{id}      - Delete

Actions:
  POST   /api/v1/{resource}/{id}/{action}  - Custom action

Examples:
  GET    /api/v1/invoices
  POST   /api/v1/invoices
  GET    /api/v1/invoices/123
  POST   /api/v1/invoices/123/post
  POST   /api/v1/invoices/123/void
```

### 7.2 Response Format

```json
// Success
{
    "success": true,
    "data": { },
    "meta": {
        "timestamp": "2026-01-21T10:30:00Z",
        "request_id": "uuid"
    }
}

// Error
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable message",
        "details": [],
        "field": null
    },
    "meta": { }
}

// Paginated
{
    "success": true,
    "data": [],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 100,
        "total_pages": 5
    },
    "meta": { }
}
```

### 7.3 HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate/conflict |
| 500 | Server Error | Unexpected error |

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│  Login   │────►│  Verify  │────►│  Issue   │
│          │     │ Request  │     │ Password │     │   JWT    │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
     ┌──────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Store   │────►│  Include │────►│  Access  │
│  Token   │     │ in Header│     │ Protected│
│          │     │          │     │ Resources│
└──────────┘     └──────────┘     └──────────┘
```

### 8.2 Authorization Flow

```
Request with JWT
       │
       ▼
┌─────────────────┐
│ Extract User ID │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Get User Roles  │────►│  Cache Lookup   │
│                 │     │  (Redis/Memory) │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Aggregate       │
│ Permissions     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Required  │───► DENY (403) or ALLOW
│ Permission      │
└─────────────────┘
```

### 8.3 Data Isolation

All business data is isolated by `organization_id`:

```sql
-- Every query MUST include organization filter
SELECT * FROM invoices
WHERE organization_id = $1  -- From JWT
  AND id = $2;

-- Row-Level Security (optional, additional layer)
CREATE POLICY org_isolation ON invoices
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 9. Implementation Order

### Phase 1: Foundation + Invoice Module

```
Week 1-2: Foundation
├── 1. Organization Module
├── 2. RBAC Module (Users, Roles, Permissions)
└── 3. Audit Log Module

Week 3-4: Accounting Core
├── 4. Chart of Accounts Module
├── 5. Tax Codes Module
├── 6. Fiscal Period Module
└── 7. Journal Entry Module

Week 5-6: Business Modules
├── 8. Customer Module
└── 9. Invoice Module

Week 7: Integration & Testing
├── API Integration Tests
├── Accounting Validation Tests
└── RBAC Tests
```

### Implementation Checklist per Module

```
For each module:
[ ] Review documentation
[ ] Create database migration
[ ] Implement models/entities
[ ] Implement repository layer
[ ] Implement service layer (business logic)
[ ] Implement API controllers
[ ] Implement validation schemas
[ ] Write unit tests
[ ] Write integration tests
[ ] Document API endpoints (OpenAPI/Swagger)
[ ] Code review
[ ] Deploy to staging
```

---

## Appendix: Quick Reference

### File Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── organization/
│   │   │   ├── organization.entity.ts
│   │   │   ├── organization.repository.ts
│   │   │   ├── organization.service.ts
│   │   │   ├── organization.controller.ts
│   │   │   ├── organization.dto.ts
│   │   │   └── organization.test.ts
│   │   ├── rbac/
│   │   ├── customer/
│   │   ├── invoice/
│   │   └── ...
│   ├── common/
│   │   ├── middleware/
│   │   ├── guards/
│   │   ├── filters/
│   │   └── utils/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   └── config/
├── docs/
│   └── backend/
│       ├── overview/
│       └── modules/
└── tests/
```

---

**Document End**

*This overview document should be updated as new modules are added.*
