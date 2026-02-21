# RBAC Module (Role-Based Access Control)

**Module:** RBAC (Users, Roles, Permissions, Module Licensing)
**Version:** 2.0.0
**Last Updated:** 2026-01-22
**Status:** Phase 1 - Core Implementation with 3-Tier Hierarchy

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [Database Schema](#3-database-schema)
4. [Permission System Design](#4-permission-system-design)
5. [Data Flow](#5-data-flow)
6. [API Design](#6-api-design)
7. [Business Logic](#7-business-logic)
8. [Validation Rules](#8-validation-rules)
9. [Edge Cases](#9-edge-cases)
10. [Related Modules](#10-related-modules)

---

## 1. Overview

### 1.1 Purpose

The RBAC module provides **3-tier hierarchical access control** across the entire ERP system with **module licensing** capabilities. It manages the ERP platform, client organizations, their users, roles, and permissions, enabling multi-level administrators to control exactly what each organization and user can access.

### 1.2 Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Platform Management** | ERP owner manages client organizations and their module access |
| **Module Licensing** | Grant/revoke module access at organization level |
| **User Management** | Create, update, deactivate users at org level |
| **Role Management** | Define roles with specific permissions within licensed modules |
| **Permission Enforcement** | Two-layer validation: org license + user permission |
| **Session Management** | JWT-based authentication |
| **Access Requests** | Users can request locked module/feature access |
| **Audit Trail** | Track who did what at all levels |

### 1.3 3-Tier Access Control Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  3-TIER RBAC HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

Level 1: ERP Owner (Platform Admin)
    │ Example: Swiftnine
    │ - Manages all client organizations
    │ - Grants/revokes module licenses
    │ - Has is_platform_admin = true
    │
    │ grants module access to
    ▼
Level 2: Organization Owner (Tenant Admin)
    │ Example: MuteTaxes
    │ - Has specific modules licensed
    │ - Can only use licensed modules
    │ - Manages employees within licensed scope
    │ - Can request additional module access
    │
    │ grants permissions to
    ▼
Level 3: Organization Employees (End Users)
    │ Example: Manager, Accountant, Junior Accountant
    │ - Can only access what org has licensed
    │ - Subject to role-based permissions
    │ - Can request access to locked features
    │

Authorization Flow:
┌──────────────────────┐       ┌──────────────────────┐
│  Organization has    │  AND  │  User has role with  │
│  module licensed?    │───────│  required permission │
└──────────────────────┘       └──────────────────────┘
           │                              │
           └──────────┬───────────────────┘
                      ▼
              ✅ Access Granted
              ❌ Show lock icon + request access
```

### 1.4 Two-Layer Permission System

```
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 1: Organization Module Licensing              │
└─────────────────────────────────────────────────────────────────┘

    ERP Owner (Swiftnine)
         │
         │ grants module licenses
         ▼
    Organization (MuteTaxes)
         │
         ├─ Invoice Module: ✅ read ✅ write ❌ delete
         ├─ Inventory Module: ✅ read ❌ write ❌ delete
         └─ Payroll Module: 🔒 LOCKED (not licensed)

┌─────────────────────────────────────────────────────────────────┐
│              LAYER 2: User Role Permissions                      │
└─────────────────────────────────────────────────────────────────┘

    Organization Users
         │
         │ assigned to roles (within licensed modules only)
         ▼
    ┌─────────────────┐
    │  Manager        │ → invoice:*, inventory:read
    │  Accountant     │ → invoice:create, invoice:read
    │  Junior         │ → invoice:read
    └─────────────────┘

Authorization Check = Layer 1 (Org License) ✓ AND Layer 2 (User Permission) ✓
```

### 1.5 Key Concepts

| Concept | Definition |
|---------|------------|
| **ERP Owner** | Platform administrator who owns the ERP system (e.g., Swiftnine) |
| **Platform Admin** | User with `is_platform_admin = true`, can manage all organizations |
| **Organization** | Client company using the ERP (e.g., MuteTaxes) - also called Tenant |
| **Module License** | Permission granted to an organization to use a specific module |
| **Organization Owner** | Admin user who manages their organization and employees |
| **User** | Individual who accesses the system within an organization |
| **Role** | Named collection of permissions (e.g., "Invoice Manager") |
| **Permission** | Specific action on a resource (e.g., "invoice:post") |
| **Module** | Grouping of related permissions (e.g., "Invoice Module") |
| **Access Request** | Request from user/org to unlock a module or feature |

### 1.6 Access Control Scenarios

| User Level | Can Do | Cannot Do |
|------------|--------|-----------|
| **ERP Owner** | - Create organizations<br>- Grant/revoke module licenses<br>- View all orgs<br>- Approve access requests | - Cannot access org data directly<br>- Only manages platform level |
| **Org Owner** | - Manage employees<br>- Assign roles within licensed modules<br>- Use licensed features<br>- Request new module access | - Cannot use unlicensed modules<br>- Cannot exceed license limits<br>- Cannot grant beyond their license |
| **Employee** | - Use features per role<br>- Request locked feature access | - Cannot use org-unlicensed modules<br>- Cannot exceed role permissions |

---

## 2. Dependencies

### 2.1 This Module Depends On

| Module | Relationship | Link |
|--------|--------------|------|
| Organization | Users belong to organizations | [ORGANIZATION_MODULE.md](../organization/ORGANIZATION_MODULE.md) |

### 2.2 Modules That Depend On This

| Module | Relationship |
|--------|--------------|
| All modules | Permission checks on all APIs |
| [Audit Log](../audit-log/AUDIT_LOG_MODULE.md) | User tracking |
| [Invoice](../invoice/INVOICE_MODULE.md) | `created_by`, `posted_by` |

### 2.3 Dependency Diagram

```
┌──────────────────┐
│   Organization   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│      Users       │────────►│     Modules      │
└────────┬─────────┘         │   (System-wide)  │
         │                   └────────┬─────────┘
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│      Roles       │────────►│   Permissions    │
│  (Per-Org)       │         │  (System-wide)   │
└──────────────────┘         └──────────────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      RBAC SCHEMA (3-Tier Hierarchy)                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │     modules      │
                              │──────────────────│
                              │ id (PK)          │
                              │ code             │
                              │ name             │
                              │ is_active        │
                              └────┬────────┬────┘
                                   │        │
                      ┌────────────┘        └──────────┐
                      │ 1:N                        1:N │
                      ▼                                ▼
┌──────────────────┐  │                    ┌──────────────────────┐
│  organizations   │  │                    │    permissions       │
│──────────────────│  │                    │──────────────────────│
│ id (PK)          │  │                    │ id (PK)              │
│ name             │  │                    │ module_id (FK)       │
│ is_active        │  │                    │ code (invoice:create)│
└────┬─────────┬───┘  │                    └─────────┬────────────┘
     │         │      │                              │
     │         │      │                              │ N:M
     │         │      ▼                              ▼
     │         │  ┌───────────────────────┐  ┌──────────────────┐
     │         │  │ organization_modules  │  │ role_permissions │
     │         │  │───────────────────────│  │──────────────────│
     │         │  │ organization_id (FK)  │  │ role_id (FK)     │
     │         │  │ module_id (FK)        │  │ permission_id    │
     │         │  │ can_read    ✅❌      │  └────────┬─────────┘
     │         │  │ can_write   ✅❌      │           │
     │         │  │ can_delete  ✅❌      │           │
     │         │  │ is_active            │           │
     │         │  │ granted_by (FK)      │           │
     │         │  └───────────────────────┘           │
     │         │  LAYER 1: Org Licensing              │
     │         │                                      │
     │ 1:N     │ 1:N                                  │
     ▼         ▼                                      │
┌──────────────────┐                                 │
│      users       │                                 │
│──────────────────│                                 │
│ id (PK)          │                                 │
│ organization_id  │                                 │
│ email            │                                 │
│ is_platform_admin│ ← Level 1: ERP Owner           │
│ is_active        │                                 │
└────────┬─────────┘                                 │
         │                                           │
         │ N:M                                       │
         ▼                                           │
┌──────────────────┐          1:N                   │
│   user_roles     │──────────────────┐             │
│──────────────────│                  │             │
│ user_id (FK)     │                  │             │
│ role_id (FK)     │                  ▼             │
└──────────────────┘          ┌──────────────────┐  │
                              │      roles       │  │
                              │──────────────────│  │
                              │ id (PK)          │  │
                              │ organization_id  │──┘
                              │ name             │
                              │ is_system_role   │
                              └──────────────────┘
                              LAYER 2: User Permissions

┌──────────────────────┐
│  access_requests     │  ← Request locked modules/features
│──────────────────────│
│ requester_id (FK)    │
│ organization_id (FK) │
│ request_type         │
│ module_id (FK)       │
│ status               │
└──────────────────────┘
```

### 3.2 Modules Table (System-Wide)

```sql
-- Modules define the major functional areas
-- These are system-defined and shared across all organizations
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    code VARCHAR(50) UNIQUE NOT NULL,    -- e.g., 'invoice', 'payment', 'customer'
    name VARCHAR(100) NOT NULL,          -- e.g., 'Invoice Management'
    description TEXT,
    icon VARCHAR(50),                    -- Icon name for UI

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Display
    display_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for modules
INSERT INTO modules (code, name, description, display_order) VALUES
('organization', 'Organization', 'Organization settings and configuration', 1),
('user', 'User Management', 'User and role management', 2),
('customer', 'Customer', 'Customer management', 3),
('chart_of_accounts', 'Chart of Accounts', 'Account management', 4),
('tax_code', 'Tax Codes', 'Tax code management', 5),
('fiscal_period', 'Fiscal Periods', 'Fiscal period management', 6),
('invoice', 'Invoice', 'Invoice management (Accounts Receivable)', 7),
('journal_entry', 'Journal Entry', 'Manual journal entries', 8),
('report', 'Reports', 'Financial reporting', 9);

CREATE INDEX idx_modules_code ON modules(code);
CREATE INDEX idx_modules_active ON modules(is_active) WHERE is_active = true;
```

### 3.3 Permissions Table (System-Wide)

```sql
-- Permissions define specific actions within modules
-- These are system-defined and shared across all organizations
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Module relationship
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Identity
    code VARCHAR(100) UNIQUE NOT NULL,   -- e.g., 'invoice:create', 'invoice:post'
    name VARCHAR(100) NOT NULL,          -- e.g., 'Create Invoice'
    description TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for permissions
-- Organization permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'organization'), 'organization:read', 'View Organization', 'View organization details'),
((SELECT id FROM modules WHERE code = 'organization'), 'organization:update', 'Update Organization', 'Modify organization settings');

-- User permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'user'), 'user:create', 'Create User', 'Create new users'),
((SELECT id FROM modules WHERE code = 'user'), 'user:read', 'View Users', 'View user list and details'),
((SELECT id FROM modules WHERE code = 'user'), 'user:update', 'Update User', 'Modify user information'),
((SELECT id FROM modules WHERE code = 'user'), 'user:delete', 'Deactivate User', 'Deactivate users'),
((SELECT id FROM modules WHERE code = 'user'), 'role:create', 'Create Role', 'Create new roles'),
((SELECT id FROM modules WHERE code = 'user'), 'role:read', 'View Roles', 'View role list and permissions'),
((SELECT id FROM modules WHERE code = 'user'), 'role:update', 'Update Role', 'Modify role permissions'),
((SELECT id FROM modules WHERE code = 'user'), 'role:delete', 'Delete Role', 'Delete roles');

-- Customer permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'customer'), 'customer:create', 'Create Customer', 'Create new customers'),
((SELECT id FROM modules WHERE code = 'customer'), 'customer:read', 'View Customers', 'View customer list and details'),
((SELECT id FROM modules WHERE code = 'customer'), 'customer:update', 'Update Customer', 'Modify customer information'),
((SELECT id FROM modules WHERE code = 'customer'), 'customer:delete', 'Delete Customer', 'Delete/deactivate customers');

-- Invoice permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:create', 'Create Invoice', 'Create draft invoices'),
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:read', 'View Invoices', 'View invoice list and details'),
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:update', 'Update Invoice', 'Modify draft invoices'),
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:delete', 'Delete Invoice', 'Delete draft invoices'),
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:post', 'Post Invoice', 'Post invoices (create accounting entries)'),
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:void', 'Void Invoice', 'Void posted invoices'),
((SELECT id FROM modules WHERE code = 'invoice'), 'invoice:export', 'Export Invoices', 'Export invoice data');

-- Journal Entry permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'journal_entry'), 'journal:create', 'Create Journal Entry', 'Create manual journal entries'),
((SELECT id FROM modules WHERE code = 'journal_entry'), 'journal:read', 'View Journal Entries', 'View journal entry list and details'),
((SELECT id FROM modules WHERE code = 'journal_entry'), 'journal:post', 'Post Journal Entry', 'Post journal entries'),
((SELECT id FROM modules WHERE code = 'journal_entry'), 'journal:reverse', 'Reverse Journal Entry', 'Reverse posted entries');

