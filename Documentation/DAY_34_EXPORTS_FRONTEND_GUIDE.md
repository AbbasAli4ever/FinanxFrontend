# Day 34 — PDF & Excel Export — Frontend Integration Guide

## Base URL
```
/api/v1/exports
```

All endpoints require `Authorization: Bearer <accessToken>` and `data:export` permission.

---

## Supported Entity Types

```typescript
type ExportEntityType =
  | 'invoice'
  | 'bill'
  | 'expense'
  | 'estimate'
  | 'purchase-order'
  | 'sales-order'
  | 'credit-note'
  | 'debit-note'
  | 'pay-run'
  | 'journal-entry';
```

---

## 1. Download PDF (Single Entity)

### `GET /api/v1/exports/:entityType/:id/pdf`

Returns a binary PDF file. Opens or downloads depending on how you handle it.

```typescript
// Option 1: Open in new tab
window.open(
  `${API_BASE}/exports/invoice/${invoiceId}/pdf`,
  '_blank'
);

// Option 2: Programmatic download with auth header
const res = await api.get(`/exports/invoice/${invoiceId}/pdf`, {
  responseType: 'blob',
});
const url = window.URL.createObjectURL(res.data);
const a = document.createElement('a');
a.href = url;
a.download = `Invoice_${invoiceNumber}.pdf`;
a.click();
window.URL.revokeObjectURL(url);
```

**Note:** Option 1 won't work if your API requires auth headers (most SPAs). Use Option 2 for authenticated downloads.

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Invoice_INV-0001.pdf"
```

---

## 2. Download Excel (Single Entity)

### `GET /api/v1/exports/:entityType/:id/excel`

Returns an .xlsx file with two sheets: Summary + Line Items.

```typescript
const res = await api.get(`/exports/invoice/${invoiceId}/excel`, {
  responseType: 'blob',
});
const url = window.URL.createObjectURL(res.data);
const a = document.createElement('a');
a.href = url;
a.download = `Invoice_${invoiceNumber}.xlsx`;
a.click();
window.URL.revokeObjectURL(url);
```

**Response Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Invoice_INV-0001.xlsx"
```

---

## 3. Bulk Export Excel

### `GET /api/v1/exports/:entityType/bulk/excel`

Exports multiple entities as a single .xlsx file. Supports filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | - | Filter by status (e.g., `SENT`, `PAID`) |
| `startDate` | string | - | Filter start date (YYYY-MM-DD) |
| `endDate` | string | - | Filter end date (YYYY-MM-DD) |
| `page` | number | 1 | Page number |
| `limit` | number | 100 | Items per page (max 500) |

```typescript
const res = await api.get('/exports/invoice/bulk/excel', {
  params: {
    status: 'SENT',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    limit: 200,
  },
  responseType: 'blob',
});

const url = window.URL.createObjectURL(res.data);
const a = document.createElement('a');
a.href = url;
a.download = `Invoices_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
a.click();
window.URL.revokeObjectURL(url);
```

**Excel output has 2 sheets:**
- Sheet 1: Summary list (one row per entity)
- Sheet 2: All line items combined (with parent document number)

---

## Frontend Component Suggestions

### Download Button Helper

```typescript
async function downloadExport(
  entityType: ExportEntityType,
  id: string,
  format: 'pdf' | 'excel',
  fileName: string,
) {
  const ext = format === 'pdf' ? 'pdf' : 'xlsx';
  const res = await api.get(`/exports/${entityType}/${id}/${format}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.${ext}`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### Bulk Export Helper

```typescript
async function bulkExport(
  entityType: ExportEntityType,
  filters?: { status?: string; startDate?: string; endDate?: string; limit?: number },
) {
  const res = await api.get(`/exports/${entityType}/bulk/excel`, {
    params: filters,
    responseType: 'blob',
  });
  const label = entityType.replace(/-/g, '_');
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${label}s_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### Where to Add Export Buttons

**Detail pages** (Invoice Detail, Bill Detail, etc.):
```tsx
<DropdownMenu>
  <DropdownItem onClick={() => downloadExport('invoice', invoice.id, 'pdf', `Invoice_${invoice.invoiceNumber}`)}>
    Download PDF
  </DropdownItem>
  <DropdownItem onClick={() => downloadExport('invoice', invoice.id, 'excel', `Invoice_${invoice.invoiceNumber}`)}>
    Download Excel
  </DropdownItem>
</DropdownMenu>
```

**List pages** (Invoice List, Bill List, etc.):
```tsx
<Button onClick={() => bulkExport('invoice', { status: currentFilter, limit: 500 })}>
  Export to Excel
</Button>
```

---

## Errors

| Status | Message | Cause |
|--------|---------|-------|
| 400 | `Unsupported entity type "..."` | Invalid entityType param |
| 403 | `Forbidden` | User lacks `data:export` permission |
| 404 | `Invoice not found` | Entity doesn't exist or wrong company |

---

## Permission

Only one permission controls all export endpoints:

| Permission | Code | Who Has It |
|------------|------|-----------|
| Export Data | `data:export` | Admin, Standard, Limited, Reports-Only |

Check with:
```typescript
const canExport = permissions.includes('data:export');
```

---

## API Response

These endpoints return **binary files**, not JSON. Use `responseType: 'blob'` in your HTTP client. No `{ success, message, data }` wrapper.
