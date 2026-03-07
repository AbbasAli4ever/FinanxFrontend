"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import recurringService from "@/services/recurringService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type {
  TemplatesResponse,
  UpcomingResponse,
  AnyUpcomingItem,
  ProcessResult,
  RecurringType,
} from "@/types/recurring";

import TemplatesTable from "./TemplatesTable";
import UpcomingTable from "./UpcomingTable";
import EditSettingsModal from "./EditSettingsModal";

type TabKey = "upcoming" | "templates";
type TypeFilter = "all" | "invoice" | "bill" | "expense" | "journal-entry";

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "invoice", label: "Invoices" },
  { key: "bill", label: "Bills" },
  { key: "expense", label: "Expenses" },
  { key: "journal-entry", label: "Journal Entries" },
];

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

// ── Stat card ─────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  bg?: string;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color = "text-gray-900 dark:text-white", bg = "bg-gray-50 dark:bg-gray-800/40" }) => (
  <div className={`flex flex-col gap-1 rounded-2xl border border-transparent p-4 ${bg}`}>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
  </div>
);

// ── Confirm Process Modal ─────────────────────────────────────
interface ProcessModalProps {
  isOpen: boolean;
  loading: boolean;
  result: ProcessResult | null;
  onConfirm: () => void;
  onClose: () => void;
}

