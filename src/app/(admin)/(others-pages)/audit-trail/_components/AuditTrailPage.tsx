"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import auditService from "@/services/auditService";
import type {
  AuditLogItem,
  AuditLogFilters,
  AuditLogListResponse,
  AuditEntityType,
  AuditAction,
} from "@/types/audit";
import AuditActionBadge, { ACTION_META } from "./AuditActionBadge";

// ── Entity type → route path map ────────────────────────────────
const ENTITY_ROUTES: Record<string, string> = {
  INVOICE:             "/invoices",
  BILL:                "/bills",
  EXPENSE:             "/expenses",
  JOURNAL_ENTRY:       "/journal-entries",
  CREDIT_NOTE:         "/credit-notes",
  DEBIT_NOTE:          "/debit-notes",
  ESTIMATE:            "/estimates",
  PURCHASE_ORDER:      "/purchase-orders",
  SALES_ORDER:         "/sales-orders",
  ACCOUNT:             "/accounting",
  CUSTOMER:            "/customers",
  VENDOR:              "/vendors",
  PRODUCT:             "/products",
  BANK_ACCOUNT:        "/banking",
  BANK_TRANSACTION:    "/banking",
  BANK_RECONCILIATION: "/banking",
  USER:                "/users",
  ROLE:                "/roles",
};

const ENTITY_TYPES: AuditEntityType[] = [
  "INVOICE", "BILL", "EXPENSE", "JOURNAL_ENTRY",
  "CREDIT_NOTE", "DEBIT_NOTE", "ESTIMATE",
  "PURCHASE_ORDER", "SALES_ORDER",
  "ACCOUNT", "CUSTOMER", "VENDOR", "PRODUCT",
  "BANK_ACCOUNT", "BANK_TRANSACTION", "BANK_RECONCILIATION",
  "USER", "ROLE", "CATEGORY", "COMPANY",
];

