# Day 28 — Data Import/Export Frontend Integration Guide

Base URL: `{{API_URL}}/api/v1`

All endpoints require `Authorization: Bearer <token>` header.
Import endpoints require `data:import` permission.
Export endpoints require `data:export` permission.

---

## 1. Get Supported Entities

```
GET /data/export/supported-entities
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "entityType": "customers",
      "importable": true,
      "exportable": true,
      "fields": [
        { "csvHeader": "displayName", "type": "string", "required": true, "example": "Acme Corp" },
        { "csvHeader": "customerType", "type": "string", "required": false, "example": "Business" },
        { "csvHeader": "email", "type": "string", "required": false, "example": "john@acme.com" }
      ]
    },
    {
      "entityType": "invoices",
      "importable": false,
      "exportable": true,
      "fields": [
        { "csvHeader": "invoiceNumber", "type": "string", "required": false, "example": "INV-0001" }
      ]
    }
  ]
}
```

---

## 2. Download CSV Template

```
GET /data/templates/customers
GET /data/templates/vendors
GET /data/templates/products
GET /data/templates/accounts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "csv": "displayName,customerType,companyName,firstName,lastName,email,phone,...\nAcme Corp,Business,Acme Corporation,John,Doe,john@acme.com,555-0100,...\n",
    "fileName": "customers-template.csv",
    "fields": [
      { "csvHeader": "displayName", "type": "string", "required": true, "example": "Acme Corp" },
      { "csvHeader": "customerType", "type": "string", "required": false, "example": "Business" }
    ]
  }
}
```

**Frontend usage:** Extract `data.csv`, create a Blob, and trigger download:
```javascript
const blob = new Blob([response.data.csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = response.data.fileName;
a.click();
```

---

## 3. Validate Import (Dry Run)

```
POST /data/import/customers/validate
POST /data/import/vendors/validate
POST /data/import/products/validate
POST /data/import/accounts/validate
```

**Request Body:**
```json
{
  "csvData": "displayName,email,customerType\nAcme Corp,acme@test.com,Business\n,missing-name@test.com,Individual\nBad Corp,bad@test.com,InvalidType",
  "fileName": "customers.csv"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRows": 3,
    "validRows": 1,
    "invalidRows": 2,
    "errors": [
      { "row": 3, "message": "Row 3: \"displayName\" is required" },
      { "row": 4, "message": "Row 4: customerType must be \"Business\" or \"Individual\"" }
    ]
  }
}
```

**Note:** Row numbers start at 2 (row 1 is the header). Error row numbers match the CSV file line numbers.

---

## 4. Import Data

```
POST /data/import/customers
POST /data/import/vendors
POST /data/import/products
POST /data/import/accounts
```

**Request Body:**
```json
{
  "csvData": "displayName,email,customerType,phone\nAcme Corp,acme@test.com,Business,555-0100\nGlobal Ltd,global@test.com,Business,555-0200\nJohn Doe,john@test.com,Individual,555-0300",
  "fileName": "customers-batch.csv",
  "duplicateStrategy": "skip"
}
```

**Duplicate strategies:**
| Strategy | Behavior |
|----------|----------|
| `skip` (default) | Skip rows where entity already exists |
| `update` | Update existing entity with CSV values (upsert) |
| `fail` | Report error for any duplicate found |

