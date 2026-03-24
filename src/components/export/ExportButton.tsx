"use client";

import React, { useRef, useState } from "react";
import exportService, { ExportEntityType, BulkExportFilters } from "@/services/exportService";

// ─── Single-entity export dropdown ────────────────────────────────────────────

interface ExportButtonProps {
  entityType: ExportEntityType;
  entityId: string;
  fileName: string; // e.g. "Invoice_INV-0001"
  token: string;
  canExport: boolean;
  size?: "sm" | "md";
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  entityType,
  entityId,
  fileName,
  token,
  canExport,
  size = "sm",
}) => {
  const [open, setOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!canExport) return null;

  const handle = async (format: "pdf" | "excel") => {
    setOpen(false);
    setError(null);
    const setLoading = format === "pdf" ? setLoadingPdf : setLoadingExcel;
    setLoading(true);
    try {
      await exportService.downloadSingle(entityType, entityId, format, fileName, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loadingPdf || loadingExcel;
  const btnH = size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3 text-[13px]";

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        className={`dropdown-toggle inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800 ${btnH}`}
      >
        {isLoading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-gray-400 border-t-transparent" />
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        Export
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Download as</p>
          </div>
          <button
            onClick={() => handle("pdf")}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-100 dark:bg-red-900/30">
              <span className="text-[8px] font-bold text-red-600 dark:text-red-400">PDF</span>
            </div>
            Download PDF
          </button>
          <button
            onClick={() => handle("excel")}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
              <span className="text-[8px] font-bold text-green-600 dark:text-green-400">XLS</span>
            </div>
            Download Excel
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-600 shadow dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-400 z-50">
          {error}
        </p>
      )}
    </div>
  );
};

// ─── Bulk export button (for list pages) ──────────────────────────────────────

interface BulkExportButtonProps {
  entityType: ExportEntityType;
  filters?: BulkExportFilters;
  token: string;
  canExport: boolean;
  label?: string;
}

export const BulkExportButton: React.FC<BulkExportButtonProps> = ({
  entityType,
  filters = {},
  token,
  canExport,
  label = "Export Excel",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canExport) return null;

  const handle = async () => {
    setLoading(true);
    setError(null);
    try {
      await exportService.downloadBulk(entityType, filters, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handle}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {loading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-gray-400 border-t-transparent" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        {loading ? "Exporting…" : label}
      </button>
      {error && (
        <p className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-600 shadow dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-400 z-50">
          {error}
        </p>
      )}
    </div>
  );
};
