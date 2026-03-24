# Day 33 — Document/Attachment Management — Frontend Integration Guide

## Base URL
```
/api/v1/documents
```

All endpoints require `Authorization: Bearer <accessToken>`.

---

## TypeScript Interfaces

```typescript
interface Attachment {
  id: string;
  companyId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number; // bytes
  filePath: string;
  description: string | null;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

type AttachmentEntityType =
  | 'INVOICE'
  | 'BILL'
  | 'EXPENSE'
  | 'JOURNAL_ENTRY'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'ESTIMATE'
  | 'PURCHASE_ORDER'
  | 'SALES_ORDER'
  | 'CUSTOMER'
  | 'VENDOR'
  | 'PRODUCT'
  | 'PROJECT'
  | 'EMPLOYEE'
  | 'PAY_RUN'
  | 'BANK_TRANSACTION';

interface AttachmentListResponse {
  data: Attachment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  usedPercentage: number;
  fileCount: number;
}
```

---

## 1. Upload File

### `POST /api/v1/documents/upload`

**Permission**: `document:upload`

**Content-Type**: `multipart/form-data`

**Form fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `entityType` | string | Yes | One of the 16 entity types above |
| `entityId` | string (UUID) | Yes | ID of the entity to attach to |
| `description` | string | No | Optional description (max 500 chars) |

```typescript
const formData = new FormData();
formData.append('file', selectedFile);
formData.append('entityType', 'INVOICE');
formData.append('entityId', invoiceId);
formData.append('description', 'Receipt scan');

const res = await api.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
// res.data.data → Attachment object
```

**Allowed file types**: PDF, JPEG, PNG, WEBP, XLSX, XLS, CSV, DOCX, DOC

**Max file size**: 10MB

**Errors:**
- `400 "No file provided"` — no file in form data
- `400 "File type ... is not allowed"` — unsupported MIME type
- `400 "File size ... exceeds the maximum"` — over 10MB
- `400 "Storage quota exceeded"` — company hit 1GB limit
- `404 "INVOICE not found"` — entityId doesn't exist or wrong company

---

## 2. List Attachments for Entity

### `GET /api/v1/documents?entityType=INVOICE&entityId=uuid&page=1&limit=20`

**Permission**: `document:view`

**Query params:**
| Param | Type | Required | Default |
|-------|------|----------|---------|
| `entityType` | AttachmentEntityType | Yes | — |
| `entityId` | UUID | Yes | — |
| `page` | number | No | 1 |
| `limit` | number | No | 20 |

```typescript
const res = await api.get('/documents', {
  params: { entityType: 'INVOICE', entityId: invoiceId },
});
// res.data.data → { data: Attachment[], total, page, limit, totalPages }
```

---

## 3. Get Storage Usage

### `GET /api/v1/documents/storage-usage`

**Permission**: `document:view`

```typescript
const res = await api.get('/documents/storage-usage');
// res.data.data → { usedBytes, quotaBytes, remainingBytes, usedPercentage, fileCount }
```

**Use this to:**
- Show a storage usage bar in company settings
- Warn users approaching their quota

---

## 4. Get Single Attachment

### `GET /api/v1/documents/:id`

**Permission**: `document:view`

```typescript
const res = await api.get(`/documents/${attachmentId}`);
// res.data.data → Attachment object
```

---

## 5. Download File

### `GET /api/v1/documents/:id/download`

**Permission**: `document:view`

Returns the raw file with proper `Content-Type` and `Content-Disposition` headers.

```typescript
// Option 1: Open in new tab (for PDFs/images)
window.open(`${API_BASE}/documents/${attachmentId}/download`, '_blank');

// Option 2: Programmatic download
const res = await api.get(`/documents/${attachmentId}/download`, {
  responseType: 'blob',
});
const url = window.URL.createObjectURL(res.data);
const a = document.createElement('a');
a.href = url;
a.download = attachment.originalName;
a.click();
window.URL.revokeObjectURL(url);
```

---

## 6. Delete Attachment

### `DELETE /api/v1/documents/:id`

**Permission**: `document:delete`

```typescript
await api.delete(`/documents/${attachmentId}`);
// res.data → { success: true, message: "Attachment deleted successfully", data: null }
```

---

## Frontend Component Suggestions

### Attachments Panel (reusable)

Use this on Invoice Detail, Bill Detail, Expense Detail, etc.

```tsx
interface AttachmentsPanelProps {
  entityType: AttachmentEntityType;
  entityId: string;
}

function AttachmentsPanel({ entityType, entityId }: AttachmentsPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const permissions = usePermissions();

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const fetchAttachments = async () => {
    const res = await api.get('/documents', {
      params: { entityType, entityId },
    });
    setAttachments(res.data.data.data);
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    await api.post('/documents/upload', formData);
    fetchAttachments(); // refresh list
  };

  return (
    <div>
      <h3>Attachments ({attachments.length})</h3>

      {permissions.includes('document:upload') && (
        <FileDropzone onDrop={handleUpload} />
      )}

      {attachments.map((att) => (
        <AttachmentItem
          key={att.id}
          attachment={att}
          onDownload={() => window.open(`/api/v1/documents/${att.id}/download`)}
          onDelete={permissions.includes('document:delete') ? async () => {
            await api.delete(`/documents/${att.id}`);
            fetchAttachments();
          } : undefined}
        />
      ))}
    </div>
  );
}
```

### Where to Add the Panel

Add `<AttachmentsPanel entityType="INVOICE" entityId={invoice.id} />` to:
- Invoice detail page
- Bill detail page
- Expense detail page
- Journal Entry detail page
- Credit/Debit Note detail pages
- Estimate detail page
- Purchase/Sales Order detail pages
- Customer/Vendor detail pages
- Product detail page
- Project detail page
- Employee detail page

### File Size Display Helper

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### File Icon Helper

```typescript
function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'file-pdf';
  if (mimeType.startsWith('image/')) return 'file-image';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'file-spreadsheet';
  if (mimeType.includes('word')) return 'file-text';
  return 'file';
}
```

---

## Permissions Summary

| Permission | Standard | Limited | Reports Only | Time Tracking |
|------------|----------|---------|--------------|---------------|
| `document:view` | Yes | Yes | Yes | Yes |
| `document:upload` | Yes | Yes | No | No |
| `document:delete` | Yes | No | No | No |

Company Admin / Primary Admin has all permissions.

---

## API Response Shape

All endpoints follow the standard shape:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```
