# Day 18 — Sales Orders Frontend Integration Guide

## Base URL
```
/api/v1/sales-orders
```

## Authentication
All endpoints require JWT Bearer token in the `Authorization` header.

---

## 1. Static Data Endpoints

### GET /statuses
Returns all 7 statuses with metadata for UI rendering.

```json
{
  "success": true,
  "data": [
    {
      "key": "DRAFT",
      "label": "Draft",
      "color": "#6B7280",
      "description": "Sales order is being prepared and has not been sent to customer",
      "allowEdit": true,
      "allowDelete": true,
      "allowSend": true,
      "allowConfirm": false,
      "allowFulfill": false,
      "allowConvert": false,
      "allowClose": false,
      "allowVoid": false
    }
  ]
}
```

**Status Colors:**
| Status | Color | Hex |
|--------|-------|-----|
| DRAFT | Gray | #6B7280 |
| SENT | Blue | #3B82F6 |
| CONFIRMED | Purple | #8B5CF6 |
| PARTIAL | Amber | #F59E0B |
| FULFILLED | Green | #10B981 |
| CLOSED | Emerald | #059669 |
| VOID | Gray | #9CA3AF |

### GET /next-number
```json
{
  "success": true,
  "data": { "nextSONumber": "SO-0001" }
}
```

### GET /summary
Dashboard aggregate data.

```json
{
  "success": true,
  "data": {
    "draft": { "count": 2 },
    "sent": { "count": 1, "amount": 15000 },
    "confirmed": { "count": 1, "amount": 22000 },
    "partial": { "count": 1, "amount": 18000 },
    "fulfilled": { "count": 0, "amount": 0 },
    "closed": { "count": 3, "amount": 45000 },
    "void": { "count": 1 },
    "overdueDelivery": { "count": 0, "amount": 0 },
    "totals": {
      "totalPending": 55000,
      "totalFulfilled": 45000
    }
  }
}
```

---

## 2. CRUD Operations

### POST / — Create Sales Order
**Permission:** `sales-order:create`

```json
{
  "customerId": "uuid",
  "orderDate": "2026-02-28",
  "expectedDeliveryDate": "2026-03-30",
  "paymentTerms": "Net 30",
  "referenceNumber": "REF-001",
  "depositAccountId": "uuid",
  "discountType": "PERCENTAGE",
  "discountValue": 5,
  "shippingAddressLine1": "123 Main St",
  "shippingAddressLine2": "Suite 100",
  "shippingCity": "Mumbai",
  "shippingState": "Maharashtra",
  "shippingPostalCode": "400001",
  "shippingCountry": "IN",
  "notes": "Internal notes",
  "memo": "Internal memo",
  "customerMessage": "Thank you for your order!",
  "termsAndConditions": "Payment due within 30 days",
  "lineItems": [
    {
      "productId": "uuid (optional)",
      "description": "Web Development Services",
      "quantity": 10,
      "unitPrice": 5000,
      "discountPercent": 0,
      "taxPercent": 18,
      "sortOrder": 0
    }
  ]
}
```

**Required fields:** `customerId`, `orderDate`, `lineItems` (at least 1 with `description`, `quantity`, `unitPrice`)

**Response:** Full SO object (see response format below)

