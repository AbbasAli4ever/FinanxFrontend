"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import timeEntriesService from "@/services/timeEntriesService";
import projectsService from "@/services/projectsService";
import type { TimeEntry, TimeEntryFilters, TimeEntryStatus } from "@/types/projects";
import type { Project } from "@/types/projects";
import LogTimeModal from "./LogTimeModal";
import RejectModal from "./RejectModal";

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function dateFmt(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function groupByDate(entries: TimeEntry[]): [string, TimeEntry[]][] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
}

// ── Status badge ─────────────────────────────────────────────────
const TE_STATUS: Record<TimeEntryStatus, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT:     { label: "Draft",     color: "text-gray-700 dark:text-gray-300",       bg: "bg-gray-100 dark:bg-gray-800",          dot: "bg-gray-400"    },
  SUBMITTED: { label: "Submitted", color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-900/20",        dot: "bg-blue-500"    },
  APPROVED:  { label: "Approved",  color: "text-success-700 dark:text-success-300", bg: "bg-success-50 dark:bg-success-900/20",  dot: "bg-success-500" },
  REJECTED:  { label: "Rejected",  color: "text-error-700 dark:text-error-300",     bg: "bg-error-50 dark:bg-error-900/20",      dot: "bg-error-500"   },
  INVOICED:  { label: "Invoiced",  color: "text-purple-700 dark:text-purple-300",   bg: "bg-purple-50 dark:bg-purple-900/20",    dot: "bg-purple-500"  },
};

