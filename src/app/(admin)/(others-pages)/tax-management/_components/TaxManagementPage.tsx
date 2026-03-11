"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import taxesService from "@/services/taxesService";
import type { TaxRate, TaxGroup } from "@/types/taxes";

import CreateTaxRateModal from "./CreateTaxRateModal";
import EditTaxRateModal from "./EditTaxRateModal";
import CreateTaxGroupModal from "./CreateTaxGroupModal";
import EditTaxGroupModal from "./EditTaxGroupModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

type TaxTypeFilter = "ALL" | "SALES" | "PURCHASE" | "BOTH";

const TAX_TYPE_COLORS: Record<string, string> = {
  SALES: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PURCHASE: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  BOTH: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const TaxManagementPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"rates" | "groups">("rates");

  const [rates, setRates] = useState<TaxRate[]>([]);
  const [groups, setGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Rates filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaxTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected items for edit/delete
  const [selectedRate, setSelectedRate] = useState<TaxRate | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TaxGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "rate" | "group"; id: string; name: string } | null
  >(null);

  // Modals
  const createRateModal = useModal();
  const editRateModal = useModal();
  const createGroupModal = useModal();
  const editGroupModal = useModal();
  const deleteModal = useModal();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const filters: Record<string, string | boolean> = {};
      if (search) filters.search = search;
      if (typeFilter !== "ALL") filters.taxType = typeFilter;
      if (statusFilter === "ACTIVE") filters.isActive = true;
      if (statusFilter === "INACTIVE") filters.isActive = false;
      const { taxRates } = await taxesService.listRates(
        token,
        {
          search: search || undefined,
          taxType: typeFilter !== "ALL" ? (typeFilter as "SALES" | "PURCHASE" | "BOTH") : undefined,
          isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
        }
      );
      setRates(taxRates);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setAlert({ variant: "warning", title: "Access Restricted", message: getPermissionDeniedMessage(err) });
      } else {
        setAlert({ variant: "error", title: "Failed to load tax rates", message: formatApiErrorMessage(err) });
      }
    } finally {
      setLoading(false);
    }
  }, [token, search, typeFilter, statusFilter]);

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { taxGroups } = await taxesService.listGroups(token);
      setGroups(taxGroups);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setAlert({ variant: "warning", title: "Access Restricted", message: getPermissionDeniedMessage(err) });
      } else {
        setAlert({ variant: "error", title: "Failed to load tax groups", message: formatApiErrorMessage(err) });
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || permissionsLoading) return;
    if (activeTab === "rates") fetchRates();
    else fetchGroups();
  }, [isReady, isAuthenticated, permissionsLoading, activeTab, fetchRates, fetchGroups]);

  // ── Search debounce ────────────────────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(val), 400);
  };

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!token || !deleteTarget) return;
    if (deleteTarget.type === "rate") {
      await taxesService.deleteRate(token, deleteTarget.id);
      setAlert({ variant: "success", title: "Tax Rate Deactivated", message: `"${deleteTarget.name}" has been deactivated.` });
      fetchRates();
    } else {
      await taxesService.deleteGroup(token, deleteTarget.id);
      setAlert({ variant: "success", title: "Tax Group Deactivated", message: `"${deleteTarget.name}" has been deactivated.` });
      fetchGroups();
    }
    setDeleteTarget(null);
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (!isReady || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeRates = rates.filter((r) => r.isActive);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure tax rates, groups, and view tax reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tax-management/reports"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-theme-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Tax Reports
          </Link>
          {activeTab === "rates" ? (
            <Button size="sm" onClick={createRateModal.openModal}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Rate
            </Button>
          ) : (
            <Button size="sm" onClick={createGroupModal.openModal}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Group
            </Button>
          )}
        </div>
      </header>

      {/* ── Alert ── */}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
        />
      )}

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Rates", value: rates.length, sub: `${activeRates.length} active`, bg: "bg-brand-50 dark:bg-brand-900/20", text: "text-brand-600 dark:text-brand-400", accent: "text-brand-700 dark:text-brand-300" },
          { label: "Sales Rates", value: rates.filter((r) => r.taxType === "SALES" || r.taxType === "BOTH").length, sub: "apply to sales", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", accent: "text-blue-700 dark:text-blue-300" },
          { label: "Purchase Rates", value: rates.filter((r) => r.taxType === "PURCHASE" || r.taxType === "BOTH").length, sub: "apply to purchases", bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", accent: "text-purple-700 dark:text-purple-300" },
          { label: "Tax Groups", value: groups.length, sub: `${groups.filter((g) => g.isActive).length} active`, bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-600 dark:text-success-400", accent: "text-success-700 dark:text-success-300" },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm ${card.bg}`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${card.text}`}>{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.accent}`}>{card.value}</p>
            <p className={`mt-1 text-xs ${card.text}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {(["rates", "groups"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              {tab === "rates" ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                  Tax Rates
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">{rates.length}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>
                  Tax Groups
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">{groups.length}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── RATES TAB ── */}
        {activeTab === "rates" && (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search by name or code…"
                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
              <div className="flex items-center gap-2">
                {(["ALL", "SALES", "PURCHASE", "BOTH"] as TaxTypeFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? "bg-brand-500 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300"
                    }`}
                  >
                    {t === "ALL" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {(["ACTIVE", "INACTIVE", "ALL"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? s === "ACTIVE" ? "bg-success-500 text-white" : s === "INACTIVE" ? "bg-gray-500 text-white" : "bg-gray-700 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300"
                    }`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Rates list */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            ) : rates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-brand-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                </div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No tax rates found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                  {search ? "Try a different search term." : "Create your first tax rate to get started."}
                </p>
                {!search && <Button size="sm" onClick={createRateModal.openModal}>Create Rate</Button>}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {rates.map((rate) => (
                  <div key={rate.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    {/* Rate badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
                      <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{parseFloat(rate.rate)}</span>
                      <span className="text-xs text-brand-500 dark:text-brand-400 leading-none">%</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{rate.name}</span>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">{rate.code}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TAX_TYPE_COLORS[rate.taxType]}`}>
                          {rate.taxType}
                        </span>
                        {rate.isCompound && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Compound
                          </span>
                        )}
                        {!rate.isActive && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {rate.description && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{rate.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedRate(rate); editRateModal.openModal(); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-brand-600 hover:border-brand-300 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setDeleteTarget({ type: "rate", id: rate.id, name: rate.name }); deleteModal.openModal(); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-error-600 hover:border-error-300 transition-colors"
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── GROUPS TAB ── */}
        {activeTab === "groups" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-success-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>
                </div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No tax groups yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4 max-w-sm">
                  Groups combine multiple rates (e.g. HST = GST 5% + PST 8% = 13% combined).
                </p>
                <Button size="sm" onClick={createGroupModal.openModal}>Create Group</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {groups.map((group) => {
                  const sortedRates = [...group.taxGroupRates].sort((a, b) => a.sortOrder - b.sortOrder);
                  const combinedRate = sortedRates.reduce(
                    (sum, r) => sum + parseFloat(r.taxRate.rate),
                    0
                  );
                  return (
                    <div key={group.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                      {/* Combined rate badge */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800">
                        <span className="text-lg font-bold text-success-600 dark:text-success-400">{fmt(combinedRate)}</span>
                        <span className="text-xs text-success-500 dark:text-success-400 leading-none">%</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{group.name}</span>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">{group.code}</span>
                          {!group.isActive && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Inactive</span>
                          )}
                        </div>
                        {group.description && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{group.description}</p>
                        )}
                        {/* Included rates */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {sortedRates.map((gr, idx) => (
                            <React.Fragment key={gr.id}>
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800">
                                {gr.taxRate.name} ({parseFloat(gr.taxRate.rate)}%)
                              </span>
                              {idx < sortedRates.length - 1 && (
                                <span className="text-gray-400 text-xs font-medium">+</span>
                              )}
                            </React.Fragment>
                          ))}
                          {sortedRates.length === 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">No rates linked</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedGroup(group); editGroupModal.openModal(); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-brand-600 hover:border-brand-300 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button
                          onClick={() => { setDeleteTarget({ type: "group", id: group.id, name: group.name }); deleteModal.openModal(); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-error-600 hover:border-error-300 transition-colors"
                          title="Deactivate"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <CreateTaxRateModal
        isOpen={createRateModal.isOpen}
        onClose={createRateModal.closeModal}
        onCreated={() => {
          setAlert({ variant: "success", title: "Tax Rate Created", message: "New tax rate has been created successfully." });
          fetchRates();
        }}
      />

      <EditTaxRateModal
        isOpen={editRateModal.isOpen}
        onClose={editRateModal.closeModal}
        onUpdated={() => {
          setAlert({ variant: "success", title: "Tax Rate Updated", message: "Tax rate has been updated successfully." });
          fetchRates();
        }}
        rate={selectedRate}
      />

      <CreateTaxGroupModal
        isOpen={createGroupModal.isOpen}
        onClose={createGroupModal.closeModal}
        onCreated={() => {
          setAlert({ variant: "success", title: "Tax Group Created", message: "New tax group has been created successfully." });
          fetchGroups();
        }}
        availableRates={activeRates}
      />

      <EditTaxGroupModal
        isOpen={editGroupModal.isOpen}
        onClose={editGroupModal.closeModal}
        onUpdated={() => {
          fetchGroups();
        }}
        group={selectedGroup}
        availableRates={activeRates}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleDeleteConfirm}
        title={`Deactivate ${deleteTarget?.type === "rate" ? "Tax Rate" : "Tax Group"}`}
        description={`"${deleteTarget?.name}" will be deactivated. Existing documents using this ${deleteTarget?.type === "rate" ? "rate" : "group"} will not be affected.`}
      />
    </div>
  );
};

export default TaxManagementPage;
