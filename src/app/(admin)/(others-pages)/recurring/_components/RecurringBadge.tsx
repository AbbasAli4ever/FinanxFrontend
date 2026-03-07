"use client";

import React from "react";
import type { RecurringFrequency } from "@/types/recurring";

// ── Frequency label map ──────────────────────────────────────
const FREQ_LABELS: Record<RecurringFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

const FREQ_SHORT: Record<RecurringFrequency, string> = {
  DAILY: "1D",
  WEEKLY: "1W",
  BIWEEKLY: "2W",
  MONTHLY: "1M",
  QUARTERLY: "3M",
  YEARLY: "1Y",
};

// ── Recurring icon (SVG loop/refresh) ────────────────────────
const RecurringIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ── Props ────────────────────────────────────────────────────
interface RecurringBadgeProps {
  frequency: RecurringFrequency | string | null;
  isActive?: boolean;   // true = recurring active, false = paused
  showLabel?: boolean;  // show full label or just icon+short code
  size?: "sm" | "md";
  tooltip?: boolean;
}

const RecurringBadge: React.FC<RecurringBadgeProps> = ({
  frequency,
  isActive = true,
  showLabel = false,
  size = "sm",
  tooltip = true,
}) => {
  const freq = frequency as RecurringFrequency | null;
  const label = freq ? FREQ_LABELS[freq] ?? freq : "Recurring";
  const short = freq ? FREQ_SHORT[freq] ?? freq : "—";

  const baseClasses =
    size === "sm"
      ? "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

  const activeClasses = isActive
    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
    : "bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400 line-through";

  const title = tooltip
    ? isActive
      ? `Recurring: ${label}`
      : `Paused (was ${label})`
    : undefined;

  return (
    <span className={`${baseClasses} ${activeClasses}`} title={title}>
      <RecurringIcon size={size === "sm" ? 10 : 12} />
      {showLabel ? label : short}
    </span>
  );
};

export { RecurringIcon, FREQ_LABELS, FREQ_SHORT };
export default RecurringBadge;
