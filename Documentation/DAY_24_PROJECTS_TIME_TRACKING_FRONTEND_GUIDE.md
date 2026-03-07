# Day 24 — Projects & Time Tracking — Frontend Integration Guide

## API Endpoints

All endpoints require `Authorization: Bearer <token>`. Permission required is noted per endpoint.

Base URL: `/api/v1`

---

## Projects API

### 1. GET `/api/v1/projects/statuses` — Status Metadata

**Permission:** `project:view`

**Response:**
```json
{
  "success": true,
  "message": "Project statuses retrieved successfully",
  "data": {
    "ACTIVE": {
      "label": "Active",
      "color": "#10B981",
      "description": "Project is actively being worked on",
      "allowEdit": true,
      "allowDelete": true,
      "allowComplete": true,
      "allowHold": true,
      "allowCancel": true,
      "allowReactivate": false
    },
    "ON_HOLD": {
      "label": "On Hold",
      "color": "#F59E0B",
      "description": "Project is temporarily paused",
      "allowEdit": true,
      "allowDelete": false,
      "allowComplete": true,
      "allowHold": false,
      "allowCancel": true,
      "allowReactivate": true
    },
    "COMPLETED": {
      "label": "Completed",
      "color": "#3B82F6",
      "description": "Project has been completed",
      "allowEdit": false,
      "allowDelete": false,
      "allowComplete": false,
      "allowHold": false,
      "allowCancel": false,
      "allowReactivate": true
    },
    "CANCELLED": {
      "label": "Cancelled",
      "color": "#EF4444",
      "description": "Project has been cancelled",
      "allowEdit": false,
      "allowDelete": false,
      "allowComplete": false,
      "allowHold": false,
      "allowCancel": false,
      "allowReactivate": false
    }
  }
}
```

**Frontend Usage:** Use `allow*` flags to show/hide action buttons per status. Use `color` for status badges.

---

### 2. GET `/api/v1/projects/next-number` — Next Project Number

**Permission:** `project:create`

**Response:**
```json
{
  "success": true,
  "data": { "nextProjectNumber": "PRJ-0001" }
}
```

---

### 3. GET `/api/v1/projects/summary` — Dashboard Summary

**Permission:** `project:view`

**Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": {
      "ACTIVE": 5,
      "ON_HOLD": 2,
      "COMPLETED": 8,
      "CANCELLED": 1
    },
    "totalProjects": 16,
    "totalLoggedHours": 1250.5,
    "totalBilledAmount": 125050
  }
}
```

---

### 4. POST `/api/v1/projects` — Create Project

**Permission:** `project:create`

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "customerId": "uuid (optional)",
  "projectNumber": "PRJ-0001 (optional — auto-generated if omitted)",
  "billingMethod": "TIME_AND_MATERIALS",
  "startDate": "2026-03-01",
  "endDate": "2026-06-30",
  "budgetAmount": 50000,
  "budgetHours": 500,
  "hourlyRate": 100,
  "color": "#3B82F6"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Project name (max 255 chars) |
| `description` | string | No | Free-text description |
| `customerId` | UUID | No | Link to a customer |
| `projectNumber` | string | No | Custom number; auto-generates PRJ-XXXX if omitted |
| `billingMethod` | enum | No | `FIXED_PRICE`, `TIME_AND_MATERIALS` (default), `NON_BILLABLE` |
| `startDate` | date | No | ISO date string |
| `endDate` | date | No | ISO date string |
| `budgetAmount` | number | No | Total monetary budget |
| `budgetHours` | number | No | Total hours budget |
| `hourlyRate` | number | No | Default hourly rate |
| `color` | string | No | Hex color code (e.g. `#3B82F6`) |

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "uuid",
    "projectNumber": "PRJ-0001",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "ACTIVE",
    "billingMethod": "TIME_AND_MATERIALS",
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-06-30T00:00:00.000Z",
    "budgetAmount": 50000,
    "budgetHours": 500,
    "hourlyRate": 100,
    "color": "#3B82F6",
    "customer": null,
    "createdAt": "2026-03-04T10:22:19.058Z",
    "updatedAt": "2026-03-04T10:22:19.058Z"
  }
}
```

---

### 5. GET `/api/v1/projects` — List Projects

**Permission:** `project:view`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |
| `status` | string | — | Filter: `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| `customerId` | UUID | — | Filter by customer |
| `billingMethod` | string | — | Filter: `FIXED_PRICE`, `TIME_AND_MATERIALS`, `NON_BILLABLE` |
| `search` | string | — | Search name, number, description |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "projectNumber": "PRJ-0001",
        "name": "Website Redesign",
        "status": "ACTIVE",
        "billingMethod": "TIME_AND_MATERIALS",
        "startDate": "2026-03-01T00:00:00.000Z",
        "endDate": "2026-06-30T00:00:00.000Z",
        "budgetAmount": 50000,
        "budgetHours": 500,
        "hourlyRate": 100,
        "color": "#3B82F6",
        "customer": { "id": "uuid", "displayName": "Acme Corp" },
        "timeEntryCount": 24,
        "teamMemberCount": 3,
        "totalLoggedHours": 120.5,
        "totalBilledAmount": 12050
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalCount": 5,
      "totalPages": 1
    }
  }
}
```

---

### 6. GET `/api/v1/projects/:id` — Project Detail

**Permission:** `project:view`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectNumber": "PRJ-0001",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "ACTIVE",
    "billingMethod": "TIME_AND_MATERIALS",
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-06-30T00:00:00.000Z",
    "budgetAmount": 50000,
    "budgetHours": 500,
    "hourlyRate": 100,
    "color": "#3B82F6",
    "customer": null,
    "teamMembers": [
      {
        "userId": "uuid",
        "name": "Arjun Singh",
        "email": "ceo@finanx.com",
        "role": "Project Lead",
        "hourlyRate": 120
      }
    ],
    "stats": {
      "totalTimeEntries": 24,
      "totalLoggedHours": 120.5,
      "totalAmount": 12050,
      "billableHours": 100.5,
      "billableAmount": 10050,
      "budgetHoursUsed": 24.1,
      "budgetAmountUsed": 24.1
    }
  }
}
```

