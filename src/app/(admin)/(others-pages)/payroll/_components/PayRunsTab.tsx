"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import payrollService from "@/services/payrollService";
import type { PayRunListItem, PayRunStatus, PayFrequency } from "@/types/payroll";
import AppDatePicker from "@/components/form/AppDatePicker";
import CreatePayRunModal from "./CreatePayRunModal";
import PayRunDetailModal from "./PayRunDetailModal";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const statusBadgeColor: Record<PayRunStatus, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  DRAFT: "light",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  POSTED: "primary",
  PAID: "success",
  VOID: "dark",
};

const statusLabel: Record<PayRunStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  POSTED: "Posted",
  PAID: "Paid",
  VOID: "Void",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFrequency(freq: PayFrequency): string {
  const map: Record<PayFrequency, string> = {
    WEEKLY: "Weekly",
    BIWEEKLY: "Bi-Weekly",
    SEMIMONTHLY: "Semi-Monthly",
    MONTHLY: "Monthly",
  };
  return map[freq] || freq;
}

const PayRunsTab: React.FC = () => {
  const { token } = useAuth();
  const [payRuns, setPayRuns] = useState<PayRunListItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [filters, setFilters] = useState<{ status: string; payFrequency: string; startDate: string; endDate: string }>({ status: "", payFrequency: "", startDate: "", endDate: "" });

  const createModal = useModal();
  const detailModal = useModal();
  const [selectedPayRunId, setSelectedPayRunId] = useState<string | null>(null);

  const fetchPayRuns = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await payrollService.getPayRuns(
        {
          status: (filters.status as PayRunStatus) || undefined,
          payFrequency: (filters.payFrequency as PayFrequency) || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        },
        token
      );
      setPayRuns(data.items ?? []);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        setAlert({ variant: "warning", title: "Access Denied", message: getPermissionDeniedMessage(error) });
      } else {
        setAlert({ variant: "error", title: "Unable to load pay runs", message: formatApiErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters, pagination.page, pagination.limit]);

  useEffect(() => { fetchPayRuns(); }, [fetchPayRuns]);

  const handleView = (pr: PayRunListItem) => {
    setSelectedPayRunId(pr.id);
    detailModal.openModal();
  };

  const handleCreated = () => {
    setAlert({ variant: "success", title: "Pay Run Created", message: "The pay run has been created as a draft." });
    fetchPayRuns();
  };

  const handleUpdated = () => {
    setAlert({ variant: "success", title: "Pay Run Updated", message: "The pay run has been updated." });
    fetchPayRuns();
  };

  const handleLifecycleAction = (action: string) => {
    const messages: Record<string, string> = {
      submitted: "The pay run has been submitted for approval.",
      approved: "The pay run has been approved.",
      rejected: "The pay run has been rejected and moved back to draft.",
      posted: "The pay run has been posted and a journal entry was created.",
      paid: "The pay run has been marked as paid.",
      voided: "The pay run has been voided.",
      deleted: "The pay run has been deleted.",
    };
    setAlert({ variant: "success", title: "Pay Run Updated", message: messages[action] || "Done." });
    fetchPayRuns();
  };

  return (
    <div className="space-y-5">
      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`${selectClasses} min-w-[160px] ${filters.status ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="POSTED">Posted</option>
              <option value="PAID">Paid</option>
              <option value="VOID">Void</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>

          {/* Frequency filter */}
          <div className="relative">
            <select
              value={filters.payFrequency}
              onChange={(e) => { setFilters((p) => ({ ...p, payFrequency: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`${selectClasses} min-w-[150px] ${filters.payFrequency ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
            >
              <option value="">All Frequencies</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-Weekly</option>
              <option value="SEMIMONTHLY">Semi-Monthly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
          <AppDatePicker
            value={filters.startDate}
            onChange={(val) => {
              setFilters((p) => ({ ...p, startDate: val }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="From date"
            maxToday
            max={filters.endDate || undefined}
            className="w-36"
          />
          <span className="text-gray-400 text-sm select-none self-center">—</span>
          <AppDatePicker
            value={filters.endDate}
            onChange={(val) => {
              setFilters((p) => ({ ...p, endDate: val }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="To date"
            min={filters.startDate || undefined}
            maxToday
            className="w-36"
          />
        </div>

        <Button size="sm" onClick={createModal.openModal}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z" fill="currentColor" /></svg>
          New Pay Run
        </Button>
      </div>

      {/* Status pipeline cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(["DRAFT", "PENDING_APPROVAL", "APPROVED", "POSTED", "PAID", "VOID"] as PayRunStatus[]).map((s) => {
          const count = payRuns.filter((pr) => pr.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilters((p) => ({ ...p, status: p.status === s ? "" : s }))}
              className={`rounded-xl border p-3 text-left transition-all duration-150 ${
                filters.status === s
                  ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{statusLabel[s]}</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading pay runs...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-800">
                    {["Pay Period", "Pay Date", "Frequency", "Employees", "Gross Pay", "Net Pay", "Status", "Actions"].map((h) => (
                      <TableCell key={h} isHeader className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${["Gross Pay", "Net Pay", "Employees", "Actions"].includes(h) ? "text-right" : "text-left"}`}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payRuns.map((pr) => (
                    <TableRow key={pr.id} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-4 py-3">
                        <button onClick={() => handleView(pr)} className="text-left">
                          <p className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-400">
                            {formatDate(pr.payPeriodStart)} – {formatDate(pr.payPeriodEnd)}
                          </p>
                          {pr.notes && <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{pr.notes}</p>}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(pr.payDate)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatFrequency(pr.payFrequency)}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{pr.employeeCount}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(pr.totalGrossPay)}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(pr.totalNetPay)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={statusBadgeColor[pr.status]} variant="light">{statusLabel[pr.status]}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleView(pr)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                          title="View Pay Run"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {payRuns.length === 0 && (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">No pay runs found.</p>
                <button onClick={createModal.openModal} className="mt-2 text-sm text-brand-500 hover:text-brand-600 hover:underline">Create your first pay run</button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreatePayRunModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
      />

      <PayRunDetailModal
        isOpen={detailModal.isOpen}
        payRunId={selectedPayRunId}
        onClose={() => { detailModal.closeModal(); setSelectedPayRunId(null); }}
        onUpdated={handleUpdated}
        onAction={handleLifecycleAction}
      />
    </div>
  );
};

export default PayRunsTab;
