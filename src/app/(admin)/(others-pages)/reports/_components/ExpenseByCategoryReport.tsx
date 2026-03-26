"use client";

import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import AppDatePicker from "@/components/form/AppDatePicker";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { ExpenseByCategoryReport as ExpenseData, ExpenseCategory } from "@/types/reports";
import ReportExportButtons from "./ReportExportButtons";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function firstDayOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

type PresetKey = "MTD" | "QTD" | "YTD" | "CUSTOM";

function getPresetDates(preset: PresetKey): { startDate: string; endDate: string } {
  const now = new Date();
  const today = todayStr();
  switch (preset) {
    case "MTD":
      return { startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, endDate: today };
    case "QTD": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      return { startDate: `${now.getFullYear()}-${String(qMonth).padStart(2, "0")}-01`, endDate: today };
    }
    case "YTD":
      return { startDate: `${now.getFullYear()}-01-01`, endDate: today };
    default:
      return { startDate: firstDayOfYear(), endDate: today };
  }
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "MTD", label: "Month to Date" },
  { key: "QTD", label: "Quarter to Date" },
  { key: "YTD", label: "Year to Date" },
  { key: "CUSTOM", label: "Custom" },
];

// Distinct palette for donut/bar segments
const PALETTE = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
];

// ── SVG Donut Chart ───────────────────────────────────────────
const DonutChart: React.FC<{ categories: ExpenseCategory[]; total: number }> = ({ categories, total }) => {
  const SIZE = 200;
  const RADIUS = 80;
  const STROKE = 28;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let offset = 0;
  const [hovered, setHovered] = useState<number | null>(null);

  const segments = categories.slice(0, 12).map((cat, i) => {
    const pct = total > 0 ? cat.amount / total : 0;
    const dash = pct * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const seg = { offset, dash, gap, color: PALETTE[i % PALETTE.length], cat, pct };
    offset += dash;
    return seg;
  });

  const hoveredCat = hovered !== null ? categories[hovered] : null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] lg:flex-row">
      {/* Donut */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Background track */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth={STROKE} className="dark:stroke-gray-800" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === i ? STROKE + 4 : STROKE}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ opacity: hovered !== null && hovered !== i ? 0.5 : 1 }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {hoveredCat ? (
            <>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 max-w-[80px] leading-tight text-center">
                {hoveredCat.accountName}
              </p>
              <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                {hoveredCat.percentage.toFixed(1)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</p>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {categories.slice(0, 12).map((cat, i) => (
          <div
            key={cat.accountId}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-default ${hovered === i ? "bg-gray-100 dark:bg-gray-700/50" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <span className="flex-1 truncate text-xs text-gray-700 dark:text-gray-300">{cat.accountName}</span>
            <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white">
              {cat.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-56 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-5 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-32 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
const ExpenseByCategoryReport: React.FC = () => {
  const { token } = useAuth();
  const [preset, setPreset] = useState<PresetKey>("YTD");
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(todayStr());
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePresetChange = (key: PresetKey) => {
    setPreset(key);
    if (key !== "CUSTOM") {
      const dates = getPresetDates(key);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await reportsService.getExpenseByCategory(
        { startDate: startDate || undefined, endDate: endDate || undefined },
        token
      );
      setData(result);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Account #", "Category", "Account Type", "Amount", "% of Total"],
      ...data.categories.map((c) => [c.accountNumber, c.accountName, c.accountType, c.amount, c.percentage]),
      ["", "TOTAL", "", data.total, "100"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-by-category-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div>
          <Label>Period</Label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
            className="h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <Label>Start Date</Label>
          <AppDatePicker value={startDate} onChange={(val) => { setStartDate(val); setPreset("CUSTOM"); }} maxToday max={endDate} />
        </div>
        <div className="w-full sm:w-44">
          <Label>End Date</Label>
          <AppDatePicker value={endDate} onChange={(val) => { setEndDate(val); setPreset("CUSTOM"); }} min={startDate} maxToday />
        </div>
        <Button size="sm" onClick={fetchReport} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
        <ReportExportButtons
          reportType="expense-by-category"
          filters={{ startDate, endDate }}
          disabled={loading}
        />
        {data && (
          <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
        )}
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {loading ? (
        <Skeleton />
      ) : data ? (
        <>
          {/* Donut Chart */}
          {data.categories.length > 0 && (
            <DonutChart categories={data.categories} total={data.total} />
          )}

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Expense by Category</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data.categories.length} categor{data.categories.length !== 1 ? "ies" : "y"} · sorted by amount descending
              </p>
            </div>

            {data.categories.length === 0 ? (
              <div className="p-8 text-center text-sm italic text-gray-400 dark:text-gray-500">
                No expense data found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
                      <th className="w-8 px-3 py-3" />
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Category
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Account #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Type
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.categories.map((cat, i) => {
                      const color = PALETTE[i % PALETTE.length];
                      return (
                        <tr key={cat.accountId} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-3">
                            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.accountName}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{cat.accountNumber || "—"}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              {cat.accountType}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                              {formatCurrency(cat.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="w-12 text-right text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                                {cat.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800/60">
                      <td className="px-3 py-3" />
                      <td className="px-5 py-3 text-sm font-bold uppercase text-gray-700 dark:text-gray-300">Total</td>
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3 text-right text-base font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(data.total)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ExpenseByCategoryReport;