-- Chart of Accounts permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'chart_of_accounts'), 'account:create', 'Create Account', 'Create new accounts'),
((SELECT id FROM modules WHERE code = 'chart_of_accounts'), 'account:read', 'View Accounts', 'View chart of accounts'),
((SELECT id FROM modules WHERE code = 'chart_of_accounts'), 'account:update', 'Update Account', 'Modify account details'),
((SELECT id FROM modules WHERE code = 'chart_of_accounts'), 'account:delete', 'Delete Account', 'Delete/deactivate accounts');

-- Report permissions
INSERT INTO permissions (module_id, code, name, description) VALUES
((SELECT id FROM modules WHERE code = 'report'), 'report:balance_sheet', 'Balance Sheet', 'View balance sheet report'),
((SELECT id FROM modules WHERE code = 'report'), 'report:income_statement', 'Income Statement', 'View income statement'),
((SELECT id FROM modules WHERE code = 'report'), 'report:trial_balance', 'Trial Balance', 'View trial balance'),
((SELECT id FROM modules WHERE code = 'report'), 'report:ar_aging', 'AR Aging', 'View accounts receivable aging');

CREATE INDEX idx_permissions_module ON permissions(module_id);
CREATE INDEX idx_permissions_code ON permissions(code);
```

### 3.4 Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',

    -- Platform Admin Flag (Level 1: ERP Owner)
    is_platform_admin BOOLEAN DEFAULT false,  -- Can manage all organizations

    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMP WITH TIME ZONE,

    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    must_change_password BOOLEAN DEFAULT false,

    -- Tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(organization_id, email)
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_users_platform_admin ON users(is_platform_admin) WHERE is_platform_admin = true;

-- Trigger for updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.5 Roles Table (Per-Organization)

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization (tenant)
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Identity
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Type
    is_system_role BOOLEAN DEFAULT false,  -- System roles cannot be deleted/modified

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(organization_id, name)
);

-- Indexes
CREATE INDEX idx_roles_organization ON roles(organization_id);

-- Trigger for updated_at
CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent deletion of system roles
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system_role THEN
        RAISE EXCEPTION 'System roles cannot be deleted';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_system_role_deletion
    BEFORE DELETE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_system_role_deletion();
```

