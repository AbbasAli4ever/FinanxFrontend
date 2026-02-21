# Audit Log Module

**Module:** Audit Log (Foundation)
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

The Audit Log module provides a **complete, immutable record** of all significant actions in the system. It tracks who did what, when, and captures before/after states for data changes.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Action Recording** | Log all significant system actions |
| **Change Tracking** | Capture before/after data states |
| **User Attribution** | Record which user performed each action |
| **Query Support** | Enable searching and filtering audit history |
| **Compliance** | Support regulatory and audit requirements |

### 1.3 What Gets Logged

| Category | Examples |
|----------|----------|
| **Authentication** | Login, logout, password change, failed logins |
| **Data Changes** | Create, update, delete on business entities |
| **Business Actions** | Invoice post, invoice void, payment apply |
| **Permission Events** | Permission denied, role assignment |
| **Configuration** | Settings changes, fiscal period close |

### 1.4 Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Immutable** | Audit logs cannot be modified or deleted |
| **Complete** | All significant actions are captured |
| **Timestamped** | Precise UTC timestamps |
| **Contextual** | IP address, user agent, session info |

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Logs scoped to org | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |
| RBAC | User reference | [RBAC_MODULE.md](../rbac/RBAC_MODULE.md) |

### 2.2 Modules That Use This

| Module | Usage |
|--------|-------|
| All modules | Call audit log on significant actions |

### 2.3 Dependency Diagram

```
┌──────────────────┐     ┌──────────────────┐
│   Organization   │     │      Users       │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
              ┌──────────────────┐
              │    Audit Log     │
              └──────────────────┘
                      ▲
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───┴────┐      ┌─────┴────┐      ┌─────┴────┐
│Invoice │      │ Customer │      │  User    │
│        │      │          │      │Management│
└────────┘      └──────────┘      └──────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
              Record all changes
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AUDIT LOG SCHEMA                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   organizations  │          │      users       │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         │ 1:N                         │ 1:N
         │                             │
         └─────────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                         audit_logs                                │
│──────────────────────────────────────────────────────────────────│
│ id                    UUID PRIMARY KEY                            │
│ organization_id       UUID NOT NULL FK → organizations            │
│ user_id               UUID FK → users (nullable for system)       │
│ action                VARCHAR(50) NOT NULL                        │
│ entity_type           VARCHAR(100) NOT NULL                       │
│ entity_id             UUID NOT NULL                               │
│ old_values            JSONB                                       │
│ new_values            JSONB                                       │
│ changed_fields        TEXT[]                                      │
│ ip_address            INET                                        │
│ user_agent            TEXT                                        │
│ session_id            UUID                                        │
│ request_id            UUID                                        │
│ additional_data       JSONB                                       │
│ created_at            TIMESTAMP WITH TIME ZONE                    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Audit Logs Table Definition

```sql
CREATE TABLE audit_logs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Actor
    user_id UUID REFERENCES users(id),  -- NULL for system actions
    user_email VARCHAR(255),            -- Denormalized for history

    -- Action
    action VARCHAR(50) NOT NULL,        -- INSERT, UPDATE, DELETE, LOGIN, etc.
    action_description TEXT,            -- Human-readable description

    -- Target Entity
    entity_type VARCHAR(100) NOT NULL,  -- Table/model name: 'invoices', 'customers'
    entity_id UUID NOT NULL,            -- Primary key of affected record

    -- Change Data
    old_values JSONB,                   -- State before change (for UPDATE/DELETE)
    new_values JSONB,                   -- State after change (for INSERT/UPDATE)
    changed_fields TEXT[],              -- List of changed field names

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    request_id UUID,                    -- Correlation ID for request tracing

    -- Additional Context
    additional_data JSONB DEFAULT '{}', -- Any extra context needed

    -- Timestamp (never use updated_at - logs are immutable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);

-- Compound index for entity history queries
CREATE INDEX idx_audit_logs_entity_history
    ON audit_logs(organization_id, entity_type, entity_id, created_at DESC);

-- Prevent any modifications to audit logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Audit logs cannot be modified';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit logs cannot be deleted';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_modification
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Partitioning by month (for large-scale deployments)
-- CREATE TABLE audit_logs (
--     ...
-- ) PARTITION BY RANGE (created_at);
--
-- CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 3.3 Authentication Audit Log (Separate Table)