const ACTIONS: AuditAction[] = [
  "CREATE", "UPDATE", "DELETE", "SEND", "VOID",
  "RECEIVE", "FULFILL", "CONVERT", "PAY",
  "APPROVE", "REJECT", "CLOSE", "POST",
  "REVERSE", "DUPLICATE", "OPEN", "APPLY",
  "REFUND", "ADJUST", "TRANSFER", "MATCH",
  "RECONCILE", "PAUSE", "RESUME", "CONFIRM",
  "EXPIRE", "IMPORT", "INVITE", "DEACTIVATE",
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Entity type label  ───────────────────────────────────────────
function entityLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Avatar initials ─────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Expanded row: changes + metadata ───────────────────────────
const ExpandedRow: React.FC<{ item: AuditLogItem }> = ({ item }) => {
  const hasChanges = item.changes && Object.keys(item.changes).length > 0;
  const hasMeta = item.metadata && Object.keys(item.metadata).length > 0;

  if (!hasChanges && !hasMeta) return null;

  return (
    <div className="flex flex-wrap gap-4 border-t border-gray-100 bg-gray-50/60 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/20">
      {hasChanges && (
        <div className="min-w-[220px] flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Field Changes
          </p>
          <div className="space-y-1">
            {Object.entries(item.changes!).map(([field, { from, to }]) => (
              <div key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="capitalize text-gray-500 dark:text-gray-400">
                  {field.replace(/([A-Z])/g, " $1").trim()}:
                </span>
                <span className="rounded bg-error-100 px-1.5 py-0.5 text-error-700 line-through dark:bg-error-900/30 dark:text-error-400">
                  {from !== null && from !== undefined ? String(from) : "—"}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="rounded bg-success-100 px-1.5 py-0.5 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                  {to !== null && to !== undefined ? String(to) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasMeta && (
        <div className="min-w-[220px] flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Metadata
          </p>
          <div className="space-y-1">
            {Object.entries(item.metadata!).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="capitalize text-gray-400 dark:text-gray-500">
                  {k.replace(/([A-Z])/g, " $1").trim()}:
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300 break-all">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Skeleton ────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-40 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3 w-56 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3.5 w-32 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

// ── Filter bar ──────────────────────────────────────────────────
interface FilterBarProps {
  filters: AuditLogFilters;
  onChange: (next: Partial<AuditLogFilters>) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, onReset }) => {
  const selectCls =
    "h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value, page: 1 })}
          placeholder="Search description or entity..."
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />
      </div>

      {/* Entity Type */}
      <select
        value={filters.entityType ?? ""}
        onChange={(e) => onChange({ entityType: (e.target.value as AuditEntityType) || undefined, page: 1 })}
        className={selectCls}
      >
        <option value="">All Entities</option>
        {ENTITY_TYPES.map((t) => (
          <option key={t} value={t}>{entityLabel(t)}</option>
        ))}
      </select>

      {/* Action */}
      <select
        value={filters.action ?? ""}
        onChange={(e) => onChange({ action: (e.target.value as AuditAction) || undefined, page: 1 })}
        className={selectCls}
      >
        <option value="">All Actions</option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
        ))}
      </select>

      {/* Date from */}
      <input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => onChange({ dateFrom: e.target.value || undefined, page: 1 })}
        className={selectCls + " pr-3"}
        title="From date"
      />

      {/* Date to */}
      <input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => onChange({ dateTo: e.target.value || undefined, page: 1 })}
        className={selectCls + " pr-3"}
        title="To date"
      />

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Reset
      </button>
    </div>
  );
};

// ── Pagination ──────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPage: (p: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalCount,
  limit,
  onPage,
}) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnCls = (active: boolean) =>
    `flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2.5 text-sm transition-colors ${
      active
        ? "bg-brand-500 text-white font-semibold"
        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Showing {start}–{end} of {totalCount.toLocaleString()} entries
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)} className={btnCls(p === page)}>
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────
const DEFAULT_FILTERS: AuditLogFilters = {
  page: 1,
  limit: 50,
  sortBy: "performedAt",
  sortOrder: "desc",
};

const AuditTrailPage: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const [result, setResult] = useState<AuditLogListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(
    async (f: AuditLogFilters) => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const data = await auditService.getLogs(f, token);
        setResult(data);
      } catch {
        setError("Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchLogs(filters);
  }, [fetchLogs, filters]);

  const updateFilters = useCallback((next: Partial<AuditLogFilters>) => {
    if ("search" in next) {
      // Debounce search input
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setFilters((prev) => ({ ...prev, ...next }));
      }, 400);
    } else {
      setFilters((prev) => ({ ...prev, ...next }));
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleEntityClick = useCallback(
    (item: AuditLogItem) => {
      const path = ENTITY_ROUTES[item.entityType];
      if (path) router.push(path);
    },
    [router]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const hasActiveFilters =
    filters.search ||
    filters.entityType ||
    filters.action ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Trail
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Track all actions performed across your organization
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-white/[0.03]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {result.pagination.totalCount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">total entries</span>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={updateFilters} onReset={resetFilters} />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Filters:</span>
          {filters.entityType && (
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
              {entityLabel(filters.entityType)}
              <button onClick={() => updateFilters({ entityType: undefined, page: 1 })} className="ml-0.5 text-brand-400 hover:text-brand-600">×</button>
            </span>
          )}
          {filters.action && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {ACTION_META[filters.action]?.label ?? filters.action}
              <button onClick={() => updateFilters({ action: undefined, page: 1 })} className="ml-0.5 text-gray-400 hover:text-gray-600">×</button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              From {filters.dateFrom}
              <button onClick={() => updateFilters({ dateFrom: undefined, page: 1 })} className="ml-0.5 text-gray-400 hover:text-gray-600">×</button>
            </span>
          )}
          {filters.dateTo && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              To {filters.dateTo}
              <button onClick={() => updateFilters({ dateTo: undefined, page: 1 })} className="ml-0.5 text-gray-400 hover:text-gray-600">×</button>
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Table header */}
        <div className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
          <div className="grid grid-cols-[1fr_140px_160px_180px_40px] items-center gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <span>Description</span>
            <span>Entity</span>
            <span>Action</span>
            <span>Date & User</span>
            <span />
          </div>
        </div>

        {loading ? (
          <Skeleton />
        ) : !result || result.items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300">No audit logs found</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {hasActiveFilters ? "Try adjusting your filters." : "Activity will appear here as actions are performed."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {result.items.map((item) => {
              const isExpanded = expandedId === item.id;
              const hasDetails =
                (item.changes && Object.keys(item.changes).length > 0) ||
                (item.metadata && Object.keys(item.metadata).length > 0);

              return (
                <div key={item.id}>
                  <div
                    className={`group grid grid-cols-[1fr_140px_160px_180px_40px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                      isExpanded ? "bg-gray-50/80 dark:bg-gray-800/20" : ""
                    }`}
                  >
                    {/* Description */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                        {item.description ?? `${entityLabel(item.entityType)} ${item.action.toLowerCase()}`}
                      </p>
                      {item.entityLabel && (
                        <button
                          onClick={() => handleEntityClick(item)}
                          className="mt-0.5 truncate text-xs font-mono font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {item.entityLabel}
                        </button>
                      )}
                    </div>

                    {/* Entity type */}
                    <div>
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {entityLabel(item.entityType)}
                      </span>
                    </div>

                    {/* Action */}
                    <div>
                      <AuditActionBadge action={item.action} size="sm" />
                    </div>

                    {/* Date + User */}
                    <div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {formatDateTime(item.performedAt)}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[8px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                          {initials(item.user.name)}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {item.user.name}
                        </span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <div className="flex justify-end">
                      {hasDetails && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title={isExpanded ? "Collapse" : "View details"}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && <ExpandedRow item={item} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {result && result.pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <Pagination
              page={result.pagination.page}
              totalPages={result.pagination.totalPages}
              totalCount={result.pagination.totalCount}
              limit={result.pagination.limit}
              onPage={(p) => updateFilters({ page: p })}
            />
          </div>
        )}
      </div>

      {/* Results summary */}
      {result && result.pagination.totalCount > 0 && result.pagination.totalPages <= 1 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Showing all {result.pagination.totalCount} entries
        </p>
      )}
    </div>
  );
};

export default AuditTrailPage;
