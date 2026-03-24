"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import AppDatePicker from "@/components/form/AppDatePicker";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import dataIOService from "@/services/dataIOService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { SupportedEntity, ExportEntityType, ExportFilters } from "@/types/dataIO";
import { TRANSACTIONAL_EXPORT_ENTITIES } from "@/types/dataIO";

interface ExportPanelProps {
  exportableEntities: SupportedEntity[];
  token: string;
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function entityLabel(type: string): string {
  return type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function triggerCsvDownload(csvContent: string, fileName: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const ExportPanel: React.FC<ExportPanelProps> = ({ exportableEntities, token }) => {
  const [selectedEntity, setSelectedEntity] = useState<ExportEntityType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState<{ rowCount: number; fileName: string } | null>(null);

  const isTransactional = TRANSACTIONAL_EXPORT_ENTITIES.includes(selectedEntity as ExportEntityType);

  // Reset transactional filters when switching to non-transactional entity
  useEffect(() => {
    if (!isTransactional) {
      setStartDate("");
      setEndDate("");
      setStatusFilter("");
    }
  }, [isTransactional]);

  const handleExport = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    setError("");
    setLastExport(null);
    try {
      const filters: ExportFilters = {};
      if (isTransactional) {
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (statusFilter) filters.status = statusFilter;
      }
      const result = await dataIOService.exportData(selectedEntity, filters, token);
      triggerCsvDownload(result.csv, result.fileName);
      setLastExport({ rowCount: result.rowCount, fileName: result.fileName });
    } catch (e) {
      setError(formatApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: Record<string, string[]> = {
    invoices: ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"],
    bills: ["DRAFT", "RECEIVED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"],
    expenses: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PAID", "REIMBURSED", "VOID"],
    "journal-entries": ["DRAFT", "POSTED", "VOID"],
  };

  const currentStatusOptions = statusOptions[selectedEntity] ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download your financial data as a CSV file.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Export Failed" message={error} />
        </div>
      )}

      {lastExport && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3 dark:border-success-800 dark:bg-success-900/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-success-600 dark:text-success-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-sm text-success-700 dark:text-success-400">
            Exported <strong>{lastExport.rowCount}</strong> rows — <span className="font-mono">{lastExport.fileName}</span>
          </p>
        </div>
      )}

      <div className="max-w-lg space-y-5">
        {/* Entity Type */}
        <div>
          <Label htmlFor="export-entity">Entity Type</Label>
          <div className="relative mt-1">
            <select
              id="export-entity"
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value as ExportEntityType | "");
                setLastExport(null);
                setError("");
              }}
              className={`${selectClasses} ${selectedEntity ? "text-gray-800 dark:text-white/90" : "text-gray-400"}`}
            >
              <option value="">Select entity to export...</option>
              {exportableEntities.map((e) => (
                <option key={e.entityType} value={e.entityType}>
                  {entityLabel(e.entityType)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>

        {/* Transactional filters */}
        {isTransactional && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <AppDatePicker
                  id="start-date"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  maxToday
                  max={endDate}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <AppDatePicker
                  id="end-date"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  min={startDate}
                  maxToday
                />
              </div>
            </div>

            {currentStatusOptions.length > 0 && (
              <div>
                <Label htmlFor="status-filter">Status Filter (optional)</Label>
                <div className="relative mt-1">
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`${selectClasses} ${statusFilter ? "text-gray-800 dark:text-white/90" : "text-gray-400"}`}
                  >
                    <option value="">All statuses</option>
                    {currentStatusOptions.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* CSV column preview */}
        {selectedEntity && exportableEntities.length > 0 && (() => {
          const entity = exportableEntities.find((e) => e.entityType === selectedEntity);
          if (!entity || entity.fields.length === 0) return null;
          return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                CSV Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entity.fields.map((f) => (
                  <span
                    key={f.csvHeader}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      f.required
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {f.csvHeader}{f.required && " *"}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-400">* required column</p>
            </div>
          );
        })()}

        {/* Export Button */}
        <div className="pt-1">
          <Button
            size="sm"
            disabled={!selectedEntity || loading}
            onClick={handleExport}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Exporting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