**Notes:**
- `budgetHoursUsed` and `budgetAmountUsed` are percentages (0-100+)
- `null` if no budget is set for that dimension
- Values can exceed 100% if over-budget

---

### 7. PATCH `/api/v1/projects/:id` — Update Project

**Permission:** `project:edit`

Same fields as create, all optional. Cannot update COMPLETED or CANCELLED projects (reactivate first).

---

### 8. DELETE `/api/v1/projects/:id` — Delete Project

**Permission:** `project:delete`

Only ACTIVE projects with no submitted/approved time entries can be deleted.

---

### 9-12. Status Transitions

| Endpoint | Method | Permission | From → To |
|----------|--------|------------|-----------|
| `/projects/:id/complete` | PATCH | `project:edit` | ACTIVE, ON_HOLD → COMPLETED |
| `/projects/:id/hold` | PATCH | `project:edit` | ACTIVE → ON_HOLD |
| `/projects/:id/reactivate` | PATCH | `project:edit` | ON_HOLD, COMPLETED → ACTIVE |
| `/projects/:id/cancel` | PATCH | `project:edit` | Any (except CANCELLED) → CANCELLED |

All return the updated project object.

---

### 13. GET `/api/v1/projects/:id/profitability` — Profitability Report

**Permission:** `project:view`

**Response:**
```json
{
  "success": true,
  "data": {
    "projectNumber": "PRJ-0001",
    "projectName": "Website Redesign",
    "billingMethod": "TIME_AND_MATERIALS",
    "budgetAmount": 50000,
    "budgetHours": 500,
    "revenue": {
      "total": 15000,
      "invoiceCount": 3
    },
    "cost": {
      "total": 10500,
      "labor": 8500,
      "laborHours": 85,
      "timeEntryCount": 24,
      "expenses": 2000,
      "expenseCount": 5
    },
    "profit": 4500,
    "margin": 30
  }
}
```

**Frontend Usage:** Display a profitability card or chart. Color-code margin (green >20%, yellow 0-20%, red <0%).

---

### 14. POST `/api/v1/projects/:id/team` — Add Team Member

