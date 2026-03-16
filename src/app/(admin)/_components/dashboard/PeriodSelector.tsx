"use client";

import React from "react";
import type { PeriodPreset, PeriodParams } from "@/types/dashboard";

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

interface Props {
  value: PeriodParams;
  onChange: (v: PeriodParams) => void;
}

const PeriodSelector: React.FC<Props> = ({ value, onChange }) => {
  const isCustom = value.period === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value.period ?? "this_month"}
        onChange={(e) =>
          onChange({
            period: e.target.value as PeriodPreset,
            startDate: undefined,
            endDate: undefined,
          })
        }
        className="h-9 rounded border border-gray-300 bg-white px-3 text-[13px] font-medium text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {isCustom && (
        <>
          <input
            type="date"
            value={value.startDate ?? ""}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className="h-9 rounded border border-gray-300 bg-white px-3 text-[13px] text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
          />
          <span className="text-[13px] text-gray-400">to</span>
          <input
            type="date"
            value={value.endDate ?? ""}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            className="h-9 rounded border border-gray-300 bg-white px-3 text-[13px] text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
          />
        </>
      )}
    </div>
  );
};

export default PeriodSelector;
