"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import projectsService from "@/services/projectsService";
import timeEntriesService from "@/services/timeEntriesService";
import type {
  ProjectDetail,
  ProjectProfitability,
  TimeEntry,
  TimeEntryStatus,
} from "@/types/projects";
import ProjectStatusBadge, { BILLING_METHOD_LABELS } from "../../_components/ProjectStatusBadge";
import AttachmentsPanel from "@/components/documents/AttachmentsPanel";

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function dateFmt(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function dtFmt(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Stat card ────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string; sub?: string; colorClass?: string }> = ({
  label, value, sub, colorClass = "",
}) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] ${colorClass}`}>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
  </div>
);

// ── Budget bar ───────────────────────────────────────────────────
const BudgetBar: React.FC<{ used: number; total: number; label: string }> = ({ used, total, label }) => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct >= 90 ? "bg-error-500" : pct >= 70 ? "bg-warning-500" : "bg-brand-500";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>{label}</span>
        <span className="font-semibold">{pct.toFixed(1)}% used</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>{used.toLocaleString()} used</span>
        <span>{total.toLocaleString()} total</span>
      </div>
    </div>
  );
};

// ── Time entry status badge ───────────────────────────────────────
const TE_STATUS: Record<TimeEntryStatus, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: "Draft",     color: "text-gray-700 dark:text-gray-300",       bg: "bg-gray-100 dark:bg-gray-800" },
  SUBMITTED: { label: "Submitted", color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-900/20" },
  APPROVED:  { label: "Approved",  color: "text-success-700 dark:text-success-300", bg: "bg-success-50 dark:bg-success-900/20" },
  REJECTED:  { label: "Rejected",  color: "text-error-700 dark:text-error-300",     bg: "bg-error-50 dark:bg-error-900/20" },
  INVOICED:  { label: "Invoiced",  color: "text-purple-700 dark:text-purple-300",   bg: "bg-purple-50 dark:bg-purple-900/20" },
};

const TEBadge: React.FC<{ status: TimeEntryStatus }> = ({ status }) => {
  const m = TE_STATUS[status] ?? TE_STATUS.DRAFT;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.bg} ${m.color}`}>{m.label}</span>
  );
};