**Permission:** `project:edit`

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "Developer",
  "hourlyRate": 85
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | UUID | **Yes** | User to add (must be in same company) |
| `role` | string | No | Role label (max 100 chars) |
| `hourlyRate` | number | No | Per-member rate override |

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "Jane Developer",
    "email": "jane@finanx.com",
    "role": "Developer",
    "hourlyRate": 85
  }
}
```

---

### 15. PATCH `/api/v1/projects/:id/team/:userId` — Update Team Member

**Permission:** `project:edit`

**Request Body:**
```json
{
  "role": "Senior Developer",
  "hourlyRate": 100
}
```

---

### 16. DELETE `/api/v1/projects/:id/team/:userId` — Remove Team Member

**Permission:** `project:edit`

---

## Time Entries API

### 1. GET `/api/v1/time-entries/my` — My Time Entries

**Permission:** `time_entry:view`

Same query params and response shape as the list endpoint below, but automatically filtered to the current user.

---

### 2. POST `/api/v1/time-entries` — Log Time Entry

**Permission:** `time_entry:create`

**Request Body:**
```json
{
  "projectId": "uuid",
  "date": "2026-03-04",
  "duration": 4.5,
  "startTime": "2026-03-04T09:00:00.000Z",
  "endTime": "2026-03-04T13:30:00.000Z",
  "description": "Frontend mockups and wireframes",
  "notes": "Used Figma for the initial designs",
  "isBillable": true,
  "hourlyRate": 100
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | UUID | **Yes** | Project to log time against |
| `date` | date | **Yes** | Date of work (ISO string) |
| `duration` | number | **Yes** | Hours worked (min 0.01) |
| `startTime` | datetime | No | Clock-in time |
| `endTime` | datetime | No | Clock-out time |
| `description` | string | No | What was done (max 500 chars) |
| `notes` | string | No | Internal notes |
| `isBillable` | boolean | No | Defaults to `true` (or `false` if project is NON_BILLABLE) |
| `hourlyRate` | number | No | Override rate; otherwise cascades: team member → project → 0 |

**Hourly Rate Cascade:**
1. Explicit `hourlyRate` in request body
2. Team member's rate for this project
3. Project's default hourly rate
4. `0`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "project": {
      "id": "uuid",
      "projectNumber": "PRJ-0001",
      "name": "Website Redesign"
    },
    "userId": "uuid",
    "user": {
      "id": "uuid",
      "firstName": "Arjun",
      "lastName": "Singh",
      "email": "ceo@finanx.com"
    },
    "date": "2026-03-04T00:00:00.000Z",
    "startTime": "2026-03-04T09:00:00.000Z",
    "endTime": "2026-03-04T13:30:00.000Z",
    "duration": 4.5,
    "description": "Frontend mockups and wireframes",
    "notes": "Used Figma for the initial designs",
    "isBillable": true,
    "hourlyRate": 100,
    "totalAmount": 450,
    "status": "DRAFT",
    "approvedBy": null,
    "approvedAt": null,
    "rejectedAt": null,
    "rejectionReason": null,
    "invoiceId": null,
    "invoice": null,
    "createdAt": "2026-03-04T10:22:28.732Z",
    "updatedAt": "2026-03-04T10:22:28.732Z"
  }
}
```

---

### 3. GET `/api/v1/time-entries` — List Time Entries

**Permission:** `time_entry:view`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |
| `projectId` | UUID | — | Filter by project |
| `userId` | UUID | — | Filter by user who logged |
| `status` | string | — | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `INVOICED` |
| `startDate` | date | — | Filter entries on or after this date |
| `endDate` | date | — | Filter entries on or before this date |
| `isBillable` | string | — | `"true"` or `"false"` |
| `search` | string | — | Search description and notes |

---

### 4. GET `/api/v1/time-entries/:id` — Time Entry Detail

**Permission:** `time_entry:view`

Returns full entry with project, user, approvedBy, and invoice details.

---

### 5. PATCH `/api/v1/time-entries/:id` — Update Time Entry

**Permission:** `time_entry:edit`

Same fields as create, all optional. Only DRAFT or REJECTED entries can be edited. Editing a REJECTED entry automatically resets its status to DRAFT.

---

### 6. DELETE `/api/v1/time-entries/:id` — Delete Time Entry

**Permission:** `time_entry:delete`

Cannot delete APPROVED or INVOICED entries.

---

### 7-9. Approval Workflow

| Endpoint | Method | Permission | Action |
|----------|--------|------------|--------|
| `/time-entries/:id/submit` | PATCH | `time_entry:edit` | DRAFT → SUBMITTED |
| `/time-entries/:id/approve` | PATCH | `time_entry:approve` | SUBMITTED → APPROVED |
| `/time-entries/:id/reject` | PATCH | `time_entry:approve` | SUBMITTED → REJECTED |

**Reject Request Body:**
```json
{
  "reason": "Missing description for 2 hours"
}
```

All return the updated time entry object.

---

## Linking Projects to Invoices & Expenses

When creating or updating an Invoice or Expense, you can now pass an optional `projectId`:

**Create Invoice with Project:**
```json
{
  "customerId": "uuid",
  "projectId": "uuid",
  "invoiceDate": "2026-03-04",
  "lineItems": [...]
}
```

**Create Expense with Project:**
```json
{
  "expenseDate": "2026-03-04",
  "projectId": "uuid",
  "expenseAccountId": "uuid",
  "amount": 500,
  ...
}
```

Set `projectId` to `null` to unlink from a project on update.

---

## Permissions Reference

| Permission | Description | Roles |
|-----------|-------------|-------|
| `project:view` | View projects list and details | Admin, Standard, Limited |
| `project:create` | Create new projects | Admin, Standard |
| `project:edit` | Edit projects, manage team, status transitions | Admin, Standard |
| `project:delete` | Delete projects | Admin |
| `time_entry:view` | View time entries | Admin, Standard, Limited |
| `time_entry:create` | Log time entries | Admin, Standard, Limited |
| `time_entry:edit` | Edit/submit time entries | Admin, Standard, Limited |
| `time_entry:delete` | Delete time entries | Admin |
| `time_entry:approve` | Approve/reject submitted entries | Admin |

---

## Suggested Frontend Pages

### 1. Projects List Page
- Table/card view with status badges (use `color` from statuses)
- Filters: status, customer, billing method, search
- Show: name, number, customer, status, logged hours, team count
- Progress bars for budget usage

### 2. Project Detail Page
- **Header**: name, number, status badge, action buttons (based on `allow*` flags)
- **Overview tab**: description, dates, billing method, customer
- **Budget & Profitability tab**: budget gauges, revenue/cost breakdown, profit margin
- **Team tab**: list of team members with role, rate, add/edit/remove
- **Time Entries tab**: filtered list of entries for this project
- **Invoices tab**: list of invoices linked to this project
- **Expenses tab**: list of expenses linked to this project

### 3. Time Tracking Page
- **Timer view**: start/stop timer or manual entry form
- **My timesheet**: weekly/daily grid view of the current user's entries
- **All entries**: admin view with filters (project, user, status, date range)
- **Approval queue**: SUBMITTED entries for managers to approve/reject

### 4. Project Create/Edit Form
- Fields: name, description, customer dropdown, billing method select, dates, budget, rate, color picker
- Show next available number (from `next-number` endpoint)

### 5. Time Entry Form
- Project dropdown (required)
- Date picker, duration input (or start/end time)
- Description, notes
- Billable toggle (auto-set based on project)
- Rate display (shows cascaded rate)

---

## TypeScript Interfaces

```typescript
interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  billingMethod: 'FIXED_PRICE' | 'TIME_AND_MATERIALS' | 'NON_BILLABLE';
  startDate: string | null;
  endDate: string | null;
  budgetAmount: number | null;
  budgetHours: number | null;
  hourlyRate: number | null;
  color: string | null;
  customer: { id: string; displayName: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDetail extends Project {
  teamMembers: TeamMember[];
  stats: ProjectStats;
}

interface ProjectStats {
  totalTimeEntries: number;
  totalLoggedHours: number;
  totalAmount: number;
  billableHours: number;
  billableAmount: number;
  budgetHoursUsed: number | null;   // percentage
  budgetAmountUsed: number | null;  // percentage
}

interface ProjectProfitability {
  projectNumber: string;
  projectName: string;
  billingMethod: string;
  budgetAmount: number | null;
  budgetHours: number | null;
  revenue: { total: number; invoiceCount: number };
  cost: {
    total: number;
    labor: number;
    laborHours: number;
    timeEntryCount: number;
    expenses: number;
    expenseCount: number;
  };
  profit: number;
  margin: number;
}

interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string | null;
  hourlyRate: number | null;
}

