# Day 31 — Notifications/Alerts Frontend Integration Guide

## Base URL
```
/api/v1/notifications
```

All endpoints require `Authorization: Bearer <token>` header.

---

## TypeScript Interfaces

```typescript
interface Notification {
  id: string;
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;   // "INVOICE", "BILL", "PRODUCT", "EXPENSE", "PROJECT"
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;       // ISO date
  metadata: Record<string, any> | null;
  createdAt: string;           // ISO date
}

type NotificationType =
  | 'INVOICE_OVERDUE'
  | 'BILL_OVERDUE'
  | 'LOW_STOCK'
  | 'RECURRING_UPCOMING'
  | 'EXPENSE_PENDING_APPROVAL'
  | 'PROJECT_DEADLINE'
  | 'PAYMENT_RECEIVED'
  | 'INVOICE_SENT'
  | 'SYSTEM_ALERT'
  | 'GENERAL';

interface NotificationPreference {
  notificationType: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

interface PaginatedNotifications {
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}
```

---

## Endpoints

### 1. GET `/notifications` — List Notifications (Paginated)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | - | Filter by NotificationType |
| `isRead` | boolean | - | Filter by read state |
| `dateFrom` | string (YYYY-MM-DD) | - | Start date filter |
| `dateTo` | string (YYYY-MM-DD) | - | End date filter |
| `sortBy` | string | `createdAt` | Sort field: `createdAt` or `type` |
| `sortOrder` | string | `desc` | Sort direction: `asc` or `desc` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "items": [
      {
        "id": "3846d39c-9214-49dc-917d-ef0f50ed63f6",
        "companyId": "9bf301f9-...",
        "userId": "bb512a5d-...",
        "type": "GENERAL",
        "title": "Test Notification",
        "message": "This is a test notification...",
        "entityType": null,
        "entityId": null,
        "isRead": false,
        "readAt": null,
        "metadata": null,
        "createdAt": "2026-03-10T21:42:25.341Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 1,
      "totalPages": 1
    }
  }
}
```

---

### 2. GET `/notifications/unread-count` — Badge Count

Use this for polling (e.g., every 30s) to update the notification bell badge.

**Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 5
  }
}
```

---

### 3. GET `/notifications/:id` — Single Notification

**Response:** Same as a single item in the list response.

---

### 4. PATCH `/notifications/:id/read` — Mark as Read

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "3846d39c-...",
    "isRead": true,
    "readAt": "2026-03-10T21:42:36.593Z",
    "...": "..."
  }
}
```

---

### 5. PATCH `/notifications/read-all` — Mark All as Read

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updated": 5
  }
}
```

---

### 6. DELETE `/notifications/:id` — Delete Single

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": null
}
```

---

### 7. DELETE `/notifications/clear-read` — Clear All Read

**Response:**
```json
{
  "success": true,
  "message": "Read notifications cleared successfully",
  "data": {
    "deleted": 3
  }
}
```

---

### 8. GET `/notifications/preferences` — Get Preferences

Returns all 10 notification types with current settings (defaults applied for types without explicit preferences).

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences retrieved successfully",
  "data": [
    {
      "notificationType": "INVOICE_OVERDUE",
      "inAppEnabled": true,
      "emailEnabled": true
    },
    {
      "notificationType": "BILL_OVERDUE",
      "inAppEnabled": true,
      "emailEnabled": false
    },
    {
      "notificationType": "LOW_STOCK",
      "inAppEnabled": true,
      "emailEnabled": false
    },
    "... (10 total)"
  ]
}
```

---

### 9. PUT `/notifications/preferences` — Update Preferences

**Request Body:**
```json
{
  "preferences": [
    {
      "notificationType": "INVOICE_OVERDUE",
      "inAppEnabled": true,
      "emailEnabled": true
    },
    {
      "notificationType": "LOW_STOCK",
      "emailEnabled": true
    }
  ]
}
```

Only send the types you want to change. Omitted fields keep their current/default value.

**Response:** Full list of all 10 preferences (same as GET).

---

### 10. POST `/notifications/test` — Send Test (Admin Only)

Requires `notification:manage` permission.

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "id": "...",
    "type": "GENERAL",
    "title": "Test Notification",
    "message": "This is a test notification...",
    "isRead": false,
    "createdAt": "2026-03-10T21:42:25.341Z"
  }
}
```

---

## Recommended UI Implementation

### Notification Bell (Header)
- Poll `GET /notifications/unread-count` every 30 seconds
- Display badge with count on bell icon
- Click opens notification dropdown/panel

### Notification Dropdown
- Show latest 5-10 notifications from `GET /notifications?limit=10`
- Unread items highlighted with accent color
- Click on notification:
  1. Call `PATCH /notifications/:id/read`
  2. Navigate to entity if `entityType` + `entityId` present
- "Mark all as read" button → `PATCH /notifications/read-all`
- "View all" link → full notifications page

### Notification Page
- Full paginated list with filters (type, read state, date range)
- Bulk actions: mark all read, clear read notifications
- Type filter as dropdown with notification type labels

### Settings Page — Notification Preferences
- Grid/table with rows = notification types, columns = channels (In-App, Email)
- Toggle switches for each cell
- Save button calls `PUT /notifications/preferences`

### Notification Type Labels & Icons

| Type | Display Label | Suggested Icon | Color |
|------|--------------|----------------|-------|
| `INVOICE_OVERDUE` | Overdue Invoice | FileWarning | red |
| `BILL_OVERDUE` | Overdue Bill | Receipt | red |
| `LOW_STOCK` | Low Stock Alert | Package | orange |
| `RECURRING_UPCOMING` | Recurring Due | RefreshCw | blue |
| `EXPENSE_PENDING_APPROVAL` | Expense Approval | Clock | yellow |
| `PROJECT_DEADLINE` | Project Deadline | Calendar | orange |
| `PAYMENT_RECEIVED` | Payment Received | DollarSign | green |
| `INVOICE_SENT` | Invoice Sent | Send | blue |
| `SYSTEM_ALERT` | System Alert | AlertCircle | gray |
| `GENERAL` | General | Bell | gray |

### Click-Through Navigation

When a notification has `entityType` and `entityId`, navigate to the entity:

```typescript
function getNotificationLink(notification: Notification): string | null {
  if (!notification.entityType || !notification.entityId) return null;

  const routes: Record<string, string> = {
    INVOICE: `/invoices/${notification.entityId}`,
    BILL: `/bills/${notification.entityId}`,
    PRODUCT: `/products/${notification.entityId}`,
    EXPENSE: `/expenses/${notification.entityId}`,
    PROJECT: `/projects/${notification.entityId}`,
  };

  return routes[notification.entityType] || null;
}
```

---

## Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid query params | Validation error details |
| 401 | No/expired token | `Unauthorized` |
| 403 | Missing permission | `Forbidden` |
| 404 | Notification not found or not owned by user | `Notification not found` |

---

## Permissions Required

| Permission | Who Has It | What It Allows |
|-----------|-----------|---------------|
| `notification:view` | All roles | View own notifications, manage preferences |
| `notification:manage` | Admin only | Send test notifications |

---

## Polling Strategy

Since the app uses REST (no WebSocket), poll for new notifications:

```typescript
// Poll every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await api.get('/notifications/unread-count');
    setUnreadCount(data.data.unreadCount);
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

Consider increasing the interval to 60s for non-critical views, and reducing to 15s when the notifications panel is open.
