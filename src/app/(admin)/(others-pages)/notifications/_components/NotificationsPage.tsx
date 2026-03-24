"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppDatePicker from "@/components/form/AppDatePicker";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import Alert from "@/components/ui/alert/Alert";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import notificationsService from "@/services/notificationsService";
import type { Notification, NotificationType } from "@/types/notifications";
import {
  NOTIFICATION_TYPE_CONFIG,
  getNotificationLink,
  timeAgo,
} from "@/types/notifications";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };

// ─── Per-type icon (same as dropdown) ────────────────────────────────────────

function NotificationIcon({ type, size = "md" }: { type: NotificationType; size?: "sm" | "md" }) {
  const cfg = NOTIFICATION_TYPE_CONFIG[type];
  const sz = size === "sm" ? "w-8 h-8 rounded-lg" : "w-11 h-11 rounded-xl";
  const iconSz = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  const icons: Record<NotificationType, React.ReactNode> = {
    INVOICE_OVERDUE: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
    BILL_OVERDUE: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H13a1 1 0 100-2H8.414l1.293-1.293z" clipRule="evenodd" /></svg>,
    LOW_STOCK: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" /></svg>,
    RECURRING_UPCOMING: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
    EXPENSE_PENDING_APPROVAL: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
    PROJECT_DEADLINE: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
    PAYMENT_RECEIVED: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
    INVOICE_SENT: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>,
    SYSTEM_ALERT: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    GENERAL: <svg className={iconSz} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>,
  };

  return (
    <span className={`shrink-0 flex items-center justify-center ${sz} border ${cfg.bg} ${cfg.border} ${cfg.iconColor}`}>
      {icons[type]}
    </span>
  );
}

const ALL_TYPES = Object.keys(NOTIFICATION_TYPE_CONFIG) as NotificationType[];