### 3.6 Role Permissions (Many-to-Many)

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(role_id, permission_id)
);

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
```

### 3.7 User Roles (Many-to-Many)

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    -- Audit
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(user_id, role_id)
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### 3.8 Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,

    -- Device info
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,

    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(token_hash)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

### 3.9 Organization Modules Table (Module Licensing)

```sql
-- Organization module licenses define what modules each organization can access
-- This is the LAYER 1 of the two-layer permission system
CREATE TABLE organization_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Module
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Access Levels (granular control within module)
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,    -- Includes create and update
    can_delete BOOLEAN DEFAULT false,

    -- Licensing Info
    granted_by UUID REFERENCES users(id),  -- Platform admin who granted access
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,   -- NULL = no expiration

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(organization_id, module_id)
);

-- Indexes
CREATE INDEX idx_org_modules_org ON organization_modules(organization_id);
CREATE INDEX idx_org_modules_module ON organization_modules(module_id);
CREATE INDEX idx_org_modules_active ON organization_modules(organization_id, is_active)
    WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER trg_organization_modules_updated_at
    BEFORE UPDATE ON organization_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Example: Grant invoice module to MuteTaxes with read and write access
-- INSERT INTO organization_modules (organization_id, module_id, can_read, can_write, can_delete, granted_by)
-- VALUES (
--     (SELECT id FROM organizations WHERE name = 'MuteTaxes'),
--     (SELECT id FROM modules WHERE code = 'invoice'),
--     true,  -- can read
--     true,  -- can write
--     false, -- cannot delete
--     (SELECT id FROM users WHERE is_platform_admin = true LIMIT 1)
-- );
```

### 3.10 Access Requests Table

```sql
-- Tracks requests for access to locked modules or features
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Requester
    requester_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Request Type
    request_type VARCHAR(20) NOT NULL,  -- 'MODULE_LICENSE' or 'USER_PERMISSION'

    -- What is being requested
    module_id UUID REFERENCES modules(id),              -- For MODULE_LICENSE requests
    permission_id UUID REFERENCES permissions(id),       -- For USER_PERMISSION requests

    -- Request Details
    reason TEXT,
    business_justification TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, cancelled

    -- Resolution
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CHECK (request_type IN ('MODULE_LICENSE', 'USER_PERMISSION')),
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    CHECK (
        (request_type = 'MODULE_LICENSE' AND module_id IS NOT NULL) OR
        (request_type = 'USER_PERMISSION' AND permission_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_access_requests_requester ON access_requests(requester_id);
CREATE INDEX idx_access_requests_org ON access_requests(organization_id);
CREATE INDEX idx_access_requests_status ON access_requests(status) WHERE status = 'pending';
CREATE INDEX idx_access_requests_type ON access_requests(request_type);

-- Trigger for updated_at
CREATE TRIGGER trg_access_requests_updated_at
    BEFORE UPDATE ON access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. Permission System Design

### 4.1 Permission Code Format

```
Format: {module}:{action}

Examples:
- invoice:create    - Create draft invoices
- invoice:read      - View invoices
- invoice:update    - Edit draft invoices
- invoice:delete    - Delete draft invoices
- invoice:post      - Post invoices (accounting impact)
- invoice:void      - Void posted invoices

Special Permissions:
- *:*               - Super admin (all permissions)
- invoice:*         - All invoice permissions
```

### 4.2 Predefined Role Templates

| Role Name | Description | Permissions |
|-----------|-------------|-------------|
| **Admin** | Full access | `*:*` |
| **Accountant** | Full accounting access | All accounting + reports |
| **Invoice Manager** | Invoice workflow | `invoice:*` except void |
| **Invoice Clerk** | Basic invoice entry | `invoice:create,read,update`, `customer:read` |
| **Auditor** | Read-only access | `*:read`, `report:*` |
| **Viewer** | View only | Specific `read` permissions |

### 4.3 Two-Layer Authorization Check Algorithm

```pseudocode
FUNCTION check_access(user_id: UUID, required_permission: String) -> AccessResult

    // Parse permission (e.g., "invoice:create" → module: "invoice", action: "create")
    [module_code, action] = required_permission.split(':')

    // Get user info
    user = UserRepository.find(user_id)

    // Platform admins bypass all checks
    IF user.is_platform_admin THEN
        RETURN {allowed: true, reason: 'PLATFORM_ADMIN'}
    END IF

    // ═══════════════════════════════════════════════════════════
    // LAYER 1: Check Organization Module License
    // ═══════════════════════════════════════════════════════════

    org_module = OrganizationModuleRepository.find({
        organization_id: user.organization_id,
        module_code: module_code,
        is_active: true
    })

    // Check if organization has this module licensed
    IF org_module IS NULL THEN
        RETURN {
            allowed: false,
            reason: 'MODULE_NOT_LICENSED',
            message: '🔒 Your organization does not have access to this module.',
            canRequestAccess: true,
            requestType: 'MODULE_LICENSE'
        }
    END IF

    // Check if license has expired
    IF org_module.expires_at IS NOT NULL AND org_module.expires_at < NOW() THEN
        RETURN {
            allowed: false,
            reason: 'LICENSE_EXPIRED',
            message: '🔒 Your module license has expired. Contact your administrator.'
        }
    END IF

    // Check action-level license restrictions
    IF action == 'read' OR action == 'list' THEN
        IF NOT org_module.can_read THEN
            RETURN {
                allowed: false,
                reason: 'LICENSE_LIMIT_READ',
                message: '🔒 Your license does not include read access to this module.'
            }
        END IF
    ELSE IF action IN ['create', 'update', 'edit'] THEN
        IF NOT org_module.can_write THEN
            RETURN {
                allowed: false,
                reason: 'LICENSE_LIMIT_WRITE',
                message: '🔒 Your license does not include write access to this module.'
            }
        END IF
    ELSE IF action == 'delete' THEN
        IF NOT org_module.can_delete THEN
            RETURN {
                allowed: false,
                reason: 'LICENSE_LIMIT_DELETE',
                message: '🔒 Your license does not include delete access to this module.'
            }
        END IF
    END IF

    // ═══════════════════════════════════════════════════════════
    // LAYER 2: Check User Role Permission
    // ═══════════════════════════════════════════════════════════

    user_permissions = get_user_permissions(user_id)

    // Check for exact match
    IF user_permissions.contains(required_permission) THEN
        RETURN {allowed: true}
    END IF

    // Check for super admin permission
    IF user_permissions.contains('*:*') THEN
        RETURN {allowed: true}
    END IF

    // Check for module wildcard (e.g., 'invoice:*' grants 'invoice:create')
    IF user_permissions.contains(module_code + ':*') THEN
        RETURN {allowed: true}
    END IF

    // User doesn't have permission
    RETURN {
        allowed: false,
        reason: 'NO_USER_PERMISSION',
        message: '🔒 You do not have permission to perform this action.',
        canRequestAccess: true,
        requestType: 'USER_PERMISSION'
    }

END FUNCTION
```

### 4.4 Permission Check Shorthand

For simpler inline checks:

```pseudocode
FUNCTION has_permission(user_id: UUID, permission: String) -> Boolean
    result = check_access(user_id, permission)
    RETURN result.allowed
END FUNCTION
```

### 4.5 Permission Aggregation

```pseudocode
FUNCTION get_user_permissions(user_id: UUID) -> Set<String>

    // Check cache first
    cached = PermissionCache.get(user_id)
    IF cached IS NOT NULL THEN
        RETURN cached
    END IF

    // Query database
    permissions = SQL """
        SELECT DISTINCT p.code
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = $1
    """

    // Cache for 5 minutes
    PermissionCache.set(user_id, permissions, TTL: 300)

    RETURN permissions

END FUNCTION
```

---

## 5. Data Flow

### 5.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    Client                        Server                        Database
       │                            │                              │
       │  POST /auth/login          │                              │
       │  {email, password}         │                              │
       │───────────────────────────►│                              │
       │                            │  Find user by email          │
       │                            │─────────────────────────────►│
       │                            │◄─────────────────────────────│
       │                            │                              │
       │                            │  Verify password             │
       │                            │  (bcrypt compare)            │
       │                            │                              │
       │                            │  Check account status        │
       │                            │  - is_active?                │
       │                            │  - locked?                   │
       │                            │  - org active?               │
       │                            │                              │
       │                            │  Generate tokens             │
       │                            │  - Access (JWT, 15min)       │
       │                            │  - Refresh (UUID, 7days)     │
       │                            │                              │
       │                            │  Store refresh token         │
       │                            │─────────────────────────────►│
       │                            │                              │
       │  {access_token,            │                              │
       │   refresh_token,           │                              │
       │   user, permissions}       │                              │
       │◄───────────────────────────│                              │
       │                            │                              │
```

### 5.2 Two-Layer Authorization Flow (Every Request)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   TWO-LAYER AUTHORIZATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

    Request with Bearer Token (e.g., POST /api/v1/invoices)
              │
              ▼
    ┌─────────────────┐
    │ Extract JWT     │
    │ from header     │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Verify JWT      │───────► 401 Unauthorized (invalid/expired)
    │ signature       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Extract claims: │
    │ - user_id       │
    │ - org_id        │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Check user      │───────► 403 Forbidden (user inactive)
    │ is_active       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Is platform     │───YES──► ✅ PROCEED (bypass all checks)
    │ admin?          │
    └────────┬────────┘
             │ NO
             ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              LAYER 1: Organization License Check             │
    └─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Parse permission│  required: "invoice:create"
    │ invoice:create  │  → module: "invoice", action: "create"
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Check org has   │───NO───► 403 🔒 MODULE_NOT_LICENSED
    │ invoice module? │          "Request access from ERP admin"
    └────────┬────────┘
             │ YES
             ▼
    ┌─────────────────┐
    │ Check license   │───EXPIRED─► 403 🔒 LICENSE_EXPIRED
    │ expiration      │             "Contact administrator"
    └────────┬────────┘
             │ ACTIVE
             ▼
    ┌─────────────────┐
    │ Check action    │  action = "create" → needs can_write
    │ permission:     │───NO───► 403 🔒 LICENSE_LIMIT_WRITE
    │ can_write=true? │          "Upgrade your license"
    └────────┬────────┘
             │ YES
             ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              LAYER 2: User Role Permission Check             │
    └─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Get user's      │
    │ permissions     │
    │ (from cache)    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Has exact match │───YES──► ✅ PROCEED
    │ invoice:create? │
    └────────┬────────┘
             │ NO
             ▼
    ┌─────────────────┐
    │ Has wildcard    │───YES──► ✅ PROCEED
    │ invoice:* or    │
    │ *:* ?           │
    └────────┬────────┘
             │ NO
             ▼
         403 🔒 NO_USER_PERMISSION
         "Request access from org admin"
```

### 5.3 Role Assignment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ROLE ASSIGNMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

    Admin                         Server                        Cache
      │                             │                             │
      │  POST /users/{id}/roles     │                             │
      │  {role_id}                  │                             │
      │────────────────────────────►│                             │
      │                             │                             │
      │                             │  Validate admin has         │
      │                             │  'role:update' permission   │
      │                             │                             │
      │                             │  Validate target user       │
      │                             │  in same organization       │
      │                             │                             │
      │                             │  Validate role exists       │
      │                             │  in same organization       │
      │                             │                             │
      │                             │  Insert user_role           │
      │                             │                             │
      │                             │  Invalidate permission      │
      │                             │  cache for user             │
      │                             │─────────────────────────────►│
      │                             │                             │
      │  {success: true}            │                             │
      │◄────────────────────────────│                             │
      │                             │                             │
```

---

## 6. API Design

### 6.1 Platform Admin Endpoints (Level 1: ERP Owner)

These endpoints are only accessible to users with `is_platform_admin = true`.

#### 6.1.1 List Organizations with Module Access

**Endpoint:** `GET /api/v1/admin/organizations`
**Permission:** Platform Admin Only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `per_page` | integer | Items per page |
| `search` | string | Search by name |
| `has_module` | string | Filter by module code |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "MuteTaxes",
            "is_active": true,
            "licensed_modules": [
                {
                    "module_id": "uuid",
                    "module_code": "invoice",
                    "module_name": "Invoice Management",
                    "can_read": true,
                    "can_write": true,
                    "can_delete": false,
                    "granted_at": "2026-01-15T10:00:00Z",
                    "expires_at": null
                }
            ],
            "user_count": 15,
            "created_at": "2026-01-01T10:00:00Z"
        }
    ]
}
```

#### 6.1.2 Grant Module License to Organization

**Endpoint:** `POST /api/v1/admin/organizations/{org_id}/modules`
**Permission:** Platform Admin Only

**Request Body:**
```json
{
    "module_id": "uuid",
    "can_read": true,
    "can_write": true,
    "can_delete": false,
    "expires_at": "2027-01-01T00:00:00Z"  // Optional, null = no expiration
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "organization_id": "uuid",
        "module": {
            "id": "uuid",
            "code": "invoice",
            "name": "Invoice Management"
        },
        "can_read": true,
        "can_write": true,
        "can_delete": false,
        "expires_at": "2027-01-01T00:00:00Z",
        "granted_at": "2026-01-22T10:00:00Z"
    },
    "message": "Module license granted successfully"
}
```

#### 6.1.3 Update Module License

**Endpoint:** `PUT /api/v1/admin/organizations/{org_id}/modules/{module_id}`
**Permission:** Platform Admin Only

**Request Body:**
```json
{
    "can_read": true,
    "can_write": false,
    "can_delete": false,
    "expires_at": null
}
```

#### 6.1.4 Revoke Module License

**Endpoint:** `DELETE /api/v1/admin/organizations/{org_id}/modules/{module_id}`
**Permission:** Platform Admin Only

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "revoked_at": "2026-01-22T10:00:00Z",
        "affected_users": 12
    },
    "message": "Module license revoked. 12 users lost access."
}
```

#### 6.1.5 View Access Requests

**Endpoint:** `GET /api/v1/admin/access-requests`
**Permission:** Platform Admin Only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | pending, approved, rejected |
| `request_type` | string | MODULE_LICENSE, USER_PERMISSION |
| `organization_id` | uuid | Filter by organization |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "requester": {
                "id": "uuid",
                "name": "John Doe",
                "email": "john@mutetaxes.com"
            },
            "organization": {
                "id": "uuid",
                "name": "MuteTaxes"
            },
            "request_type": "MODULE_LICENSE",
            "module": {
                "code": "payroll",
                "name": "Payroll Management"
            },
            "reason": "Need payroll module for Q1 processing",
            "status": "pending",
            "created_at": "2026-01-20T10:00:00Z"
        }
    ]
}
```