```sql
-- Separate table for auth events (high volume, different retention)
CREATE TABLE auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (nullable for failed logins with unknown org)
    organization_id UUID REFERENCES organizations(id),

    -- User (nullable for failed logins)
    user_id UUID REFERENCES users(id),
    email VARCHAR(255) NOT NULL,       -- Email attempted

    -- Event
    event_type VARCHAR(50) NOT NULL,   -- LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.
    event_description TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,                 -- Parsed device details
    location_info JSONB,               -- GeoIP data if available

    -- Result
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),       -- INVALID_PASSWORD, ACCOUNT_LOCKED, etc.

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_audit_email ON auth_audit_logs(email);
CREATE INDEX idx_auth_audit_ip ON auth_audit_logs(ip_address);
CREATE INDEX idx_auth_audit_created ON auth_audit_logs(created_at DESC);
CREATE INDEX idx_auth_audit_user ON auth_audit_logs(user_id) WHERE user_id IS NOT NULL;
```

---

## 4. Data Flow

### 4.1 Audit Log Recording Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUDIT LOG RECORDING FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

    Business Action                Audit Service                  Database
         │                              │                            │
         │  record({                    │                            │
         │    action: 'UPDATE',         │                            │
         │    entity_type: 'invoices',  │                            │
         │    entity_id: uuid,          │                            │
         │    old_values: {...},        │                            │
         │    new_values: {...}         │                            │
         │  })                          │                            │
         │─────────────────────────────►│                            │
         │                              │                            │
         │                              │  Extract changed fields    │
         │                              │  Compare old vs new        │
         │                              │                            │
         │                              │  Get request context       │
         │                              │  - user_id from JWT        │
         │                              │  - ip_address              │
         │                              │  - user_agent              │
         │                              │  - request_id              │
         │                              │                            │
         │                              │  Insert audit_log          │
         │                              │─────────────────────────►  │
         │                              │                            │
         │  (async - non-blocking)      │                            │
         │◄─────────────────────────────│                            │
         │                              │                            │
```

### 4.2 Audit Log Query Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUDIT LOG QUERY FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

    User (Auditor)                  Server                        Database
         │                            │                              │
         │  GET /audit-logs?          │                              │
         │    entity_type=invoices&   │                              │
         │    entity_id=uuid          │                              │
         │───────────────────────────►│                              │
         │                            │                              │
         │                            │  Verify permission           │
         │                            │  'audit:read'                │
         │                            │                              │
         │                            │  Query audit_logs            │
         │                            │  ORDER BY created_at DESC    │
         │                            │─────────────────────────────►│
         │                            │◄─────────────────────────────│
         │                            │                              │
         │                            │  Format response             │
         │                            │  Include user names          │
         │                            │                              │
         │  [{audit log entries}]     │                              │
         │◄───────────────────────────│                              │
         │                            │                              │
```

---

## 5. API Design

### 5.1 Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/audit-logs` | `audit:read` | List audit logs |
| GET | `/api/v1/audit-logs/{id}` | `audit:read` | Get audit log detail |
| GET | `/api/v1/audit-logs/entity/{type}/{id}` | `audit:read` | Get entity history |
| GET | `/api/v1/audit-logs/user/{user_id}` | `audit:read` | Get user activity |

### 5.2 List Audit Logs

**Endpoint:** `GET /api/v1/audit-logs`
**Permission:** `audit:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `per_page` | integer | Items per page (max 100) |
| `entity_type` | string | Filter by entity type |
| `entity_id` | uuid | Filter by entity ID |
| `user_id` | uuid | Filter by user |
| `action` | string | Filter by action |
| `date_from` | datetime | Filter from date |
| `date_to` | datetime | Filter to date |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "action": "UPDATE",
            "action_description": "Invoice status changed to posted",
            "entity_type": "invoices",
            "entity_id": "uuid",
            "entity_display": "INV-000001",
            "user": {
                "id": "uuid",
                "name": "John Accountant",
                "email": "john@company.com"
            },
            "changed_fields": ["status", "posted_at", "posted_by"],
            "old_values": {
                "status": "draft",
                "posted_at": null,
                "posted_by": null
            },
            "new_values": {
                "status": "posted",
                "posted_at": "2026-01-15T10:30:00Z",
                "posted_by": "uuid"
            },
            "ip_address": "192.168.1.100",
            "created_at": "2026-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 1500,
        "total_pages": 75
    }
}
```

### 5.3 Get Entity History

