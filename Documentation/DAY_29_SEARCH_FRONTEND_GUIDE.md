# Day 29 — Global Search Frontend Integration Guide

Base URL: `{{API_URL}}/api/v1`

All endpoints require `Authorization: Bearer <token>` header.
All endpoints require `search:global` permission.

---

## 1. Global Search

Full cross-entity search returning categorized results from all 14 entity types.

```
GET /search/global?q=acme
GET /search/global?q=acme&limit=30
```

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search text (min 2 chars) |
| `limit` | number | 20 | Max total results (1-50) |

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "acme",
    "totalMatches": 8,
    "categories": {
      "customers": 2,
      "vendors": 0,
      "products": 1,
      "accounts": 0,
      "invoices": 3,
      "bills": 0,
      "expenses": 1,
      "journalEntries": 0,
      "creditNotes": 0,
      "debitNotes": 0,
      "estimates": 1,
      "purchaseOrders": 0,
      "salesOrders": 0,
      "projects": 0
    },
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "entityType": "INVOICE",
        "title": "INV-0042",
        "subtitle": "Acme Corporation",
        "amount": 5250.00,
        "status": "SENT",
        "date": "2026-03-09T14:30:00.000Z",
        "url": "/invoices/550e8400-e29b-41d4-a716-446655440000"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "entityType": "CUSTOMER",
        "title": "Acme Corporation",
        "subtitle": "acme@corp.com",
        "amount": null,
        "status": null,
        "date": "2026-02-15T10:00:00.000Z",
        "url": "/customers/660e8400-e29b-41d4-a716-446655440001"
      }
    ]
  }
}
```

**Frontend usage:**
- Use `categories` to show result count badges per entity type
- Use `results` to render the search results list
- Use `url` for navigation when user clicks a result
- Use `entityType` to show icons/badges per result type
- Use `totalMatches` for "X results found" text

---

## 2. Quick Search (Search-as-you-type)

Optimized for speed — searches only 8 core entities with max 3 results per entity.

```
GET /search/quick?q=inv
GET /search/quick?q=inv&limit=5
```

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search text (min 2 chars) |
| `limit` | number | 5 | Per-entity limit (1-50), total capped at limit*3 |

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "inv",
    "results": [
      {
        "id": "...",
        "entityType": "INVOICE",
        "title": "INV-0042",
        "subtitle": "Acme Corporation",
        "amount": 5250.00,
        "status": "SENT",
        "date": "2026-03-09T14:30:00.000Z",
        "url": "/invoices/..."
      },
      {
        "id": "...",
        "entityType": "PRODUCT",
        "title": "Invoice Paper A4",
        "subtitle": "INV-PPR-001",
        "amount": null,
        "status": null,
        "date": "2026-01-20T09:00:00.000Z",
        "url": "/products/..."
      }
    ]
  }
}
```

**Entities searched in quick mode:** Customers, Vendors, Products, Accounts, Invoices, Bills, Expenses, Projects (8 of 14).

**Not searched:** Credit Notes, Debit Notes, Estimates, Purchase Orders, Sales Orders, Journal Entries.

**Frontend usage:**
- Wire to search input's `onChange` with debounce (300ms recommended)
- Show dropdown with results grouped by `entityType`
- Link each result using `url`
- Show "View all results" link that navigates to full search page

---

## 3. Entity Search (Paginated)

Search within a specific entity type with full pagination.

```
GET /search/customer?q=acme&limit=20&page=1
GET /search/invoice?q=INV-00&limit=10&page=2
GET /search/product?q=widget&limit=50&page=1
```

