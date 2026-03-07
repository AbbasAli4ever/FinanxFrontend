"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import projectsService from "@/services/projectsService";
import type { Project, ProjectSummary, ProjectStatus, BillingMethod } from "@/types/projects";
import ProjectStatusBadge, { BILLING_METHOD_LABELS } from "./ProjectStatusBadge";
import CreateProjectModal from "./CreateProjectModal";

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtH(h: number) {
  return `${h.toLocaleString()}h`;
}
function dateFmt(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Budget progress bar ──────────────────────────────────────────
const BudgetBar: React.FC<{ used: number; total: number; unit?: string }> = ({ used, total, unit }) => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct >= 90 ? "bg-error-500" : pct >= 70 ? "bg-warning-500" : "bg-brand-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>{unit === "$" ? fmt(used) : fmtH(used)}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Summary card ─────────────────────────────────────────────────
const SummaryCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; colorClass: string }> = ({
  label, value, sub, icon, colorClass,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

// ── Skeleton ─────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
    ))}
  </div>
);

// ── Project card ─────────────────────────────────────────────────
const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  const progressHours = project.totalLoggedHours && project.budgetHours
    ? { used: project.totalLoggedHours, total: project.budgetHours, unit: "h" }
    : null;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-600"
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <div
          className="mt-1 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? "#6366F1" }}
        />
        <div className="min-w-0 flex-1">
          {/* Top row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{project.projectNumber}</span>
            <ProjectStatusBadge status={project.status} />
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {BILLING_METHOD_LABELS[project.billingMethod]}
            </span>
          </div>

          {/* Name */}
          <h3 className="mt-1 truncate text-base font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
            {project.name}
          </h3>

          {/* Customer */}
          {project.customer && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{project.customer.displayName}</p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            {project.startDate && (
              <span>{dateFmt(project.startDate)} → {dateFmt(project.endDate)}</span>
            )}
            <span>{project.totalLoggedHours?.toFixed(1) ?? "0"}h logged</span>
            {project.teamMemberCount !== undefined && (
              <span>{project.teamMemberCount} member{project.teamMemberCount !== 1 ? "s" : ""}</span>
            )}
            {project.totalBilledAmount !== undefined && (
              <span>{fmt(project.totalBilledAmount)} billed</span>
            )}
          </div>

          {/* Budget bar */}
          {progressHours && (
            <div className="mt-3">
              <BudgetBar used={progressHours.used} total={progressHours.total} unit={progressHours.unit} />
            </div>
          )}
        </div>

        {/* Arrow */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="mt-1 shrink-0 text-gray-300 transition-colors group-hover:text-brand-400 dark:text-gray-700">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────
const ProjectsPage: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [filters, setFilters] = useState({
    status: "" as ProjectStatus | "",
    billingMethod: "" as BillingMethod | "",
    search: "",
    page: 1,
    limit: 20,
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [listRes, summaryRes] = await Promise.all([
        projectsService.getList(
          {
            status: filters.status || undefined,
            billingMethod: filters.billingMethod || undefined,
            search: filters.search || undefined,
            page: filters.page,
            limit: filters.limit,
          },
          token
        ),
        projectsService.getSummary(token),
      ]);
      setProjects(listRes.items);
      setTotalPages(listRes.pagination.totalPages);
      setTotalCount(listRes.pagination.totalCount);
      setSummary(summaryRes);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((p) => ({ ...p, search: v, page: 1 }));
    }, 400);
  };

  const statusCounts = summary?.byStatus ?? {};

  const inputCls = "h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage billable projects and track profitability</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Project
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Total Projects"
            value={summary.totalProjects}
            sub={`${statusCounts.ACTIVE ?? 0} active`}
            colorClass="bg-brand-50 dark:bg-brand-900/20"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
          />
          <SummaryCard
            label="Completed"
            value={statusCounts.COMPLETED ?? 0}
            colorClass="bg-success-50 dark:bg-success-900/20"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          />
          <SummaryCard
            label="Total Hours"
            value={summary.totalLoggedHours.toLocaleString() + "h"}
            colorClass="bg-purple-50 dark:bg-purple-900/20"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <SummaryCard
            label="Total Billed"
            value={fmt(summary.totalBilledAmount)}
            colorClass="bg-teal-50 dark:bg-teal-900/20"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
        </div>
      )}

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {(["", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilters((p) => ({ ...p, status: s, page: 1 }))}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filters.status === s
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
            {s === "" && summary ? ` (${summary.totalProjects})` : ""}
            {s !== "" && statusCounts[s] !== undefined ? ` (${statusCounts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search projects..."
            className={inputCls + " w-full pl-9"}
          />
        </div>
        <select
          value={filters.billingMethod}
          onChange={(e) => setFilters((p) => ({ ...p, billingMethod: e.target.value as BillingMethod | "", page: 1 }))}
          className={inputCls}
        >
          <option value="">All Billing</option>
          <option value="TIME_AND_MATERIALS">Time & Materials</option>
          <option value="FIXED_PRICE">Fixed Price</option>
          <option value="NON_BILLABLE">Non-Billable</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">{error}</div>
      )}

      {/* Project list */}
      {loading ? (
        <Skeleton />
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <p className="font-medium text-gray-700 dark:text-gray-300">No projects found</p>
          <p className="mt-1 text-sm text-gray-400">
            {filters.search || filters.status ? "Try adjusting your filters." : "Create your first project to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => router.push(`/projects/${p.id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Page {filters.page} of {totalPages} · {totalCount} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              disabled={filters.page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Prev
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              disabled={filters.page === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </div>
  );
};

export default ProjectsPage;