#### 6.1.6 Approve/Reject Access Request

**Endpoint:** `POST /api/v1/admin/access-requests/{request_id}/resolve`
**Permission:** Platform Admin Only

**Request Body:**
```json
{
    "action": "approve",  // or "reject"
    "rejection_reason": "Budget constraints",  // Required if rejecting
    "license_config": {  // Required if approving MODULE_LICENSE request
        "can_read": true,
        "can_write": true,
        "can_delete": false,
        "expires_at": null
    }
}
```

### 6.2 Authentication Endpoints

#### 6.2.1 Login

**Endpoint:** `POST /api/v1/auth/login`
**Permission:** Public

**Request Body:**
```json
{
    "email": "user@company.com",
    "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
        "token_type": "Bearer",
        "expires_in": 900,
        "user": {
            "id": "uuid",
            "email": "user@company.com",
            "first_name": "John",
            "last_name": "Doe",
            "organization": {
                "id": "uuid",
                "name": "Acme Corporation",
                "code": "acme"
            }
        },
        "permissions": [
            "invoice:create",
            "invoice:read",
            "invoice:update",
            "customer:read"
        ]
    }
}
```

**Error Responses:**

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_LOCKED` | 403 | Too many failed attempts |
| `ACCOUNT_INACTIVE` | 403 | User is deactivated |
| `ORG_INACTIVE` | 403 | Organization is deactivated |

#### 6.2.2 Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`
**Permission:** Public (valid refresh token required)