**Endpoint:** `GET /api/v1/audit-logs/entity/{entity_type}/{entity_id}`
**Permission:** `audit:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "entity_type": "invoices",
        "entity_id": "uuid",
        "entity_display": "INV-000001",
        "history": [
            {
                "id": "uuid",
                "action": "INSERT",
                "action_description": "Invoice created",
                "user": {
                    "name": "Jane Clerk"
                },
                "new_values": {
                    "invoice_number": "INV-000001",
                    "status": "draft",
                    "total_amount": 0
                },
                "created_at": "2026-01-15T09:00:00Z"
            },
            {
                "id": "uuid",
                "action": "UPDATE",
                "action_description": "Invoice lines added",
                "user": {
                    "name": "Jane Clerk"
                },
                "changed_fields": ["subtotal", "tax_total", "total_amount"],
                "old_values": {
                    "subtotal": 0,
                    "total_amount": 0
                },
                "new_values": {
                    "subtotal": 5600.00,
                    "total_amount": 6082.50
                },
                "created_at": "2026-01-15T09:15:00Z"
            },
            {
                "id": "uuid",
                "action": "UPDATE",
                "action_description": "Invoice posted",
                "user": {
                    "name": "John Accountant"
                },
                "changed_fields": ["status", "posted_at"],
                "old_values": {
                    "status": "draft"
                },
                "new_values": {
                    "status": "posted",
                    "posted_at": "2026-01-15T10:30:00Z"
                },
                "created_at": "2026-01-15T10:30:00Z"
            }
        ],
        "total_changes": 3,
        "first_created": "2026-01-15T09:00:00Z",
        "last_modified": "2026-01-15T10:30:00Z"
    }
}
```

### 5.4 Get User Activity

**Endpoint:** `GET /api/v1/audit-logs/user/{user_id}`
**Permission:** `audit:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | datetime | Filter from date |
| `date_to` | datetime | Filter to date |

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "name": "John Accountant",
            "email": "john@company.com"
        },
        "summary": {
            "total_actions": 150,
            "period": {
                "from": "2026-01-01",
                "to": "2026-01-21"
            },
            "by_action": {
                "INSERT": 45,
                "UPDATE": 85,
                "DELETE": 5,
                "LOGIN": 15
            },
            "by_entity_type": {
                "invoices": 75,
                "customers": 30,
                "journal_entries": 45
            }
        },
        "recent_activity": [
            {
                "action": "UPDATE",
                "entity_type": "invoices",
                "entity_display": "INV-000025",
                "action_description": "Invoice posted",
                "created_at": "2026-01-21T14:30:00Z"
            }
        ]
    }
}
```

---

## 6. Business Logic

### 6.1 Record Audit Log

```pseudocode
FUNCTION record_audit_log(
    organization_id: UUID,
    user_id: UUID,
    action: String,
    entity_type: String,
    entity_id: UUID,
    old_values: Object?,
    new_values: Object?,
    context: RequestContext
) -> AuditLog

    // Calculate changed fields
    changed_fields = []
    IF old_values IS NOT NULL AND new_values IS NOT NULL THEN
        all_keys = UNION(KEYS(old_values), KEYS(new_values))
        FOR EACH key IN all_keys
            IF old_values[key] != new_values[key] THEN
                changed_fields.append(key)
            END IF
        END FOR
    END IF

    // Get user email for denormalization
    user_email = null
    IF user_id IS NOT NULL THEN
        user = UserRepository.find(user_id)
        user_email = user?.email
    END IF

    // Generate action description
    action_description = generate_action_description(
        action, entity_type, old_values, new_values
    )

    // Create audit log (async for performance)
    ASYNC {
        AuditLog.create({
            organization_id: organization_id,
            user_id: user_id,
            user_email: user_email,
            action: action,
            action_description: action_description,
            entity_type: entity_type,
            entity_id: entity_id,
            old_values: old_values,
            new_values: new_values,
            changed_fields: changed_fields,
            ip_address: context.ip_address,
            user_agent: context.user_agent,
            session_id: context.session_id,
            request_id: context.request_id
        })
    }

END FUNCTION
```

### 6.2 Generate Action Description

```pseudocode
FUNCTION generate_action_description(
    action: String,
    entity_type: String,
    old_values: Object?,
    new_values: Object?
) -> String

    entity_name = humanize(entity_type)  // 'invoices' → 'Invoice'

    SWITCH action
        CASE 'INSERT':
            RETURN entity_name + " created"

        CASE 'UPDATE':
            // Check for specific status changes
            IF 'status' IN changed_fields THEN
                old_status = old_values?.status
                new_status = new_values?.status
                RETURN entity_name + " status changed from " + old_status + " to " + new_status
            END IF
            RETURN entity_name + " updated"

        CASE 'DELETE':
            RETURN entity_name + " deleted"

        CASE 'LOGIN':
            RETURN "User logged in"

        CASE 'LOGOUT':
            RETURN "User logged out"

        CASE 'PERMISSION_DENIED':
            RETURN "Permission denied: " + new_values?.required_permission

        DEFAULT:
            RETURN action + " on " + entity_name

    END SWITCH

END FUNCTION
```

### 6.3 Audit Log Middleware (Auto-Logging)