### GET / — List Sales Orders
**Permission:** `sales-order:view`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: DRAFT, SENT, CONFIRMED, PARTIAL, FULFILLED, CLOSED, VOID |
| customerId | uuid | Filter by customer |
| dateFrom | date | Order date range start |
| dateTo | date | Order date range end |
| search | string | Search soNumber, referenceNumber, customer displayName |
| sortBy | string | createdAt (default), soNumber, orderDate, totalAmount, status |
| sortOrder | string | asc or desc (default) |
| page | number | Page number (default 1) |
| limit | number | Items per page (default 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "soNumber": "SO-0001",
        "referenceNumber": null,
        "status": "DRAFT",
        "statusInfo": { "label": "Draft", "color": "#6B7280", ... },
        "orderDate": "2026-02-28T00:00:00.000Z",
        "expectedDeliveryDate": null,
        "customer": { "id": "uuid", "displayName": "Infosys Ltd", "email": "..." },
        "totalAmount": 15340,
        "lineItemCount": 2,
        "createdAt": "2026-02-28T13:20:43.313Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

### GET /:id — Get Sales Order Detail
**Permission:** `sales-order:view`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "soNumber": "SO-0001",
    "referenceNumber": null,
    "status": "DRAFT",
    "statusInfo": { ... },
    "orderDate": "2026-02-28T00:00:00.000Z",
    "expectedDeliveryDate": null,
    "paymentTerms": "Net 30",
    "customer": {
      "id": "uuid",
      "displayName": "Infosys Ltd",
      "email": "procurement@infosys.com",
      "phone": "+91-80-28520261",
      "billingAddressLine1": "44 Electronics City",
      "billingAddressLine2": null,
      "billingCity": "Bangalore",
      "billingState": "Karnataka",
      "billingPostalCode": "560100",
      "billingCountry": "IN",
      "shippingAddressLine1": null,
      "shippingAddressLine2": null,
      "shippingCity": null,
      "shippingState": null,
      "shippingPostalCode": null,
      "shippingCountry": null
    },
    "depositAccount": { "id": "uuid", "name": "HDFC Current", "accountNumber": "1234" },
    "lineItems": [
      {
        "id": "uuid",
        "product": { "id": "uuid", "name": "Web Development", "sku": "WEB-001", "type": "SERVICE" },
        "description": "Web Development Services",
        "quantity": 10,
        "unitPrice": 5000,
        "discountPercent": 0,
        "taxPercent": 18,
        "amount": 59000,
        "quantityFulfilled": 5,
        "sortOrder": 0
      }
    ],
    "subtotal": 50000,
    "discountType": "PERCENTAGE",
    "discountValue": 5,
    "discountAmount": 2500,
    "taxAmount": 8550,
    "totalAmount": 56050,
    "shippingAddress": {
      "line1": "123 Main St",
      "line2": "Suite 100",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "IN"
    },
    "convertedInvoice": { "id": "uuid", "invoiceNumber": "INV-0009", "status": "DRAFT", "totalAmount": "56050" },
    "notes": "Internal notes",
    "memo": "Internal memo",
    "customerMessage": "Thank you!",
    "termsAndConditions": "Payment due within 30 days",
    "sentAt": "2026-02-28T...",
    "confirmedAt": "2026-02-28T...",
    "fulfilledAt": "2026-02-28T...",
    "closedAt": "2026-02-28T...",
    "voidedAt": null,
    "voidReason": null,
    "createdAt": "2026-02-28T...",
    "updatedAt": "2026-02-28T..."
  }
}
```

### PATCH /:id — Update Sales Order
**Permission:** `sales-order:edit`
**Restriction:** DRAFT status only

Same body as create (all fields optional via PartialType).

### DELETE /:id — Delete Sales Order
**Permission:** `sales-order:delete`
**Restriction:** DRAFT status only

---

## 3. Lifecycle Endpoints

### POST /:id/send — Send to Customer
**Permission:** `sales-order:send`
**Transition:** DRAFT → SENT

If no `expectedDeliveryDate` is set, defaults to 30 days from now.

### POST /:id/confirm — Customer Confirms
**Permission:** `sales-order:fulfill`
**Transition:** SENT → CONFIRMED

Represents the customer accepting/confirming the sales order. This is a step unique to SOs (Purchase Orders don't have it).

### POST /:id/fulfill — Record Fulfillment
**Permission:** `sales-order:fulfill`
**Transition:** CONFIRMED/PARTIAL → PARTIAL/FULFILLED

```json
{
  "fulfilledDate": "2026-02-28",
  "items": [
    {
      "lineItemId": "uuid",
      "quantityFulfilled": 5
    }
  ]
}
```

**Behavior:**
- `quantityFulfilled` is **additive** (adds to existing fulfilled amount)
- Over-fulfill protection: validates `existing + new ≤ ordered quantity`
- Auto-determines status:
  - All lines fully fulfilled → **FULFILLED**
  - Otherwise → **PARTIAL**

### POST /:id/convert-to-invoice — Convert to Invoice
**Permission:** `sales-order:convert`
**Transition:** FULFILLED/PARTIAL → CLOSED

Creates a DRAFT Invoice with:
- Line items based on `quantityFulfilled` amounts (proportional for partial)
- Auto-generated invoice number (INV-XXXX)
- `amountDue = totalAmount`, `amountPaid = 0`
- SO gets `convertedInvoiceId` linking back to created invoice

### POST /:id/duplicate — Clone SO
**Permission:** `sales-order:create`

Creates a new DRAFT SO from any existing SO:
- New SO number auto-generated
- All `quantityFulfilled` reset to 0
- Status timestamps cleared

### POST /:id/close — Manually Close
**Permission:** `sales-order:edit`
**Transition:** FULFILLED/PARTIAL → CLOSED

For closing SOs without converting to invoice (e.g., partial delivery accepted as complete).

### POST /:id/void — Void SO
**Permission:** `sales-order:void`
**Transition:** SENT/CONFIRMED/PARTIAL → VOID

```json
{
  "reason": "Customer cancelled the order"
}
```

**Edge Cases:**
- DRAFT → suggests deleting instead
- CLOSED → suggests voiding the resulting invoice
- FULFILLED → suggests closing or converting first

---

## 4. Status Lifecycle Diagram

```
  ┌───────┐
  │ DRAFT │──────────────────────────────────────┐
  └───┬───┘                                      │ (delete)
      │ send                                     ▼
  ┌───▼───┐                                  [DELETED]
  │ SENT  │──────────────────────┐
  └───┬───┘                      │ void
      │ confirm                  │
  ┌───▼──────┐                   │
  │CONFIRMED │───────────────────┤
  └───┬──────┘                   │
      │ fulfill                  │
  ┌───▼────┐                     │
  │PARTIAL │─────────────────────┘
  └───┬────┘                         ┌──────┐
      │ fulfill (all done)           │ VOID │
  ┌───▼──────┐                       └──────┘
  │FULFILLED │
  └───┬──────┘
      │ convert-to-invoice / close
  ┌───▼────┐
  │ CLOSED │
  └────────┘