**Request Body:**
```json
{
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 900
    }
}
```

#### 6.2.3 Logout

**Endpoint:** `POST /api/v1/auth/logout`
**Permission:** Authenticated

**Request Body:**
```json
{
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "message": "Logged out successfully"
    }
}
```

#### 6.2.4 Change Password

**Endpoint:** `POST /api/v1/auth/change-password`
**Permission:** Authenticated

**Request Body:**
```json
{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456!",
    "confirm_password": "NewPassword456!"
}
```

### 6.3 Organization Module Endpoints (Level 2: Org Owner/Admins)

These endpoints allow organization administrators to view their licensed modules and request access.

#### 6.3.1 Get Organization's Available Modules

**Endpoint:** `GET /api/v1/org/modules`
**Permission:** Authenticated

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "licensed": [
            {
                "module": {
                    "id": "uuid",
                    "code": "invoice",
                    "name": "Invoice Management",
                    "description": "Manage sales invoices and accounts receivable",
                    "icon": "invoice-icon"
                },
                "access": {
                    "can_read": true,
                    "can_write": true,
                    "can_delete": false
                },
                "status": "active",
                "expires_at": null,
                "granted_at": "2026-01-15T10:00:00Z"
            }
        ],
        "locked": [
            {
                "module": {
                    "id": "uuid",
                    "code": "payroll",
                    "name": "Payroll Management",
                    "description": "Employee payroll and compensation",
                    "icon": "payroll-icon"
                },
                "can_request": true,
                "has_pending_request": false
            }
        ]
    }
}
```

#### 6.3.2 Request Module Access

**Endpoint:** `POST /api/v1/org/modules/request-access`
**Permission:** `organization:update` or Org Admin

**Request Body:**
```json
{
    "module_id": "uuid",
    "reason": "We need payroll module for Q1 processing",
    "business_justification": "Currently managing 50 employees manually"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "request_id": "uuid",
        "status": "pending",
        "message": "Your request has been sent to the ERP administrator",
        "created_at": "2026-01-22T10:00:00Z"
    }
}
```

#### 6.3.3 View Organization's Access Requests

**Endpoint:** `GET /api/v1/org/access-requests`
**Permission:** `organization:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "request_type": "MODULE_LICENSE",
            "module": {
                "code": "payroll",
                "name": "Payroll Management"
            },
            "status": "pending",
            "reason": "Need for Q1 processing",
            "created_at": "2026-01-20T10:00:00Z"
        }
    ]
}
```

### 6.4 User Management Endpoints

#### 6.4.1 List Users

**Endpoint:** `GET /api/v1/users`
**Permission:** `user:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `per_page` | integer | Items per page |
| `search` | string | Search by name/email |
| `is_active` | boolean | Filter by status |
| `role_id` | uuid | Filter by role |

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "email": "user@company.com",
            "first_name": "John",
            "last_name": "Doe",
            "is_active": true,
            "roles": [
                {
                    "id": "uuid",
                    "name": "Invoice Manager"
                }
            ],
            "last_login_at": "2026-01-20T14:30:00Z",
            "created_at": "2026-01-01T10:00:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total_items": 15,
        "total_pages": 1
    }
}
```

#### 6.4.2 Create User

**Endpoint:** `POST /api/v1/users`
**Permission:** `user:create`

**Request Body:**
```json
{
    "email": "newuser@company.com",
    "password": "TempPassword123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1-555-123-4567",
    "role_ids": ["uuid1", "uuid2"],
    "must_change_password": true
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "email": "newuser@company.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "is_active": true,
        "must_change_password": true,
        "roles": [
            {"id": "uuid1", "name": "Invoice Clerk"}
        ],
        "created_at": "2026-01-21T10:00:00Z"
    }
}
```

#### 6.4.3 Update User

**Endpoint:** `PUT /api/v1/users/{user_id}`
**Permission:** `user:update`

**Request Body:**
```json
{
    "first_name": "Jane",
    "last_name": "Smith-Johnson",
    "phone": "+1-555-987-6543"
}
```

#### 6.4.4 Deactivate User

**Endpoint:** `DELETE /api/v1/users/{user_id}`
**Permission:** `user:delete`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "is_active": false,
        "deactivated_at": "2026-01-21T10:00:00Z"
    }
}
```

