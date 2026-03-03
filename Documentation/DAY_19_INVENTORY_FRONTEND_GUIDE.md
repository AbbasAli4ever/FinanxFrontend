# Day 19 — Inventory Management Frontend Integration Guide

## Base URL
```
GET /api/v1/inventory/...
```

All endpoints require `Authorization: Bearer <token>` and `inventory:view` permission.

---

## 1. Inventory Valuation

**Shows all tracked products with their current value (qty x avgCost).**

```
GET /api/v1/inventory/valuation
```

### Response
```json
{
  "success": true,
  "message": "Inventory valuation retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Widget A",
        "sku": "WDG-001",
        "type": "INVENTORY",
        "category": { "id": "uuid", "name": "Electronics" },
        "quantityOnHand": 150,
        "averageCost": 10.6667,
        "salesPrice": 25.00,
        "totalValue": 1600.005
      }
    ],
    "summary": {
      "totalProducts": 1,
      "totalValue": 1600.005
    }
  }
}
```

### Frontend Usage
- Dashboard widget showing total inventory value
- Table with product-level breakdown
- `totalValue = quantityOnHand * averageCost` per product

---

## 2. Inventory Movements

**Paginated history of all stock movements across all products.**

```
GET /api/v1/inventory/movements
```

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| productId | UUID | Filter by specific product |
| transactionType | enum | PURCHASE_RECEIVE, SALES_FULFILL, MANUAL_ADJUSTMENT, INITIAL_STOCK, VOID_REVERSAL, TRANSFER |
| dateFrom | date string | Start date (YYYY-MM-DD) |
| dateTo | date string | End date (YYYY-MM-DD) |
| search | string | Search product name, SKU, notes |
| sortBy | string | Sort field (default: date desc) |
| sortOrder | asc/desc | Sort direction |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

### Example
```
GET /api/v1/inventory/movements?transactionType=PURCHASE_RECEIVE&dateFrom=2026-03-01&page=1&limit=10
```

### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Widget A",
          "sku": "WDG-001",
          "type": "INVENTORY"
        },
        "transactionType": "PURCHASE_RECEIVE",
        "quantity": 50,
        "quantityBefore": 100,
        "quantityAfter": 150,
        "unitCost": 12.00,
        "totalCost": 600.00,
        "referenceType": "PURCHASE_ORDER",
        "referenceId": "uuid-of-po",
        "notes": "Received from PO PO-0004",
        "date": "2026-03-01T16:05:50.654Z",
        "createdBy": {
          "id": "uuid",
          "firstName": "Arjun",
          "lastName": "Singh"
        },
        "createdAt": "2026-03-01T16:05:50.655Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### Frontend Usage
- Activity log/feed showing all inventory changes
- Filter dropdowns for transaction type and date range
- Product selector to filter by specific product
- Link `referenceId` to the source document (PO, SO, etc.) based on `referenceType`

---

## 3. Stock Summary

**All tracked products with current status classification.**

```
GET /api/v1/inventory/stock-summary
```

### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Widget A",
        "sku": "WDG-001",
        "type": "INVENTORY",
        "category": null,
        "preferredVendor": null,
        "quantityOnHand": 130,
        "averageCost": 10.6667,
        "salesPrice": 25.00,
        "totalValue": 1386.671,
        "reorderPoint": 5,
        "reorderQuantity": 50,
        "status": "IN_STOCK"
      }
    ],
    "summary": {
      "totalProducts": 1,
      "totalValue": 1386.671,
      "inStockCount": 1,
      "lowStockCount": 0,
      "outOfStockCount": 0
    }
  }
}
```

### Status Logic
| Status | Condition |
|--------|-----------|
| IN_STOCK | `quantityOnHand > reorderPoint` |
| LOW_STOCK | `0 < quantityOnHand <= reorderPoint` |
| OUT_OF_STOCK | `quantityOnHand <= 0` |

### Frontend Usage
- Inventory dashboard with status badges (green/yellow/red)
- Summary cards: total products, in stock, low stock, out of stock
- Table with sortable columns
- Color-code rows by status
- "Reorder" button for LOW_STOCK items (could link to PO creation)

---

## 4. Product Stock Card

**Full movement history for a single product with running balance.**

```
GET /api/v1/inventory/product/:id/stock-card
```

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| dateFrom | date string | Start date filter |
| dateTo | date string | End date filter |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50) |

### Response
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "Widget A",
      "sku": "WDG-001",
      "type": "INVENTORY",
      "trackInventory": true,
      "currentQuantity": 130,
      "averageCost": 10.6667,
      "salesPrice": 25.00,
      "reorderPoint": 5,
      "reorderQuantity": 50
    },
    "transactions": [
      {
        "id": "uuid",
        "transactionType": "MANUAL_ADJUSTMENT",
        "quantity": 100,
        "quantityBefore": 0,
        "quantityAfter": 100,
        "unitCost": 10.00,
        "totalCost": 1000.00,
        "referenceType": "MANUAL",
        "referenceId": null,
        "notes": "RECEIVED: Initial stock setup",
        "date": "2026-03-01T16:05:50.654Z",
        "createdBy": {
          "id": "uuid",
          "firstName": "Arjun",
          "lastName": "Singh"
        },
        "createdAt": "2026-03-01T16:05:50.655Z"
      },
      {
        "id": "uuid",
        "transactionType": "PURCHASE_RECEIVE",
        "quantity": 50,
        "quantityBefore": 100,
        "quantityAfter": 150,
        "unitCost": 12.00,
        "totalCost": 600.00,
        "referenceType": "PURCHASE_ORDER",
        "referenceId": "uuid-of-po",
        "notes": "Received from PO PO-0004",
        "date": "2026-03-01T...",
        "createdBy": { "id": "uuid", "firstName": "Arjun", "lastName": "Singh" },
        "createdAt": "2026-03-01T..."
      },
      {
        "id": "uuid",
        "transactionType": "SALES_FULFILL",
        "quantity": -20,
        "quantityBefore": 150,
        "quantityAfter": 130,
        "unitCost": 10.6667,
        "totalCost": -213.334,
        "referenceType": "SALES_ORDER",
        "referenceId": "uuid-of-so",
        "notes": "Fulfilled from SO SO-0005",
        "date": "2026-03-01T...",
        "createdBy": { "id": "uuid", "firstName": "Arjun", "lastName": "Singh" },
        "createdAt": "2026-03-01T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### Frontend Usage
- Product detail page → "Stock Card" tab
- Table showing chronological movements with running balance
- Color-code: green for positive qty (receives), red for negative (fulfills)
- Clickable `referenceId` links to source documents
- Date range picker for filtering

---

## Transaction Types Reference

| Type | Source | Quantity | Description |
|------|--------|----------|-------------|
| PURCHASE_RECEIVE | PO receive | Positive (+) | Stock received from vendor |
| SALES_FULFILL | SO fulfill | Negative (-) | Stock shipped to customer |
| MANUAL_ADJUSTMENT | Product adjust-stock | +/- | Manual stock correction |
| INITIAL_STOCK | Future use | Positive (+) | Opening balance |
| VOID_REVERSAL | Future use | +/- | Reversal of voided document |
| TRANSFER | Future use | +/- | Warehouse transfer |

## Reference Types

| Type | Links To | Route |
|------|----------|-------|
| PURCHASE_ORDER | Purchase Order | /purchase-orders/:referenceId |
| SALES_ORDER | Sales Order | /sales-orders/:referenceId |
| INVOICE | Invoice | /invoices/:referenceId |
| BILL | Bill | /bills/:referenceId |
| MANUAL | N/A | No link (manual adjustment) |
| OPENING_BALANCE | N/A | No link (initial setup) |

---

## Related Endpoints (Other Modules)

These existing endpoints also relate to inventory:

| Endpoint | Module | Description |
|----------|--------|-------------|
| POST /products/:id/adjust-stock | Products | Manual stock adjustment (now creates InventoryTransaction) |
| GET /products/low-stock | Products | Products below reorder point |
| POST /purchase-orders/:id/receive | POs | Receive items (now auto-updates stock) |
| POST /sales-orders/:id/fulfill | SOs | Fulfill items (now auto-decreases stock) |

---

## Suggested Frontend Pages

### 1. Inventory Dashboard
- **Summary cards**: Total Value, In Stock, Low Stock, Out of Stock counts
- **Valuation chart**: Top products by value (pie/bar chart)
- **Recent movements**: Last 10 stock changes (from movements endpoint)
- **Low stock alerts**: Products needing reorder

### 2. Stock Summary Table
- Sortable/filterable table from stock-summary endpoint
- Status badges with color coding
- Quick actions: View stock card, Adjust stock, Create PO

### 3. Movement History
- Full movement log from movements endpoint
- Filters: product, transaction type, date range
- Export to CSV

### 4. Product Stock Card (within Product Detail)
- Tab or section on product detail page
- Chronological table with running balance
- Chart showing quantity over time

---

## TypeScript Interfaces

```typescript
interface InventoryValuationItem {
  id: string;
  name: string;
  sku: string | null;
  type: string;
  category: { id: string; name: string } | null;
  quantityOnHand: number;
  averageCost: number;
  salesPrice: number;
  totalValue: number;
}

interface InventoryMovement {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    type: string;
  };
  transactionType: 'PURCHASE_RECEIVE' | 'SALES_FULFILL' | 'MANUAL_ADJUSTMENT' | 'INITIAL_STOCK' | 'VOID_REVERSAL' | 'TRANSFER';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: number;
  totalCost: number;
  referenceType: 'PURCHASE_ORDER' | 'SALES_ORDER' | 'INVOICE' | 'BILL' | 'MANUAL' | 'OPENING_BALANCE';
  referenceId: string | null;
  notes: string | null;
  date: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface StockSummaryItem {
  id: string;
  name: string;
  sku: string | null;
  type: string;
  category: { id: string; name: string } | null;
  preferredVendor: { id: string; displayName: string } | null;
  quantityOnHand: number;
  averageCost: number;
  salesPrice: number;
  totalValue: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface ProductStockCard {
  product: {
    id: string;
    name: string;
    sku: string | null;
    type: string;
    trackInventory: boolean;
    currentQuantity: number;
    averageCost: number;
    salesPrice: number;
    reorderPoint: number;
    reorderQuantity: number;
  };
  transactions: InventoryMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```