```pseudocode
// Middleware that automatically logs entity changes
FUNCTION audit_middleware(entity_type: String) -> Middleware

    RETURN FUNCTION(request, response, next)

        // Store original entity state for updates
        IF request.method == 'PUT' OR request.method == 'PATCH' THEN
            entity_id = request.params.id
            request.audit_old_values = Repository.find(entity_id)
        END IF

        // Capture the response
        original_send = response.send
        response.send = FUNCTION(body)

            // Parse response
            result = JSON.parse(body)

            IF result.success THEN
                action = MAP_METHOD_TO_ACTION(request.method)
                entity_id = result.data?.id OR request.params.id

                record_audit_log(
                    organization_id: request.organization_id,
                    user_id: request.user?.id,
                    action: action,
                    entity_type: entity_type,
                    entity_id: entity_id,
                    old_values: request.audit_old_values,
                    new_values: result.data,
                    context: {
                        ip_address: request.ip,
                        user_agent: request.headers['user-agent'],
                        request_id: request.id
                    }
                )
            END IF

            original_send.call(response, body)
        END FUNCTION

        next()

    END FUNCTION

END FUNCTION
```

---

## 7. Validation Rules

### 7.1 Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `organization_id` | Yes | Must be valid org |
| `action` | Yes | Valid action type |
| `entity_type` | Yes | Table/model name |
| `entity_id` | Yes | Valid UUID |
| `user_id` | No | Null for system actions |
| `created_at` | Auto | System-generated |

### 7.2 Immutability Rules

| Rule | Enforcement |
|------|-------------|
| No UPDATE | Database trigger |
| No DELETE | Database trigger |
| No TRUNCATE | Database permissions |

---

## 8. Edge Cases

### 8.1 High Volume Logging

**Scenario:** System generates many audit logs (bulk import, etc.)
**Solution:** Batch inserts, async processing, partitioning

```pseudocode
// Batch audit logging for bulk operations
FUNCTION record_audit_logs_batch(logs: List<AuditLogDTO>)

    // Insert in batches of 1000
    FOR EACH batch IN chunk(logs, 1000)
        ASYNC {
            AuditLogRepository.insert_many(batch)
        }
    END FOR

END FUNCTION
```

### 8.2 User Deletion

**Scenario:** User is deleted but their audit logs remain
**Solution:** Keep logs, user_email is denormalized for history

### 8.3 Sensitive Data in Logs

**Scenario:** Password change logged
**Solution:** Never log sensitive fields, use field filtering

```pseudocode
SENSITIVE_FIELDS = ['password', 'password_hash', 'token', 'secret']

FUNCTION filter_sensitive_data(data: Object) -> Object
    filtered = {}
    FOR EACH key, value IN data
        IF key IN SENSITIVE_FIELDS THEN
            filtered[key] = '[REDACTED]'
        ELSE
            filtered[key] = value
        END IF
    END FOR
    RETURN filtered
END FUNCTION
```

---

## 9. Related Modules

### 9.1 All Modules Integration

Every module should call the audit service on significant actions:

```typescript
// In invoice service
async postInvoice(invoiceId: string, user: User) {
    const oldInvoice = await this.findById(invoiceId);

    // ... posting logic ...

    const newInvoice = await this.findById(invoiceId);

    // Record audit log
    await AuditService.record({
        organizationId: user.organizationId,
        userId: user.id,
        action: 'UPDATE',
        entityType: 'invoices',
        entityId: invoiceId,
        oldValues: oldInvoice,
        newValues: newInvoice,
        context: this.requestContext
    });
}
```

### 9.2 RBAC Integration

Permission checks that fail are logged:

```pseudocode
// In permission middleware
IF NOT has_permission(user, required_permission) THEN
    AuditService.record({
        action: 'PERMISSION_DENIED',
        entity_type: 'access_control',
        entity_id: user.id,
        new_values: {
            required_permission: required_permission,
            attempted_resource: request.path,
            attempted_method: request.method
        }
    })

    THROW ForbiddenError()
END IF
```

---

## Appendix A: Action Types

| Action | Description | Entity Types |
|--------|-------------|--------------|
| `INSERT` | Record created | All |
| `UPDATE` | Record modified | All |
| `DELETE` | Record deleted | All |
| `LOGIN` | User logged in | users |
| `LOGOUT` | User logged out | users |
| `LOGIN_FAILED` | Failed login attempt | users |
| `PASSWORD_CHANGE` | Password changed | users |
| `PERMISSION_DENIED` | Access denied | access_control |
| `POST` | Document posted | invoices, journals |
| `VOID` | Document voided | invoices |
| `CLOSE` | Period closed | fiscal_periods |
| `REOPEN` | Period reopened | fiscal_periods |

---

**Document End**