### 6.5 Role Management Endpoints

#### 6.5.1 List Roles

**Endpoint:** `GET /api/v1/roles`
**Permission:** `role:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "Invoice Manager",
            "description": "Can create and post invoices",
            "is_system_role": false,
            "user_count": 5,
            "permissions": [
                {
                    "id": "uuid",
                    "code": "invoice:create",
                    "name": "Create Invoice"
                }
            ],
            "created_at": "2026-01-01T10:00:00Z"
        }
    ]
}
```

#### 6.5.2 Create Role

**Endpoint:** `POST /api/v1/roles`
**Permission:** `role:create`

**Request Body:**
```json
{
    "name": "Custom Role",
    "description": "A custom role for specific tasks",
    "permission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### 6.5.3 Update Role Permissions

**Endpoint:** `PUT /api/v1/roles/{role_id}/permissions`
**Permission:** `role:update`

**Request Body:**
```json
{
    "permission_ids": ["uuid1", "uuid2", "uuid3", "uuid4"]
}
```

#### 6.5.4 Assign Role to User

**Endpoint:** `POST /api/v1/users/{user_id}/roles`
**Permission:** `role:update`

**Request Body:**
```json
{
    "role_id": "uuid"
}
```

#### 6.5.5 Remove Role from User

**Endpoint:** `DELETE /api/v1/users/{user_id}/roles/{role_id}`
**Permission:** `role:update`

### 6.6 Permission Endpoints

#### 6.6.1 List All Permissions (Grouped by Module)

**Endpoint:** `GET /api/v1/permissions`
**Permission:** `role:read`

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "module": {
                "id": "uuid",
                "code": "invoice",
                "name": "Invoice Management"
            },
            "permissions": [
                {
                    "id": "uuid",
                    "code": "invoice:create",
                    "name": "Create Invoice",
                    "description": "Create draft invoices"
                },
                {
                    "id": "uuid",
                    "code": "invoice:post",
                    "name": "Post Invoice",
                    "description": "Post invoices (create accounting entries)"
                }
            ]
        }
    ]
}
```