const TEBadge: React.FC<{ status: TimeEntryStatus }> = ({ status }) => {
  const m = TE_STATUS[status] ?? TE_STATUS.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.bg} ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; cls: string }> = ({
  label, value, sub, icon, cls,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>{icon}</div>
    </div>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
  </div>
);

// ── Time entry row ────────────────────────────────────────────────
interface RowProps {
  entry: TimeEntry;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onRejectClick: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
  actioning: string | null;
}

const EntryRow: React.FC<RowProps> = ({ entry, onSubmit, onApprove, onRejectClick, onDelete, actioning }) => {
  const busy = actioning === entry.id;
  return (
    <div className="grid grid-cols-[1fr_90px_110px_120px_130px_auto] items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/20">
      {/* Description + project */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
          {entry.description ?? <span className="text-gray-400 italic">No description</span>}
        </p>
        <p className="truncate text-[11px] text-gray-400">
          {entry.project?.name ?? "—"}
          {entry.user ? ` · ${entry.user.firstName} ${entry.user.lastName}` : ""}
        </p>
        {entry.status === "REJECTED" && entry.rejectionReason && (
          <p className="mt-0.5 text-[11px] text-error-600 dark:text-error-400">↳ {entry.rejectionReason}</p>
        )}
      </div>

      {/* Duration */}
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{hhmm(entry.duration)}</span>

      {/* Amount */}
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {entry.isBillable ? fmt(entry.totalAmount) : <span className="text-gray-400 text-xs">Non-billable</span>}
      </span>

      {/* Status */}
      <TEBadge status={entry.status} />

      {/* Approved by */}
      <span className="text-xs text-gray-400">
        {entry.approvedBy ? `${entry.approvedBy.firstName} ${entry.approvedBy.lastName}` : "—"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {entry.status === "DRAFT" && (
          <button
            onClick={() => onSubmit(entry.id)}
            disabled={busy}
            className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-900/20 dark:text-brand-300"
          >
            Submit
          </button>
        )}
        {entry.status === "SUBMITTED" && (
          <>
            <button
              onClick={() => onApprove(entry.id)}
              disabled={busy}
              className="rounded-lg bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 hover:bg-success-100 disabled:opacity-50 dark:bg-success-900/20 dark:text-success-300"
            >
              Approve
            </button>
            <button
              onClick={() => onRejectClick(entry)}
              disabled={busy}
              className="rounded-lg bg-error-50 px-2.5 py-1 text-[11px] font-semibold text-error-700 hover:bg-error-100 disabled:opacity-50 dark:bg-error-900/20 dark:text-error-300"
            >
              Reject
            </button>
          </>
        )}
        {(entry.status === "DRAFT" || entry.status === "REJECTED") && (
          <button
            onClick={() => onDelete(entry.id)}
            disabled={busy}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 disabled:opacity-50 dark:hover:bg-error-900/20 dark:hover:text-error-400"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────
const DEFAULT_FILTERS: TimeEntryFilters = { page: 1, limit: 100, sortBy: "date", sortOrder: "desc" };

const TimeTrackingPage: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [tab, setTab] = useState<"timesheet" | "approval">("timesheet");
  const [showLog, setShowLog] = useState(false);
  const [rejectEntry, setRejectEntry] = useState<TimeEntry | null>(null);
  const [filters, setFilters] = useState<TimeEntryFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [listRes, projRes] = await Promise.all([
        timeEntriesService.getList(filters, token),
        projectsService.getList({ status: "ACTIVE", limit: 100 }, token),
      ]);
      setEntries(listRes.items);
      setProjects(projRes.items);
    } catch {
      setError("Failed to load time entries.");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = useCallback(async (id: string) => {
    if (!token) return;
    setActioning(id);
    try {
      await timeEntriesService.submit(id, token);
      await load();
    } catch { } finally { setActioning(null); }
  }, [token, load]);

  const handleApprove = useCallback(async (id: string) => {
    if (!token) return;
    setActioning(id);
    try {
      await timeEntriesService.approve(id, token);
      await load();
    } catch { } finally { setActioning(null); }
  }, [token, load]);

  const handleReject = useCallback(async (reason: string) => {
    if (!token || !rejectEntry) return;
    setActioning(rejectEntry.id);
    try {
      await timeEntriesService.reject(rejectEntry.id, reason, token);
      setRejectEntry(null);
      await load();
    } catch { } finally { setActioning(null); }
  }, [token, rejectEntry, load]);

  const handleDelete = useCallback(async (id: string) => {
    if (!token || !confirm("Delete this time entry?")) return;
    setActioning(id);
    try {
      await timeEntriesService.delete(id, token);
      await load();
    } catch { } finally { setActioning(null); }
  }, [token, load]);

  const handleSearch = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((p) => ({ ...p, search: v, page: 1 }));
    }, 400);
  };

  // Computed stats
  const totalHours = entries.reduce((s, e) => s + e.duration, 0) / 60;
  const billableHours = entries.filter((e) => e.isBillable).reduce((s, e) => s + e.duration, 0) / 60;
  const billableAmount = entries.filter((e) => e.isBillable).reduce((s, e) => s + e.totalAmount, 0);
  const pendingApproval = entries.filter((e) => e.status === "SUBMITTED");

  // Filtered views
  const timesheetEntries = tab === "timesheet"
    ? entries.filter((e) => e.status !== "SUBMITTED")
    : entries;
  const approvalEntries = entries.filter((e) => e.status === "SUBMITTED");

  const grouped = groupByDate(tab === "approval" ? approvalEntries : timesheetEntries);

  const inputCls = "h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Log, review, and approve time entries across all projects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Projects
          </button>
          <button
            onClick={() => setShowLog(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Log Time
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Hours"
          value={`${totalHours.toFixed(1)}h`}
          sub={`${entries.length} entries`}
          cls="bg-brand-50 dark:bg-brand-900/20"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="Billable Hours"
          value={`${billableHours.toFixed(1)}h`}
          sub={`${totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(0) : 0}% of total`}
          cls="bg-success-50 dark:bg-success-900/20"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatCard
          label="Billable Amount"
          value={fmt(billableAmount)}
          cls="bg-teal-50 dark:bg-teal-900/20"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          label="Pending Approval"
          value={String(pendingApproval.length)}
          sub="Awaiting review"
          cls={pendingApproval.length > 0 ? "bg-warning-50 dark:bg-warning-900/20" : "bg-gray-50 dark:bg-gray-800"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pendingApproval.length > 0 ? "#F59E0B" : "#9CA3AF"} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/40 w-fit">
        {(["timesheet", "approval"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t === "timesheet" ? "My Timesheet" : `Approval Queue ${pendingApproval.length > 0 ? `(${pendingApproval.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search descriptions..."
            className={inputCls + " w-full pl-9"}
          />
        </div>
        <select value={filters.projectId ?? ""} onChange={(e) => setFilters((p) => ({ ...p, projectId: e.target.value || undefined, page: 1 }))} className={inputCls}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" value={filters.startDate ?? ""} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value || undefined, page: 1 }))} className={inputCls} title="From date" />
        <input type="date" value={filters.endDate ?? ""} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value || undefined, page: 1 }))} className={inputCls} title="To date" />
        <select value={filters.isBillable ?? ""} onChange={(e) => setFilters((p) => ({ ...p, isBillable: e.target.value || undefined, page: 1 }))} className={inputCls}>
          <option value="">All Types</option>
          <option value="true">Billable</option>
          <option value="false">Non-billable</option>
        </select>
        <button
          onClick={() => { setFilters(DEFAULT_FILTERS); setSearchInput(""); }}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : tab === "approval" && approvalEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <p className="font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
          <p className="mt-1 text-sm text-gray-400">No time entries pending approval.</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <p className="font-medium text-gray-700 dark:text-gray-300">No time entries</p>
          <p className="mt-1 text-sm text-gray-400">Log your first time entry to get started.</p>
          <button onClick={() => setShowLog(true)} className="mt-3 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Log Time →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, dayEntries]) => {
            const dayHours = dayEntries.reduce((s, e) => s + e.duration, 0) / 60;
            const dayAmount = dayEntries.filter((e) => e.isBillable).reduce((s, e) => s + e.totalAmount, 0);
            return (
              <div key={date} className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                {/* Date header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-2.5 dark:border-gray-700 dark:bg-gray-800/40">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{dateFmt(date)}</span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{dayHours.toFixed(1)}h total</span>
                    {dayAmount > 0 && <span>{fmt(dayAmount)} billable</span>}
                  </div>
                </div>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_90px_110px_120px_130px_auto] border-b border-gray-100 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                  <span>Description</span>
                  <span>Duration</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Approved By</span>
                  <span />
                </div>
                {/* Rows */}
                <div className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900/30">
                  {dayEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      onSubmit={handleSubmit}
                      onApprove={handleApprove}
                      onRejectClick={setRejectEntry}
                      onDelete={handleDelete}
                      actioning={actioning}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <LogTimeModal
        isOpen={showLog}
        onClose={() => setShowLog(false)}
        onCreated={load}
      />
      <RejectModal
        isOpen={!!rejectEntry}
        onClose={() => setRejectEntry(null)}
        onReject={handleReject}
        entryDescription={rejectEntry?.description}
      />
    </div>
  );
};

export default TimeTrackingPage;
