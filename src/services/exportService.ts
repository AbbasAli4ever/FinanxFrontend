import { API_BASE_URL } from "./apiClient";

export type ExportEntityType =
  | "invoice"
  | "bill"
  | "expense"
  | "estimate"
  | "purchase-order"
  | "sales-order"
  | "credit-note"
  | "debit-note"
  | "pay-run"
  | "journal-entry";

export type ExportFormat = "pdf" | "excel";

export interface BulkExportFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ─── Single Entity Export ──────────────────────────────────────────────────────

async function downloadSingle(
  entityType: ExportEntityType,
  id: string,
  format: ExportFormat,
  fileName: string,
  token: string
): Promise<void> {
  const ext = format === "pdf" ? "pdf" : "xlsx";
  const endpoint = format === "pdf" ? "pdf" : "excel";

  const res = await fetch(
    `${API_BASE_URL}/exports/${entityType}/${id}/${endpoint}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "Export failed");
    throw new Error(text || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─── Bulk Export ───────────────────────────────────────────────────────────────

async function downloadBulk(
  entityType: ExportEntityType,
  filters: BulkExportFilters = {},
  token: string
): Promise<void> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.limit) params.set("limit", filters.limit.toString());

  const qs = params.toString();
  const res = await fetch(
    `${API_BASE_URL}/exports/${entityType}/bulk/excel${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "Export failed");
    throw new Error(text || `Bulk export failed (${res.status})`);
  }

  const blob = await res.blob();
  const label = entityType.replace(/-/g, "_");
  const date = new Date().toISOString().slice(0, 10);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${label}s_export_${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

const exportService = { downloadSingle, downloadBulk };
export default exportService;