#### 6.6.2 Get Current User's Permissions

**Endpoint:** `GET /api/v1/auth/me/permissions`
**Permission:** Authenticated

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "permissions": [
            "invoice:create",
            "invoice:read",
            "invoice:update",
            "customer:read"
        ],
        "modules": [
            {
                "code": "invoice",
                "name": "Invoice Management",
                "access": "partial"
            },
            {
                "code": "customer",
                "name": "Customer Management",
                "access": "read_only"
            }
        ]
    }
}
```

---

## 7. Business Logic

### 7.1 Login Process

```pseudocode
FUNCTION login(email: String, password: String, device_info: DeviceInfo) -> AuthResult

    // 1. Find user
    user = UserRepository.find_by_email(email)

    IF user IS NULL THEN
        // Don't reveal if email exists
        THROW AuthError("Invalid credentials")
    END IF

    // 2. Check account status
    IF NOT user.is_active THEN
        THROW AuthError("Account is deactivated")
    END IF

    IF user.locked_until IS NOT NULL AND user.locked_until > NOW() THEN
        THROW AuthError("Account is locked. Try again later.")
    END IF

    // 3. Check organization
    organization = OrganizationRepository.find(user.organization_id)
    IF NOT organization.is_active THEN
        THROW AuthError("Organization is deactivated")
    END IF

    // 4. Verify password
    IF NOT bcrypt.compare(password, user.password_hash) THEN
        // Increment failed attempts
        user.failed_login_attempts += 1

        IF user.failed_login_attempts >= 5 THEN
            user.locked_until = NOW() + 30 minutes
        END IF

        UserRepository.update(user)
        THROW AuthError("Invalid credentials")
    END IF

    // 5. Success - reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = NULL
    user.last_login_at = NOW()
    user.last_login_ip = device_info.ip
    UserRepository.update(user)

    // 6. Generate tokens
    access_token = JWT.sign({
        user_id: user.id,
        organization_id: user.organization_id,
        email: user.email
    }, SECRET, {expiresIn: '15m'})

    refresh_token = generate_uuid()
    RefreshTokenRepository.create({
        user_id: user.id,
        token_hash: hash(refresh_token),
        device_name: device_info.device_name,
        ip_address: device_info.ip,
        expires_at: NOW() + 7 days
    })

    // 7. Get permissions
    permissions = get_user_permissions(user.id)

    RETURN {
        access_token: access_token,
        refresh_token: refresh_token,
        user: user,
        permissions: permissions
    }

END FUNCTION
```

### 7.2 Permission Middleware

```pseudocode
FUNCTION require_permission(required: String) -> Middleware

    RETURN FUNCTION(request, response, next)

        // 1. Get user from JWT (set by auth middleware)
        user = request.user
        IF user IS NULL THEN
            RETURN response.status(401).json({error: "UNAUTHORIZED"})
        END IF

        // 2. Get permissions (cached)
        permissions = get_user_permissions(user.id)

        // 3. Check permission
        IF NOT has_permission(permissions, required) THEN
            AuditLog.record({
                user_id: user.id,
                action: "PERMISSION_DENIED",
                resource: request.path,
                required_permission: required
            })

            RETURN response.status(403).json({
                error: "FORBIDDEN",
                message: "Insufficient permissions",
                required: required
            })
        END IF

        next()

    END FUNCTION

