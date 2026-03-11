"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import notificationsService from "@/services/notificationsService";
import type { NotificationPreference, NotificationType } from "@/types/notifications";
import { NOTIFICATION_TYPE_CONFIG } from "@/types/notifications";
import {
  HiOutlineBell,
  HiOutlineMail,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import {
  MdOutlineReceipt,
  MdOutlineInventory2,
  MdOutlineRepeat,
  MdOutlineTimelapse,
  MdOutlineCalendarToday,
  MdOutlineAttachMoney,
  MdOutlineSend,
  MdOutlineNotifications,
} from "react-icons/md";

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  INVOICE_OVERDUE: <MdOutlineReceipt className="w-5 h-5" />,
  BILL_OVERDUE: <MdOutlineReceipt className="w-5 h-5" />,
  LOW_STOCK: <MdOutlineInventory2 className="w-5 h-5" />,
  RECURRING_UPCOMING: <MdOutlineRepeat className="w-5 h-5" />,
  EXPENSE_PENDING_APPROVAL: <MdOutlineTimelapse className="w-5 h-5" />,
  PROJECT_DEADLINE: <MdOutlineCalendarToday className="w-5 h-5" />,
  PAYMENT_RECEIVED: <MdOutlineAttachMoney className="w-5 h-5" />,
  INVOICE_SENT: <MdOutlineSend className="w-5 h-5" />,
  SYSTEM_ALERT: <HiOutlineExclamationCircle className="w-5 h-5" />,
  GENERAL: <MdOutlineNotifications className="w-5 h-5" />,
};

const ORDERED_TYPES: NotificationType[] = [
  "INVOICE_OVERDUE",
  "BILL_OVERDUE",
  "PAYMENT_RECEIVED",
  "INVOICE_SENT",
  "EXPENSE_PENDING_APPROVAL",
  "RECURRING_UPCOMING",
  "LOW_STOCK",
  "PROJECT_DEADLINE",
  "SYSTEM_ALERT",
  "GENERAL",
];

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label: string;
}

function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer"
      } ${
        checked
          ? "bg-brand-500"
          : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<Map<NotificationType, NotificationPreference>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const loadPreferences = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await notificationsService.getPreferences(token);
      const map = new Map<NotificationType, NotificationPreference>();
      data.forEach((p) => map.set(p.notificationType, p));
      // Fill defaults for any missing types
      ORDERED_TYPES.forEach((t) => {
        if (!map.has(t)) {
          map.set(t, { notificationType: t, inAppEnabled: true, emailEnabled: false });
        }
      });
      setPreferences(map);
    } catch {
      setErrorMsg("Failed to load notification preferences.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  function handleToggle(type: NotificationType, channel: "inAppEnabled" | "emailEnabled", val: boolean) {
    setPreferences((prev) => {
      const next = new Map(prev);
      const pref = next.get(type)!;
      next.set(type, { ...pref, [channel]: val });
      return next;
    });
    setDirty(true);
    setSaveStatus("idle");
  }

  function handleSetAll(channel: "inAppEnabled" | "emailEnabled", val: boolean) {
    setPreferences((prev) => {
      const next = new Map(prev);
      ORDERED_TYPES.forEach((t) => {
        const pref = next.get(t)!;
        next.set(t, { ...pref, [channel]: val });
      });
      return next;
    });
    setDirty(true);
    setSaveStatus("idle");
  }

  async function handleSave() {
    if (!token || !dirty) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const payload = ORDERED_TYPES.map((t) => {
        const p = preferences.get(t)!;
        return {
          notificationType: p.notificationType,
          inAppEnabled: p.inAppEnabled,
          emailEnabled: p.emailEnabled,
        };
      });
      await notificationsService.updatePreferences(token, payload);
      setSaveStatus("success");
      setDirty(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setErrorMsg("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Skeleton rows
  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-8">
                <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allInApp = ORDERED_TYPES.every((t) => preferences.get(t)?.inAppEnabled);
  const allEmail = ORDERED_TYPES.every((t) => preferences.get(t)?.emailEnabled);
  const noneInApp = ORDERED_TYPES.every((t) => !preferences.get(t)?.inAppEnabled);
  const noneEmail = ORDERED_TYPES.every((t) => !preferences.get(t)?.emailEnabled);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose which notifications you receive and through which channels.
        </p>
      </div>

      {/* Error banner */}
      {saveStatus === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20 p-4 text-sm text-error-700 dark:text-error-300">
          <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success banner */}
      {saveStatus === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20 p-4 text-sm text-success-700 dark:text-success-300">
          <HiOutlineCheck className="w-5 h-5 shrink-0" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      {/* Info callout */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
        <HiOutlineInformationCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">About notification channels</p>
          <p className="mt-0.5 text-blue-600 dark:text-blue-400">
            <strong>In-App</strong> — shown in the notification bell inside FinanX.{" "}
            <strong>Email</strong> — sent to your registered email address.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Notification Type
          </span>
          <div className="flex gap-8 pr-1">
            {/* In-App column header + bulk toggle */}
            <div className="flex flex-col items-center gap-1 w-11">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <HiOutlineBell className="w-3.5 h-3.5" />
                <span>In-App</span>
              </div>
              <button
                type="button"
                onClick={() => handleSetAll("inAppEnabled", !allInApp)}
                className="text-[10px] text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-2"
              >
                {allInApp ? "None" : noneInApp ? "All" : "All"}
              </button>
            </div>

            {/* Email column header + bulk toggle */}
            <div className="flex flex-col items-center gap-1 w-11">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <HiOutlineMail className="w-3.5 h-3.5" />
                <span>Email</span>
              </div>
              <button
                type="button"
                onClick={() => handleSetAll("emailEnabled", !allEmail)}
                className="text-[10px] text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-2"
              >
                {allEmail ? "None" : noneEmail ? "All" : "All"}
              </button>
            </div>
          </div>
        </div>

        {/* Rows */}
        {ORDERED_TYPES.map((type, idx) => {
          const config = NOTIFICATION_TYPE_CONFIG[type];
          const pref = preferences.get(type);
          const isLast = idx === ORDERED_TYPES.length - 1;

          return (
            <div
              key={type}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                !isLast ? "border-b border-gray-100 dark:border-gray-800" : ""
              }`}
            >
              {/* Left: icon + label */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${config.bg} ${config.iconColor} shrink-0`}>
                  {TYPE_ICONS[type]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {type}
                  </p>
                </div>
              </div>

              {/* Right: toggles */}
              <div className="flex gap-8 pr-1">
                <div className="flex justify-center w-11">
                  <ToggleSwitch
                    checked={pref?.inAppEnabled ?? true}
                    onChange={(val) => handleToggle(type, "inAppEnabled", val)}
                    label={`${config.label} in-app notifications`}
                  />
                </div>
                <div className="flex justify-center w-11">
                  <ToggleSwitch
                    checked={pref?.emailEnabled ?? false}
                    onChange={(val) => handleToggle(type, "emailEnabled", val)}
                    label={`${config.label} email notifications`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: save */}
      <div className="flex items-center justify-between pt-2">
        {dirty ? (
          <p className="text-sm text-warning-600 dark:text-warning-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning-500 animate-pulse" />
            Unsaved changes
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-600">All changes saved</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            dirty && !saving
              ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <HiOutlineCheck className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
