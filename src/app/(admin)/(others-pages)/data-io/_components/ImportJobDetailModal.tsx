"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import dataIOService from "@/services/dataIOService";
import type { ImportJobListItem, ImportJobStatus } from "@/types/dataIO";

interface ImportJobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ImportJobListItem | null;
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

function entityLabel(type: string): string {
  return type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ImportJobDetailModal: React.FC<ImportJobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  token,
}) => {
  const [detail, setDetail] = useState<ImportJobListItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !job || !token) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    dataIOService
      .getImportJob(job.id, token)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setDetail(job); }) // Fallback to list item data
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, job, token]);

  const displayJob = detail ?? job;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import Job Details</h2>
            {displayJob && (
              <p className="mt-0.5 font-mono text-sm text-gray-500 dark:text-gray-400">{displayJob.fileName}</p>
            )}
          </div>
          {displayJob && (
            <Badge size="sm" color={STATUS_BADGE[displayJob.status]?.color ?? "light"} variant="light">
              {STATUS_BADGE[displayJob.status]?.label ?? displayJob.status}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        ) : displayJob ? (
          <div className="space-y-5">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entity Type</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{entityLabel(displayJob.entityType)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duplicate Strategy</p>
                <p className="mt-0.5 text-sm font-medium capitalize text-gray-900 dark:text-white">{displayJob.duplicateStrategy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Imported By</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {displayJob.user.firstName} {displayJob.user.lastName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{displayJob.user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{fmtDate(displayJob.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{fmtDate(displayJob.completedAt)}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center dark:border-gray-700 dark:bg-white/[0.03]">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayJob.totalRows}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Rows</p>
              </div>
              <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-center dark:border-success-800 dark:bg-success-900/10">
                <p className="text-2xl font-bold text-success-700 dark:text-success-400">{displayJob.successCount}</p>
                <p className="text-xs text-success-600 dark:text-success-500">Imported</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 text-center ${displayJob.errorCount > 0 ? "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]"}`}>
                <p className={`text-2xl font-bold ${displayJob.errorCount > 0 ? "text-error-700 dark:text-error-400" : "text-gray-400"}`}>{displayJob.errorCount}</p>
                <p className={`text-xs ${displayJob.errorCount > 0 ? "text-error-600 dark:text-error-500" : "text-gray-400"}`}>Errors</p>
              </div>
            </div>

            {/* Error list */}
            {displayJob.errors && displayJob.errors.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Row Errors</p>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  {displayJob.errors.map((err, i) => (
                    <div key={i} className={`flex items-start gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0 dark:border-gray-800 ${i % 2 === 0 ? "bg-error-50/40 dark:bg-error-900/5" : "bg-white dark:bg-transparent"}`}>
                      <span className="shrink-0 rounded bg-error-100 px-1.5 py-0.5 text-[11px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
                        Row {err.row}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{err.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3 dark:border-success-800 dark:bg-success-900/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-600 dark:text-success-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-sm text-success-700 dark:text-success-400">No errors — all rows imported successfully.</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportJobDetailModal;