END FUNCTION
```

### 7.3 Create Default Roles for Organization

```pseudocode
FUNCTION create_default_roles(organization_id: UUID) -> List<Role>

    roles = []

    // 1. Admin role (all permissions)
    admin = RoleRepository.create({
        organization_id: organization_id,
        name: "Admin",
        description: "Full system access",
        is_system_role: true
    })
    all_permissions = PermissionRepository.find_all()
    FOR EACH perm IN all_permissions
        RolePermissionRepository.create({
            role_id: admin.id,
            permission_id: perm.id
        })
    END FOR
    roles.append(admin)

    // 2. Accountant role
    accountant = RoleRepository.create({
        organization_id: organization_id,
        name: "Accountant",
        description: "Full accounting access",
        is_system_role: true
    })
    accounting_perms = PermissionRepository.find_by_modules([
        'invoice', 'journal_entry', 'chart_of_accounts',
        'customer', 'tax_code', 'fiscal_period', 'report'
    ])
    FOR EACH perm IN accounting_perms
        RolePermissionRepository.create({
            role_id: accountant.id,
            permission_id: perm.id
        })
    END FOR
    roles.append(accountant)

    // 3. Invoice Clerk role
    clerk = RoleRepository.create({
        organization_id: organization_id,
        name: "Invoice Clerk",
        description: "Basic invoice entry",
        is_system_role: true
    })
    clerk_perms = PermissionRepository.find_by_codes([
        'invoice:create', 'invoice:read', 'invoice:update',
        'customer:read', 'account:read', 'tax_code:read'
    ])
    FOR EACH perm IN clerk_perms
        RolePermissionRepository.create({
            role_id: clerk.id,
            permission_id: perm.id
        })
    END FOR
    roles.append(clerk)

    // 4. Viewer role
    viewer = RoleRepository.create({
        organization_id: organization_id,
        name: "Viewer",
        description: "Read-only access",
        is_system_role: true
    })
    read_perms = PermissionRepository.find_by_pattern('%:read')
    FOR EACH perm IN read_perms
        RolePermissionRepository.create({
            role_id: viewer.id,
            permission_id: perm.id
        })
    END FOR
    roles.append(viewer)

    RETURN roles

END FUNCTION
```

---

## 8. Validation Rules

### 8.1 User Validations

| Field | Rules | Error |
|-------|-------|-------|
| `email` | Required, valid format, unique per org | `Invalid email` |
| `password` | Min 8 chars, uppercase, lowercase, number | `Weak password` |
| `first_name` | Max 100 chars | `Too long` |
| `last_name` | Max 100 chars | `Too long` |

### 8.2 Password Policy

```
Minimum requirements:
- At least 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (optional but recommended)

Regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$
```

### 8.3 Role Validations

| Rule | Error |
|------|-------|
| Role name unique per organization | `Role name already exists` |
| Cannot delete system roles | `System roles cannot be deleted` |
| Cannot modify system role permissions | `System role permissions cannot be modified` |

---

## 9. Edge Cases

### 9.1 User Deactivation with Active Sessions

**Scenario:** Admin deactivates a user who is currently logged in
**Behavior:**
- User's refresh tokens are revoked
- Next API call with old access token will fail (check user.is_active)
- Permission cache is invalidated

```pseudocode
FUNCTION deactivate_user(user_id: UUID, admin_user: User)

    user = UserRepository.find(user_id)

    // Cannot deactivate yourself
    IF user_id == admin_user.id THEN
        THROW BusinessError("Cannot deactivate yourself")
    END IF

    // Cannot deactivate the last admin
    IF is_last_admin(user) THEN
        THROW BusinessError("Cannot deactivate the last admin")
    END IF

    BEGIN TRANSACTION
        // Deactivate user
        UserRepository.update(user_id, {is_active: false})

        // Revoke all refresh tokens
        RefreshTokenRepository.revoke_all(user_id)

        // Clear permission cache
        PermissionCache.delete(user_id)
    COMMIT

END FUNCTION
```

### 9.2 Role Deletion with Assigned Users

**Scenario:** Admin tries to delete a role that has users assigned
**Options:**
1. Prevent deletion (current implementation)
2. Remove role from all users, then delete
3. Reassign users to a default role

```pseudocode
FUNCTION delete_role(role_id: UUID)

    role = RoleRepository.find(role_id)

    IF role.is_system_role THEN
        THROW BusinessError("Cannot delete system role")
    END IF

    user_count = UserRoleRepository.count_users(role_id)
    IF user_count > 0 THEN
        THROW BusinessError("Cannot delete role with assigned users. Remove users first.")
    END IF

    RoleRepository.delete(role_id)

END FUNCTION
```

### 9.3 Permission Change Propagation

**Scenario:** Admin modifies a role's permissions
**Behavior:** All users with that role should see updated permissions immediately

```pseudocode
FUNCTION update_role_permissions(role_id: UUID, permission_ids: List<UUID>)

    BEGIN TRANSACTION
        // Remove old permissions
        RolePermissionRepository.delete_by_role(role_id)

        // Add new permissions
        FOR EACH perm_id IN permission_ids
            RolePermissionRepository.create({
                role_id: role_id,
                permission_id: perm_id
            })
        END FOR
    COMMIT

    // Invalidate cache for all users with this role
    user_ids = UserRoleRepository.find_users_by_role(role_id)
    FOR EACH user_id IN user_ids
        PermissionCache.delete(user_id)
    END FOR

END FUNCTION
```

---

## 10. Related Modules

### 10.1 Integration Points

| Module | Integration | Description |
|--------|-------------|-------------|
| [Organization](../organization/ORGANIZATION_MODULE.md) | `organization_id` FK | Users/roles belong to org |
| [Invoice](../invoice/INVOICE_MODULE.md) | `created_by`, `posted_by` | User tracking |
| [Audit Log](../audit-log/AUDIT_LOG_MODULE.md) | `user_id` | Action tracking |
| All modules | Permission middleware | Access control |

### 10.2 JWT Token Structure

```json
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "user_id": "uuid",
        "organization_id": "uuid",
        "email": "user@company.com",
        "iat": 1705833600,
        "exp": 1705834500
    }
}
```

---

## Appendix A: Security Considerations

### A.1 Password Storage
- Use bcrypt with cost factor 12+
- Never store plain text passwords
- Never log passwords

### A.2 Token Security
- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Stored hashed in database
- Rotate refresh tokens on use
- Bind tokens to device/IP (optional)

### A.3 Rate Limiting
- Login: 5 attempts per 15 minutes per IP
- API: 100 requests per minute per user
- Password reset: 3 requests per hour per email

---

**Document End**