const ProcessModal: React.FC<ProcessModalProps> = ({ isOpen, loading, result, onConfirm, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {result ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Processing Complete</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {result.totalProcessed === 0
                ? "No overdue items to process."
                : `Processed ${result.totalProcessed} overdue recurring item${result.totalProcessed !== 1 ? "s" : ""}.`}
            </p>
            {result.totalProcessed > 0 && (
              <div className="mt-4 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                {result.invoicesProcessed > 0 && <p>• {result.invoicesProcessed} Invoice{result.invoicesProcessed !== 1 ? "s" : ""} cloned</p>}
                {result.billsProcessed > 0 && <p>• {result.billsProcessed} Bill{result.billsProcessed !== 1 ? "s" : ""} cloned</p>}
                {result.expensesProcessed > 0 && <p>• {result.expensesProcessed} Expense{result.expensesProcessed !== 1 ? "s" : ""} cloned</p>}
              </div>
            )}
            <Button size="sm" className="mt-4 w-full" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning-600">
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Process Overdue Items</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This will create DRAFT clones for all overdue recurring documents. The cron job runs daily at 2AM — use this to process manually.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={onConfirm} disabled={loading}>
                {loading ? "Processing..." : "Process Now"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Pause/Resume Confirm ──────────────────────────────────────
interface ActionConfirmProps {
  isOpen: boolean;
  item: AnyUpcomingItem | null;
  action: "pause" | "resume";
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function getDocNumber(item: AnyUpcomingItem): string {
  switch (item.type) {
    case "invoice": return item.invoiceNumber;
    case "bill": return item.billNumber;
    case "expense": return item.expenseNumber;
    case "journal-entry": return item.entryNumber;
  }
}

const ActionConfirm: React.FC<ActionConfirmProps> = ({ isOpen, item, action, loading, onConfirm, onClose }) => {
  if (!isOpen || !item) return null;
  const isPause = action === "pause";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isPause ? "bg-warning-50 dark:bg-warning-900/20" : "bg-success-50 dark:bg-success-900/20"}`}>
          {isPause ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-warning-600">
              <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-success-600">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
          {action} Recurring {item.type.replace("-", " ")}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isPause
            ? `Recurring will be paused for ${getDocNumber(item)}. It won't generate new documents until resumed.`
            : `Recurring will be resumed for ${getDocNumber(item)}. The next date will be recalculated if needed.`}
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? (isPause ? "Pausing..." : "Resuming...") : (isPause ? "Pause" : "Resume")}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const RecurringDashboardPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [daysAhead, setDaysAhead] = useState(30);

  const [templates, setTemplates] = useState<TemplatesResponse | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingResponse | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [pageError, setPageError] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  // Process modal
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);

  // Edit settings modal
  const [editItem, setEditItem] = useState<AnyUpcomingItem | null>(null);

  // Pause/Resume
  const [actionItem, setActionItem] = useState<AnyUpcomingItem | null>(null);
  const [actionType, setActionType] = useState<"pause" | "resume">("pause");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch functions ─────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    setLoadingTemplates(true);
    setPageError("");
    try {
      const data = await recurringService.getTemplates(token);
      setTemplates(data);
    } catch (err) {
      setPageError(formatApiErrorMessage(err));
    } finally {
      setLoadingTemplates(false);
    }
  }, [token]);

  const fetchUpcoming = useCallback(async () => {
    if (!token) return;
    setLoadingUpcoming(true);
    try {
      const data = await recurringService.getUpcoming(
        { daysAhead, type: typeFilter === "all" ? undefined : typeFilter },
        token
      );
      setUpcoming(data);
    } catch (err) {
      setPageError(formatApiErrorMessage(err));
    } finally {
      setLoadingUpcoming(false);
    }
  }, [token, daysAhead, typeFilter]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTemplates();
      fetchUpcoming();
    }
  }, [isAuthenticated, token, fetchTemplates, fetchUpcoming]);

  // ── Stats from templates ────────────────────────────────────
  const totalTemplates = templates
    ? (templates.invoices?.length ?? 0) +
      (templates.bills?.length ?? 0) +
      (templates.expenses?.length ?? 0) +
      (templates.journalEntries?.length ?? 0)
    : 0;

  const totalUpcoming = upcoming
    ? (upcoming.invoices?.length ?? 0) +
      (upcoming.bills?.length ?? 0) +
      (upcoming.expenses?.length ?? 0) +
      (upcoming.journalEntries?.length ?? 0)
    : 0;

  const overdueCount = upcoming
    ? [
        ...(upcoming.invoices ?? []),
        ...(upcoming.bills ?? []),
        ...(upcoming.expenses ?? []),
        ...(upcoming.journalEntries ?? []),
      ].filter((i) => new Date(i.nextRecurringDate) < new Date()).length
    : 0;

  // ── Handlers ───────────────────────────────────────────────
  const handleProcess = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const result = await recurringService.processOverdue(token);
      setProcessResult(result);
      fetchTemplates();
      fetchUpcoming();
    } catch (err) {
      setShowProcessModal(false);
      setAlert({ variant: "error", message: formatApiErrorMessage(err) });
    } finally {
      setProcessing(false);
    }
  };

  const handlePauseConfirm = async () => {
    if (!token || !actionItem) return;
    setActionLoading(true);
    try {
      await recurringService.pause(actionItem.type as RecurringType, actionItem.id, token);
      setAlert({ variant: "success", message: "Recurring paused successfully." });
      setActionItem(null);
      fetchTemplates();
      fetchUpcoming();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiErrorMessage(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeConfirm = async () => {
    if (!token || !actionItem) return;
    setActionLoading(true);
    try {
      const result = await recurringService.resume(actionItem.type as RecurringType, actionItem.id, token);
      setAlert({
        variant: "success",
        message: `Resumed. Next date: ${result.nextRecurringDate ? new Date(result.nextRecurringDate).toLocaleDateString() : "recalculated"}.`,
      });
      setActionItem(null);
      fetchTemplates();
      fetchUpcoming();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiErrorMessage(err) });
    } finally {
      setActionLoading(false);
    }
  };

  // auto-dismiss alert
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // ── Loading / auth guards ───────────────────────────────────
  if (!isReady || permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Sign in to view recurring transactions.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Automation</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-gray-900 dark:text-white">
            Recurring Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Automate invoices, bills, expenses, and journal entries on a schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchTemplates(); fetchUpcoming(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowProcessModal(true); setProcessResult(null); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Process Overdue
          </Button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.variant === "success" ? "Success" : "Error"}
          message={alert.message}
        />
      )}
      {pageError && <Alert variant="error" title="Error" message={pageError} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Templates"
          value={totalTemplates}
          sub="Active recurring schedules"
          bg="bg-brand-50 dark:bg-brand-900/20"
          color="text-brand-700 dark:text-brand-300"
        />
        <StatCard
          label={`Due (${daysAhead}d)`}
          value={totalUpcoming}
          sub={`Next ${daysAhead} days`}
          bg="bg-blue-50 dark:bg-blue-900/20"
          color="text-blue-700 dark:text-blue-300"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          sub="Past due date"
          bg={overdueCount > 0 ? "bg-error-50 dark:bg-error-900/20" : "bg-gray-50 dark:bg-gray-800/40"}
          color={overdueCount > 0 ? "text-error-700 dark:text-error-300" : "text-gray-700 dark:text-gray-300"}
        />
        <StatCard
          label="By Type"
          value={[
            templates?.invoices?.length ? `${templates.invoices.length} inv` : "",
            templates?.bills?.length ? `${templates.bills.length} bill` : "",
            templates?.expenses?.length ? `${templates.expenses.length} exp` : "",
          ].filter(Boolean).join(" · ") || "—"}
          sub="Breakdown"
          bg="bg-gray-50 dark:bg-gray-800/40"
          color="text-gray-900 dark:text-white"
        />
      </div>

      {/* Auto-process info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-900/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-blue-500" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
        </svg>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Auto-processing:</strong> A cron job runs daily at 2:00 AM and clones overdue recurring items automatically.
          Use <strong>Process Overdue</strong> to trigger this on-demand.
        </p>
      </div>

      {/* Tabs + Filters */}
      <div className="space-y-3">
        {/* Tab bar */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03] sm:w-fit">
          {([ { key: "upcoming", label: "Upcoming", count: totalUpcoming }, { key: "templates", label: "All Templates", count: totalTemplates } ] as { key: TabKey; label: string; count: number }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-800/50 dark:text-brand-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter pills */}
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  typeFilter === f.key
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Days ahead (only for upcoming tab) */}
          {activeTab === "upcoming" && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gray-500 dark:text-gray-400">Look ahead:</span>
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="h-8 appearance-none rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-none"
              >
                {DAYS_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === "upcoming" ? (
        <UpcomingTable
          data={upcoming}
          loading={loadingUpcoming}
          daysAhead={daysAhead}
          filterType={typeFilter}
          onEditSettings={(item) => setEditItem(item)}
        />
      ) : (
        <TemplatesTable
          data={templates}
          loading={loadingTemplates}
          filterType={typeFilter}
          onPause={(item) => { setActionItem(item); setActionType("pause"); }}
          onResume={(item) => { setActionItem(item); setActionType("resume"); }}
          onEditSettings={(item) => setEditItem(item)}
        />
      )}

      {/* Modals */}
      <EditSettingsModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onUpdated={() => { fetchTemplates(); fetchUpcoming(); setAlert({ variant: "success", message: "Settings updated successfully." }); }}
        item={editItem}
      />

      <ProcessModal
        isOpen={showProcessModal}
        loading={processing}
        result={processResult}
        onConfirm={handleProcess}
        onClose={() => { setShowProcessModal(false); setProcessResult(null); }}
      />

      <ActionConfirm
        isOpen={!!actionItem}
        item={actionItem}
        action={actionType}
        loading={actionLoading}
        onConfirm={actionType === "pause" ? handlePauseConfirm : handleResumeConfirm}
        onClose={() => setActionItem(null)}
      />
    </div>
  );
};

export default RecurringDashboardPage;
