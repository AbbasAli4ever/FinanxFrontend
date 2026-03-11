"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import dataIOService from "@/services/dataIOService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type {
  ImportJobListItem,
  ImportJobListResponse,
  ImportHistoryFilters,
  ImportJobStatus,
} from "@/types/dataIO";
import ImportJobDetailModal from "./ImportJobDetailModal";
import DeleteImportJobModal from "./DeleteImportJobModal";

interface ImportHistoryTableProps {
  token: string;
}

type BadgeColor = "success" | "warning" | "error" | "info" | "light";

const STATUS_BADGE: Record<ImportJobStatus, { color: BadgeColor; label: string }> = {
  COMPLETED: { color: "success", label: "Completed" },
  COMPLETED_WITH_ERRORS: { color: "warning", label: "With Errors" },
  FAILED: { color: "error", label: "Failed" },
  PENDING: { color: "info", label: "Pending" },
  PROCESSING: { color: "info", label: "Processing" },
};

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "customers", label: "Customers" },
  { value: "vendors", label: "Vendors" },
  { value: "products", label: "Products" },
  { value: "accounts", label: "Accounts" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "COMPLETED_WITH_ERRORS", label: "With Errors" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
];

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

function entityLabel(type: string): string {
  return type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({ token }) => {
  const [filters, setFilters] = useState<ImportHistoryFilters>({ page: 1, limit: 20 });
  const [result, setResult] = useState<ImportJobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState<ImportJobListItem | null>(null);
  const [jobToDelete, setJobToDelete] = useState<ImportJobListItem | null>(null);

  const detailModal = useModal();
  const deleteModal = useModal();

  const fetchHistory = useCallback(async (f: ImportHistoryFilters) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await dataIOService.getImportHistory(f, token);
      setResult(data);
    } catch (e) {
      setError(formatApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory(filters);
  }, [fetchHistory, filters]);

  const handleFilterChange = (key: keyof ImportHistoryFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, limit: 20 });
  };

  const handleViewJob = (job: ImportJobListItem) => {
    setSelectedJob(job);
    detailModal.openModal();
  };

  const handleDeleteJob = (job: ImportJobListItem) => {
    setJobToDelete(job);
    deleteModal.openModal();
  };

  const handleDeleted = () => {
    fetchHistory(filters);
  };

  const pagination = result?.pagination;
  const items = result?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={filters.entityType ?? ""}
            onChange={(e) => handleFilterChange("entityType", e.target.value)}
            className={selectClasses}
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </div>

        <div className="relative">
          <select
            value={filters.status ?? ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className={selectClasses}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </div>

        {(filters.entityType || filters.status) && (
          <button
            onClick={handleClearFilters}
            className="h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="animate-pulse space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800">
                <div className="h-4 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 flex-1 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-12 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Entity</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">File</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Rows</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">By</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((job) => {
                  const badge = STATUS_BADGE[job.status] ?? { color: "light" as BadgeColor, label: job.status };
                  return (
                    <TableRow
                      key={job.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{entityLabel(job.entityType)}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="max-w-[180px] truncate font-mono text-xs text-gray-600 dark:text-gray-400">
                          {job.fileName}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge size="sm" color={badge.color} variant="light">{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{job.totalRows}</span>
                          <span className="text-gray-400">/</span>
                          <span className="font-medium text-success-600 dark:text-success-400">{job.successCount}</span>
                          {job.errorCount > 0 && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className="font-medium text-error-600 dark:text-error-400">{job.errorCount}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {fmtDate(job.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {job.user.firstName} {job.user.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            onClick={() => handleViewJob(job)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            title="View details"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                            title="Delete record"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {items.length === 0 && !loading && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="font-medium text-gray-700 dark:text-gray-300">No import history</p>
                <p className="mt-1 text-sm text-gray-400">Your past imports will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ImportJobDetailModal
        isOpen={detailModal.isOpen}
        job={selectedJob}
        token={token}
        onClose={() => {
          detailModal.closeModal();
          setSelectedJob(null);
        }}
      />

      <DeleteImportJobModal
        isOpen={deleteModal.isOpen}
        job={jobToDelete}
        token={token}
        onClose={() => {
          deleteModal.closeModal();
          setJobToDelete(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default ImportHistoryTable;
