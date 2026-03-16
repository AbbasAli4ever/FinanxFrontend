"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Dropdown } from "../ui/dropdown/Dropdown";
import notificationsService from "@/services/notificationsService";
import type { Notification, NotificationType } from "@/types/notifications";
import {
  NOTIFICATION_TYPE_CONFIG,
  getNotificationLink,
  timeAgo,
} from "@/types/notifications";

// ─── Per-type icon ────────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: NotificationType }) {
  const cfg = NOTIFICATION_TYPE_CONFIG[type];
  const icons: Record<NotificationType, React.ReactNode> = {
    INVOICE_OVERDUE: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    BILL_OVERDUE: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H13a1 1 0 100-2H8.414l1.293-1.293z" clipRule="evenodd" />
      </svg>
    ),
    LOW_STOCK: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
      </svg>
    ),
    RECURRING_UPCOMING: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    ),
    EXPENSE_PENDING_APPROVAL: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    PROJECT_DEADLINE: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    PAYMENT_RECEIVED: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
    INVOICE_SENT: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
      </svg>
    ),
    SYSTEM_ALERT: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    GENERAL: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    ),
  };

  return (
    <span className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border ${cfg.bg} ${cfg.border} ${cfg.iconColor}`}>
      {icons[type]}
    </span>
  );
}

// ─── Main dropdown ────────────────────────────────────────────────────────────

export default function NotificationDropdown() {
  const { token } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch unread count (for badge) ────────────────────────────────────────

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const count = await notificationsService.getUnreadCount(token);
      setUnreadCount(count);
    } catch {
      // silent — badge not critical
    }
  }, [token]);

  // ── Fetch latest 10 for dropdown ─────────────────────────────────────────

  const fetchDropdown = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await notificationsService.list(token, { limit: 10, sortOrder: "desc" });
      setNotifications(data.items);
      setUnreadCount(data.items.filter((n) => !n.isRead).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Poll every 30s ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    fetchCount();
    pollRef.current = setInterval(fetchCount, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchCount, token]);

  // ── When open, fetch dropdown + poll faster ───────────────────────────────

  useEffect(() => {
    if (!token) return;
    if (isOpen) {
      fetchDropdown();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchDropdown, 15000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchCount, 30000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, fetchDropdown, fetchCount, token]);

  // ── Mark single read + navigate ───────────────────────────────────────────

  const handleNotificationClick = async (n: Notification) => {
    setIsOpen(false);
    if (!token) return;
    if (!n.isRead) {
      try {
        await notificationsService.markRead(token, n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
    const link = getNotificationLink(n);
    if (link) router.push(link);
  };

  // ── Mark all read ─────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        className="dropdown-toggle relative flex items-center justify-center text-gray-500 transition-colors bg-transparent hover:bg-gray-100 rounded hover:text-gray-700 h-8 w-8 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Notifications"
      >
        {/* Unread badge */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 z-10 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-error-500 border-2 border-white dark:border-gray-900 px-1">
            <span className="text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span className="absolute inline-flex w-full h-full rounded-full bg-error-400 opacity-60 animate-ping" />
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex flex-col w-[360px] sm:w-[380px] lg:right-0 rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h5>
            {hasUnread && (
              <span className="inline-flex items-center rounded-full bg-error-50 dark:bg-error-900/30 px-2 py-0.5 text-xs font-bold text-error-600 dark:text-error-400">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50"
              >
                {markingAll ? "…" : "Mark all read"}
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="dropdown-toggle flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.47 3.47a.75.75 0 011.06 0L8 6.94l3.47-3.47a.75.75 0 111.06 1.06L9.06 8l3.47 3.47a.75.75 0 11-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 01-1.06-1.06L6.94 8 3.47 4.53a.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto max-h-[380px]">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">All caught up!</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No notifications right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((n) => {
                const cfg = NOTIFICATION_TYPE_CONFIG[n.type];
                const link = getNotificationLink(n);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        !n.isRead ? "bg-brand-50/40 dark:bg-brand-900/10" : ""
                      }`}
                    >
                      <NotificationIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${!n.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-brand-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(n.createdAt)}</span>
                          {link && (
                            <span className="text-[11px] text-brand-500 dark:text-brand-400">→ View</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            View all notifications
          </Link>
          <Link
            href="/notifications/preferences"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Notification settings"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