// ── Overview tab ─────────────────────────────────────────────────
const OverviewTab: React.FC<{ project: ProjectDetail; profitability: ProjectProfitability | null; loadingProfit: boolean }> = ({
  project, profitability, loadingProfit,
}) => {
  const { stats } = project;
  const billablePct = stats.totalLoggedHours > 0 ? (stats.billableHours / stats.totalLoggedHours) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Hours" value={`${stats.totalLoggedHours.toFixed(1)}h`} sub={`${stats.billableHours.toFixed(1)}h billable`} />
        <StatCard label="Billable Amount" value={fmt(stats.billableAmount)} sub={`${billablePct.toFixed(0)}% billable`} />
        <StatCard label="Time Entries" value={String(stats.totalTimeEntries)} />
        <StatCard label="Total Amount" value={fmt(stats.totalAmount)} />
      </div>

      {/* Budget progress */}
      {(stats.budgetHoursUsed !== null || stats.budgetAmountUsed !== null) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">Budget Utilization</h3>
          <div className="space-y-4">
            {stats.budgetHoursUsed !== null && project.budgetHours && (
              <BudgetBar used={stats.budgetHoursUsed} total={project.budgetHours} label="Hours" />
            )}
            {stats.budgetAmountUsed !== null && project.budgetAmount && (
              <BudgetBar used={stats.budgetAmountUsed} total={project.budgetAmount} label="Budget ($)" />
            )}
          </div>
        </div>
      )}

      {/* Profitability */}
      {loadingProfit ? (
        <div className="animate-pulse h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ) : profitability ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">Profitability</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(profitability.revenue.total)}</p>
              <p className="text-[11px] text-gray-400">{profitability.revenue.invoiceCount} invoices</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cost</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(profitability.cost.total)}</p>
              <p className="text-[11px] text-gray-400">Labor + Expenses</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Profit</p>
              <p className={`text-lg font-bold ${profitability.profit >= 0 ? "text-success-600" : "text-error-600"}`}>
                {fmt(profitability.profit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Margin</p>
              <p className={`text-lg font-bold ${profitability.margin >= 0 ? "text-success-600" : "text-error-600"}`}>
                {profitability.margin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Project info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Project Details</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {[
            ["Billing Method", BILLING_METHOD_LABELS[project.billingMethod]],
            ["Customer", project.customer?.displayName ?? "—"],
            ["Start Date", dateFmt(project.startDate)],
            ["End Date", dateFmt(project.endDate)],
            ["Budget Amount", project.budgetAmount ? fmt(project.budgetAmount) : "—"],
            ["Budget Hours", project.budgetHours ? `${project.budgetHours}h` : "—"],
            ["Hourly Rate", project.hourlyRate ? fmt(project.hourlyRate) : "—"],
            ["Project #", project.projectNumber],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-gray-500 dark:text-gray-400">{k}</dt>
              <dd className="mt-0.5 font-medium text-gray-800 dark:text-gray-200">{v}</dd>
            </div>
          ))}
        </dl>
        {project.description && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{project.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Team tab ─────────────────────────────────────────────────────
const TeamTab: React.FC<{ project: ProjectDetail }> = ({ project }) => (
  <div className="space-y-3">
    {project.teamMembers.length === 0 ? (
      <p className="py-8 text-center text-sm text-gray-400">No team members assigned.</p>
    ) : (
      project.teamMembers.map((m) => (
        <div key={m.userId} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white">{m.name}</p>
            <p className="text-xs text-gray-500">{m.email}</p>
          </div>
          {m.role && <span className="text-xs text-gray-500 dark:text-gray-400">{m.role}</span>}
          {m.hourlyRate !== null && (
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {fmt(m.hourlyRate)}/h
            </span>
          )}
        </div>
      ))
    )}
  </div>
);

// ── Time entries tab ──────────────────────────────────────────────
const TimeEntriesTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    timeEntriesService.getList({ projectId, limit: 100 }, token)
      .then((r) => setEntries(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, token]);

  if (loading) return <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800" />)}</div>;

  if (entries.length === 0) return <p className="py-8 text-center text-sm text-gray-400">No time entries logged yet.</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-[1fr_80px_100px_120px_110px] border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
        <span>Description</span>
        <span>Date</span>
        <span>Duration</span>
        <span>Amount</span>
        <span>Status</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map((e) => (
          <div key={e.id} className="grid grid-cols-[1fr_80px_100px_120px_110px] items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/20">
            <div>
              <p className="truncate text-sm text-gray-800 dark:text-white">{e.description ?? "—"}</p>
              <p className="text-[11px] text-gray-400">{e.user ? `${e.user.firstName} ${e.user.lastName}` : "—"}</p>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">{dateFmt(e.date)}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{hhmm(e.duration)}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {e.isBillable ? fmt(e.totalAmount) : <span className="text-gray-400">Non-billable</span>}
            </span>
            <TEBadge status={e.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
const ProjectDetailPage: React.FC<{ id: string }> = ({ id }) => {
  const { token } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [profitability, setProfitability] = useState<ProjectProfitability | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfit, setLoadingProfit] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "team" | "time-entries" | "attachments">("overview");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await projectsService.getById(id, token);
      setProject(data);
      // Load profitability in background
      setLoadingProfit(true);
      projectsService.getProfitability(id, token)
        .then(setProfitability)
        .catch(() => {})
        .finally(() => setLoadingProfit(false));
    } catch {
      setError("Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = useCallback(async (status: string) => {
    if (!token || !project) return;
    setStatusUpdating(true);
    try {
      await projectsService.updateStatus(id, status, token);
      await load();
    } catch {
      // silent
    } finally {
      setStatusUpdating(false);
    }
  }, [token, project, id, load]);

  if (loading) return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );

  if (error || !project) return (
    <div className="p-6">
      <p className="text-sm text-error-600 dark:text-error-400">{error || "Project not found."}</p>
      <button onClick={() => router.push("/projects")} className="mt-3 text-sm text-brand-600 underline">← Back to Projects</button>
    </div>
  );

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "team", label: `Team (${project.teamMembers.length})` },
    { id: "time-entries", label: `Time Entries (${project.stats.totalTimeEntries})` },
    { id: "attachments", label: "Attachments" },
  ] as const;

  const statusActions: { label: string; status: string; color: string }[] = project.status === "ACTIVE"
    ? [{ label: "Put On Hold", status: "ON_HOLD", color: "text-warning-600" }, { label: "Complete", status: "COMPLETED", color: "text-success-600" }, { label: "Cancel", status: "CANCELLED", color: "text-error-600" }]
    : project.status === "ON_HOLD"
    ? [{ label: "Reactivate", status: "ACTIVE", color: "text-success-600" }, { label: "Cancel", status: "CANCELLED", color: "text-error-600" }]
    : project.status === "CANCELLED"
    ? [{ label: "Reactivate", status: "ACTIVE", color: "text-success-600" }]
    : [];

  return (
    <div className="space-y-5 p-6">
      {/* Back */}
      <button onClick={() => router.push("/projects")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Projects
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start gap-4">
          <div className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: project.color ?? "#6366F1" }} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gray-400">{project.projectNumber}</span>
              <ProjectStatusBadge status={project.status} size="md" />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            {project.customer && (
              <p className="text-sm text-gray-500">{project.customer.displayName}</p>
            )}
          </div>
        </div>

        {/* Status actions */}
        {statusActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {statusActions.map((a) => (
              <button
                key={a.status}
                onClick={() => handleStatusChange(a.status)}
                disabled={statusUpdating}
                className={`rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 ${a.color}`}
              >
                {statusUpdating ? "…" : a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/40">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab project={project} profitability={profitability} loadingProfit={loadingProfit} />
      )}
      {tab === "team" && <TeamTab project={project} />}
      {tab === "time-entries" && <TimeEntriesTab projectId={id} />}
      {tab === "attachments" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <AttachmentsPanel entityType="PROJECT" entityId={id} />
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