```

## 5. Action Buttons by Status

Use `statusInfo` flags from the response to conditionally render buttons:

| Status | Edit | Delete | Send | Confirm | Fulfill | Convert | Close | Void |
|--------|------|--------|------|---------|---------|---------|-------|------|
| DRAFT | ✅ | ✅ | ✅ | - | - | - | - | - |
| SENT | - | - | - | ✅ | - | - | - | ✅ |
| CONFIRMED | - | - | - | - | ✅ | - | - | ✅ |
| PARTIAL | - | - | - | - | ✅ | ✅ | ✅ | ✅ |
| FULFILLED | - | - | - | - | - | ✅ | ✅ | - |
| CLOSED | - | - | - | - | - | - | - | - |
| VOID | - | - | - | - | - | - | - | - |

## 6. Fulfill Dialog UI

When fulfilling, display a table of unfulfilled line items:

```
┌─────────────────────────────────────────────────┐
│ Fulfill Items                                    │
├──────────────────────┬──────────┬───────┬────────┤
│ Description          │ Ordered  │ Done  │ Now    │
├──────────────────────┼──────────┼───────┼────────┤
│ Web Development      │ 10       │ 5     │ [___]  │
│ UI/UX Design         │ 3        │ 0     │ [___]  │
├──────────────────────┴──────────┴───────┴────────┤
│ Fulfilled Date: [2026-02-28]                     │
│                        [Cancel]  [Fulfill Items] │
└──────────────────────────────────────────────────┘
```

Validation:
- `Now` value must be ≤ `Ordered - Done`
- At least one item must have a value > 0

## 7. Sales Pipeline Flow (Estimate → SO → Invoice)

```
Estimate (ACCEPTED) ──convert──► Sales Order (DRAFT)
                                      │
                                      │ send → confirm → fulfill
                                      │
                                      ▼
                                 Sales Order (FULFILLED)
                                      │
                                      │ convert-to-invoice
                                      ▼
                                 Invoice (DRAFT) ──send──► Invoice (SENT)
                                                              │
                                                              │ payment
                                                              ▼
                                                         Invoice (PAID)
```

## 8. Permissions Required

| Permission | Standard | Limited | Reports Only |
|-----------|----------|---------|--------------|
| sales-order:view | ✅ | ✅ | ✅ |
| sales-order:create | ✅ | - | - |
| sales-order:edit | ✅ | - | - |
| sales-order:delete | ✅ | - | - |
| sales-order:send | ✅ | - | - |
| sales-order:fulfill | ✅ | - | - |
| sales-order:convert | ✅ | - | - |
| sales-order:void | ✅ | - | - |