**Response (success):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "...",
    "userId": "...",
    "entityType": "customers",
    "status": "COMPLETED",
    "fileName": "customers-batch.csv",
    "duplicateStrategy": "skip",
    "totalRows": 3,
    "successCount": 3,
    "errorCount": 0,
    "errors": null,
    "createdAt": "2026-03-10T14:30:00.000Z",
    "completedAt": "2026-03-10T14:30:01.000Z",
    "user": {
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@company.com"
    }
  }
}
```

**Response (partial success):**
```json
{
  "success": true,
  "data": {
    "status": "COMPLETED_WITH_ERRORS",
    "totalRows": 5,
    "successCount": 3,
    "errorCount": 2,
    "errors": [
      { "row": 3, "message": "Row 3: \"displayName\" is required" },
      { "row": 5, "message": "Customer \"Acme Corp\" already exists" }
    ]
  }
}
```

**Import job statuses:**
| Status | Meaning |
|--------|---------|
| `PENDING` | Job created, not yet started |
| `PROCESSING` | Currently importing rows |
| `COMPLETED` | All rows imported successfully |
| `COMPLETED_WITH_ERRORS` | Some rows imported, some failed |
| `FAILED` | No rows imported (all failed validation) |

---

## 5. Import History

### List all import jobs
```
GET /data/import/history
GET /data/import/history?entityType=customers
GET /data/import/history?status=COMPLETED_WITH_ERRORS
GET /data/import/history?page=2&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-...",
        "entityType": "customers",
        "status": "COMPLETED",
        "fileName": "customers-batch.csv",
        "duplicateStrategy": "skip",
        "totalRows": 50,
        "successCount": 48,
        "errorCount": 2,
        "errors": [
          { "row": 12, "message": "Row 12: \"displayName\" is required" },
          { "row": 35, "message": "Customer \"Acme Corp\" already exists" }
        ],
        "createdAt": "2026-03-10T14:30:00.000Z",
        "completedAt": "2026-03-10T14:30:05.000Z",
        "user": {
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@company.com"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### Get single import job
```
GET /data/import/history/:id
```

### Delete import job
```
DELETE /data/import/history/:id
```

---

## 6. Export Data

```
GET /data/export/customers
GET /data/export/vendors
GET /data/export/products
GET /data/export/accounts
GET /data/export/invoices
GET /data/export/bills
GET /data/export/expenses
GET /data/export/journal-entries
```

**Query parameters for transactional entities:**
| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO date | Filter from this date |
| `endDate` | ISO date | Filter up to this date |
| `status` | string | Filter by status (e.g., `SENT`, `PAID`) |

**Examples:**
```
GET /data/export/invoices?startDate=2026-01-01&endDate=2026-03-31
GET /data/export/invoices?status=PAID
GET /data/export/bills?startDate=2026-01-01&status=RECEIVED
GET /data/export/customers    (no date filter, exports all active)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "csv": "invoiceNumber,status,customerName,invoiceDate,dueDate,subtotal,taxAmount,totalAmount,amountDue,currencyCode\nINV-0001,SENT,Acme Corp,2026-01-15,2026-02-14,1000,80,1080,1080,USD\n",
    "fileName": "invoices-export-2026-03-10.csv",
    "rowCount": 25
  }
}
```

**Frontend download:**
```javascript
const blob = new Blob([response.data.csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = response.data.fileName;
a.click();
URL.revokeObjectURL(url);
```

---

## Entity-Specific CSV Columns

### Customers (import + export)
```
displayName*, customerType, companyName, firstName, lastName, email, phone,
billingAddressLine1, billingAddressLine2, billingCity, billingState, billingPostalCode, billingCountry,
shippingAddressLine1, shippingCity, shippingState, shippingPostalCode, shippingCountry,
taxNumber, taxExempt, paymentTerms, notes
```

### Vendors (import + export)
```
displayName*, vendorType, companyName, firstName, lastName, email, phone,
addressLine1, addressLine2, city, state, postalCode, country,
taxNumber, track1099, paymentTerms, notes
```

### Products (import + export)
```
name*, type*, sku, barcode, salesDescription, purchaseDescription,
salesPrice, purchaseCost, taxable, trackInventory, quantityOnHand, reorderPoint
```

### Accounts (import + export)
```
accountNumber, name*, accountType*, detailType*, description
```
Note: `normalBalance` is auto-derived from `accountType` on import.

### Invoices (export only)
```
invoiceNumber, status, customerName, invoiceDate, dueDate,
subtotal, taxAmount, totalAmount, amountDue, currencyCode
```

### Bills (export only)
```
billNumber, status, vendorName, billDate, dueDate,
subtotal, taxAmount, totalAmount, amountDue, currencyCode
```

### Expenses (export only)
```
expenseNumber, status, vendorName, expenseDate, amount,
paymentMethod, description, currencyCode
```

### Journal Entries (export only)
```
entryNumber, status, type, entryDate, description,
totalDebits, totalCredits, currencyCode
```

`*` = required field

---

## Validation Rules

### customerType / vendorType
Must be `"Business"` or `"Individual"` (case-sensitive).

### Product type
Must be one of: `INVENTORY`, `NON_INVENTORY`, `SERVICE`, `BUNDLE`.

### Account accountType
Must be one of: `Bank`, `Accounts Receivable`, `Other Current Assets`, `Fixed Assets`, `Accounts Payable`, `Other Current Liabilities`, `Long Term Liabilities`, `Equity`, `Income`, `Other Income`, `Cost of Goods Sold`, `Expenses`, `Other Expense`.

### Boolean fields
Accepted values: `true`/`false`, `yes`/`no`, `1`/`0` (case-insensitive).

### Number fields
Must be valid numbers (integers or decimals).

### Date fields
Must be valid date strings (e.g., `2026-01-15`, `01/15/2026`).

---

## Recommended Frontend Flow

### Import Wizard
1. **Select entity type** — Use `/data/export/supported-entities` to show options
2. **Download template** — `GET /data/templates/:entityType`
3. **Upload CSV** — User fills template and uploads file
4. **Read file** — `FileReader.readAsText()` to get CSV string
5. **Validate** — `POST /data/import/:entityType/validate` (dry run)
6. **Show preview** — Display valid/invalid counts and error list
7. **Import** — `POST /data/import/:entityType` with chosen `duplicateStrategy`
8. **Show results** — Display success/error counts from response

### Export Page
1. **Select entity type** — Use `/data/export/supported-entities`
2. **Optional filters** — Date range and status for transactional entities
3. **Export** — `GET /data/export/:entityType?startDate=...&endDate=...`
4. **Download** — Create Blob from `data.csv` and trigger download

### Import History
1. **List** — `GET /data/import/history` with pagination
2. **Filter** — By entity type or status
3. **View details** — Click job to see error list
4. **Delete** — Remove old import records

---

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Entity type does not support import | Invalid entityType in URL |
| 400 | CSV file contains no data rows | Empty CSV or only header |
| 400 | Entity type does not support export | Invalid entityType for export |
| 404 | Import job not found | Invalid job ID or wrong company |
| 403 | Forbidden | Missing `data:import` or `data:export` permission |