**Valid entity types:** `customer`, `vendor`, `product`, `account`, `invoice`, `bill`, `expense`, `journal_entry`, `credit_note`, `debit_note`, `estimate`, `purchase_order`, `sales_order`, `project`

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search text (min 2 chars) |
| `limit` | number | 20 | Results per page (1-100) |
| `page` | number | 1 | Page number |

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "acme",
    "entityType": "customer",
    "results": [
      {
        "id": "...",
        "entityType": "CUSTOMER",
        "title": "Acme Corporation",
        "subtitle": "acme@corp.com",
        "amount": null,
        "status": null,
        "date": "2026-02-15T10:00:00.000Z",
        "url": "/customers/..."
      },
      {
        "id": "...",
        "entityType": "CUSTOMER",
        "title": "Acme Supplies Ltd",
        "subtitle": "supplies@acme.com",
        "amount": null,
        "status": null,
        "date": "2026-01-10T08:00:00.000Z",
        "url": "/customers/..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

**Frontend usage:**
- Use when user clicks a category in global search results to "drill down"
- Standard pagination controls using `pagination` object
- Entity type selector/tabs at the top

---

## Result Item Shape Reference

Every search result follows this uniform shape:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Entity UUID | `"550e8400-..."` |
| `entityType` | string | Entity type constant | `"CUSTOMER"`, `"INVOICE"` |
| `title` | string | Primary display text | `"INV-0042"`, `"Acme Corp"` |
| `subtitle` | string/null | Secondary context text | `"Acme Corporation"`, `"acme@corp.com"` |
| `amount` | number/null | Financial amount (if applicable) | `5250.00`, `null` |
| `status` | string/null | Entity status (if applicable) | `"SENT"`, `"PAID"`, `null` |
| `date` | string | ISO timestamp (sort key) | `"2026-03-09T14:30:00.000Z"` |
| `url` | string | Frontend navigation path | `"/invoices/550e8400-..."` |

---

## Entity Type → Display Mapping

| entityType | Icon Suggestion | Color Suggestion |
|------------|-----------------|------------------|
| `CUSTOMER` | User/People | Blue |
| `VENDOR` | Building/Store | Purple |
| `PRODUCT` | Box/Package | Green |
| `ACCOUNT` | Wallet/Ledger | Gray |
| `INVOICE` | FileText/Receipt | Emerald |
| `BILL` | FileInvoice | Orange |
| `EXPENSE` | CreditCard | Red |
| `JOURNAL_ENTRY` | BookOpen | Slate |
| `CREDIT_NOTE` | FileMinus | Teal |
| `DEBIT_NOTE` | FilePlus | Amber |
| `ESTIMATE` | FileCheck | Cyan |
| `PURCHASE_ORDER` | ShoppingCart | Indigo |
| `SALES_ORDER` | ShoppingBag | Violet |
| `PROJECT` | Briefcase | Sky |

---

## Recommended Frontend Architecture

### Search Bar Component
```
┌─────────────────────────────────────┐
│ 🔍 Search...                        │
├─────────────────────────────────────┤
│ Quick Results (from /search/quick)  │
│                                     │
│ 👤 CUSTOMER                         │
│   Acme Corporation                  │
│   acme@corp.com                     │
│                                     │
│ 📄 INVOICE                          │
│   INV-0042 · $5,250.00 · SENT      │
│   Acme Corporation                  │
│                                     │
│ ─────────────────────────────────── │
│ View all results for "acme" →       │
└─────────────────────────────────────┘
```

### Full Search Page
```
┌─────────────────────────────────────┐
│ 🔍 acme                     [Search]│
├─────────────────────────────────────┤
│ All(8) Customers(2) Invoices(3) ... │ ← category tabs from `categories`
├─────────────────────────────────────┤
│ Results (from /search/global or     │
│          /search/:entityType)       │
│                                     │
│ [Result cards with title, subtitle, │
│  amount, status, entity badge]      │
│                                     │
│ ← 1 2 3 ... →                      │ ← pagination for entity tab
└─────────────────────────────────────┘
```

---

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Search query must be at least 2 characters | `q` is too short or missing |
| 400 | Invalid entity type | Unrecognized entity type in `/:entityType` |
| 403 | Forbidden | Missing `search:global` permission |