interface TimeEntry {
  id: string;
  projectId: string;
  project: { id: string; projectNumber: string; name: string } | null;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  description: string | null;
  notes: string | null;
  isBillable: boolean;
  hourlyRate: number;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INVOICED';
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  invoiceId: string | null;
  invoice: { id: string; invoiceNumber: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStatusInfo {
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowComplete: boolean;
  allowHold: boolean;
  allowCancel: boolean;
  allowReactivate: boolean;
}

interface ProjectSummary {
  byStatus: Record<string, number>;
  totalProjects: number;
  totalLoggedHours: number;
  totalBilledAmount: number;
}
```

---

## Status Flow Diagrams

### Project Status Flow
```
                 ┌──────────┐
                 │  ACTIVE   │
                 └─┬──┬──┬──┘
                   │  │  │
          hold ────┘  │  └──── cancel ──────┐
                      │                     │
               complete                     │
                      │                     │
                 ┌────▼─────┐         ┌─────▼─────┐
                 │ COMPLETED │         │ CANCELLED  │
                 └─────┬────┘         └───────────┘
                       │
              reactivate
                       │
          ┌────────────┘
          │
     ┌────▼───┐
     │ ACTIVE  │ ◄── reactivate ── ON_HOLD
     └────────┘
```

### Time Entry Status Flow
```
  ┌───────┐    submit    ┌───────────┐   approve   ┌──────────┐   invoice   ┌──────────┐
  │ DRAFT │ ───────────► │ SUBMITTED │ ──────────► │ APPROVED │ ─────────► │ INVOICED │
  └───┬───┘              └─────┬─────┘             └──────────┘            └──────────┘
      ▲                        │
      │                   reject
      │                        │
      │    edit            ┌───▼─────┐
      └────────────────────│ REJECTED │
                           └─────────┘
```