const selectClasses =
  "h-9 appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 pr-8 text-sm text-gray-800 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 shadow-theme-xs";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Bulk actions
  const [markingAll, setMarkingAll] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await notificationsService.list(token, {
        type: typeFilter || undefined,
        isRead: readFilter === "all" ? undefined : readFilter === "read",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortOrder: "desc",
        page,
        limit: 20,
      });
      setNotifications(data.items);
      setPagination(data.pagination);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setAlert({ variant: "warning", title: "Access Restricted", message: getPermissionDeniedMessage(err) });
      } else {
        setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
      }
    } finally {
      setLoading(false);
    }
  }, [token, typeFilter, readFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || permissionsLoading) return;
    fetchNotifications();
  }, [isReady, isAuthenticated, permissionsLoading, fetchNotifications]);

  // ── Mark single read ───────────────────────────────────────────────────────

  const handleClick = async (n: Notification) => {
    if (!token) return;
    if (!n.isRead) {
      try {
        await notificationsService.markRead(token, n.id);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
      } catch { /* silent */ }
    }
    const link = getNotificationLink(n);
    if (link) router.push(link);
  };

  // ── Mark single unread → read via checkbox ─────────────────────────────────

  const handleMarkOneRead = async (id: string) => {
    if (!token) return;
    try {
      await notificationsService.markRead(token, id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
    }
  };

  // ── Delete single ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await notificationsService.deleteOne(token, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setPagination((p) => ({ ...p, totalCount: Math.max(0, p.totalCount - 1) }));
    } catch (err) {
      setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
    }
  };

  // ── Mark all read ──────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      const { updated } = await notificationsService.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setAlert({ variant: "success", title: "Done", message: `${updated} notification${updated !== 1 ? "s" : ""} marked as read.` });
    } catch (err) {
      setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Clear read ─────────────────────────────────────────────────────────────

  const handleClearRead = async () => {
    if (!token || clearing) return;
    setClearing(true);
    try {
      const { deleted } = await notificationsService.clearRead(token);
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      setAlert({ variant: "success", title: "Cleared", message: `${deleted} read notification${deleted !== 1 ? "s" : ""} removed.` });
    } catch (err) {
      setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
    } finally {
      setClearing(false);
    }
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!token || selectedIds.size === 0) return;
    try {
      await Promise.all([...selectedIds].map((id) => notificationsService.deleteOne(token, id)));
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setPagination((p) => ({ ...p, totalCount: Math.max(0, p.totalCount - selectedIds.size) }));
      setSelectedIds(new Set());
      setAlert({ variant: "success", title: "Deleted", message: `${selectedIds.size} notification${selectedIds.size !== 1 ? "s" : ""} deleted.` });
    } catch (err) {
      setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
    }
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pagination.totalCount > 0
              ? `${pagination.totalCount} notification${pagination.totalCount !== 1 ? "s" : ""}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`
              : "No notifications"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-theme-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
          <button
            onClick={handleClearRead}
            disabled={clearing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-theme-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {clearing ? "Clearing…" : "Clear read"}
          </button>
          <Link
            href="/notifications/preferences"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-theme-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            Preferences
          </Link>
        </div>
      </header>

      {/* ── Alert ── */}
      {alert && <Alert variant={alert.variant} title={alert.title} message={alert.message} />}

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ""); setPage(1); }}
              className={selectClasses}
            >
              <option value="">All Types</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>{NOTIFICATION_TYPE_CONFIG[t].label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path fillRule="evenodd" d="M3 5l4 4 4-4" /></svg>
            </span>
          </div>

          {/* Read state */}
          <div className="flex items-center gap-1">
            {(["all", "unread", "read"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setReadFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  readFilter === s
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 ml-auto">
            <AppDatePicker
              value={dateFrom}
              onChange={(val) => { setDateFrom(val); setPage(1); }}
              maxToday
              max={dateTo}
            />
            <span className="text-gray-400 text-sm">→</span>
            <AppDatePicker
              value={dateTo}
              onChange={(val) => { setDateTo(val); setPage(1); }}
              min={dateFrom}
              maxToday
            />
          </div>
        </div>
      </div>

      {/* ── Bulk selection bar ── */}
      {hasSelected && (
        <div className="flex items-center justify-between rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-4 py-3">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center gap-2 rounded-lg border border-error-300 dark:border-error-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            Delete selected
          </button>
        </div>
      )}

      {/* ── List ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <input
            type="checkbox"
            checked={notifications.length > 0 && selectedIds.size === notifications.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
          />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Notification
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse">
                <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 mt-1 shrink-0" />
                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {typeFilter || readFilter !== "all" ? "Try adjusting your filters." : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => {
              const cfg = NOTIFICATION_TYPE_CONFIG[n.type];
              const link = getNotificationLink(n);
              const isSelected = selectedIds.has(n.id);
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 group ${
                    !n.isRead ? "bg-brand-50/30 dark:bg-brand-900/10" : ""
                  } ${isSelected ? "bg-brand-50 dark:bg-brand-900/20" : ""}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(n.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                  />

                  {/* Icon */}
                  <NotificationIcon type={n.type} />

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex items-start gap-2 justify-between">
                      <p className={`text-sm font-semibold leading-tight ${!n.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {n.title}
                        {!n.isRead && (
                          <span className="inline-block ml-2 w-2 h-2 rounded-full bg-brand-500 align-middle" />
                        )}
                      </p>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {n.entityType && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{n.entityType}</span>
                      )}
                      {link && (
                        <span className="text-xs font-medium text-brand-500 dark:text-brand-400">
                          → View {n.entityType?.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row actions */}
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkOneRead(n.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 hover:text-success-600 hover:border-success-300 transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 hover:text-error-600 hover:border-error-300 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </span>{" "}
              of <span className="font-medium text-gray-700 dark:text-gray-300">{pagination.totalCount}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg>
                Prev
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pg === page ? "bg-brand-500 text-white" : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-brand-300"
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
