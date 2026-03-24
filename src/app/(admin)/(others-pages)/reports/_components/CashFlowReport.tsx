"use client";

import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import AppDatePicker from "@/components/form/AppDatePicker";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { CashFlowStatement, CashFlowItem } from "@/types/reports";

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

// ── Section header colors ─────────────────────────────────────
const SECTION_STYLES = {
  operating: {
    header: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    total: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  investing: {
    header: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    total: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  financing: {
    header: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    total: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
};

// ── Collapsible Section ───────────────────────────────────────
interface SectionProps {
  title: string;
  subtitle: string;
  total: number;
  style: typeof SECTION_STYLES.operating;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<SectionProps> = ({
  title,
  subtitle,
  total,
  style,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl border ${style.border} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between px-5 py-4 text-left ${style.header}`}
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
          <div>
            <p className="text-sm font-bold tracking-wide uppercase">{title}</p>
            <p className="text-xs opacity-70">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-base font-bold tabular-nums ${style.total}`}>
            {formatCurrency(total)}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Single line item ──────────────────────────────────────────
const LineItem: React.FC<{ item: CashFlowItem; indent?: boolean }> = ({ item, indent }) => (
  <div className={`flex items-center justify-between bg-white px-5 py-3 dark:bg-white/[0.02] ${indent ? "pl-10" : ""}`}>
    <div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{item.name}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{item.accountType}</p>
    </div>
    <span className={`text-sm font-medium tabular-nums ${item.amount >= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
      {formatCurrency(item.amount)}
    </span>
  </div>
);

// ── Subtotal row ──────────────────────────────────────────────
const SubtotalRow: React.FC<{ label: string; amount: number }> = ({ label, amount }) => (
  <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/80 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/40">
    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    <span className={`text-sm font-bold tabular-nums ${amount >= 0 ? "text-success-700 dark:text-success-400" : "text-error-700 dark:text-error-400"}`}>
      {formatCurrency(amount)}
    </span>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-14 bg-gray-100 dark:bg-gray-800" />
        <div className="space-y-2 p-4">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex justify-between">
              <div className="h-4 w-44 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────
const CashFlowReport: React.FC = () => {
  const { token } = useAuth();
  const [preset, setPreset] = useState<PresetKey>("YTD");
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(todayStr());
  const [data, setData] = useState<CashFlowStatement | null>(null);
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
      const result = await reportsService.getCashFlowStatement(
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

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div>
          <Label>Period</Label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
            className="h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {loading ? (
        <Skeleton />
      ) : data ? (
        <div className="space-y-4">
          {/* Report Title */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Flow Statement</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(data.period.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              {" — "}
              {new Date(data.period.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Operating Activities */}
          <CollapsibleSection
            title="Operating Activities"
            subtitle="Core business operations"
            total={data.operating.totalOperating}
            style={SECTION_STYLES.operating}
          >
            {/* Net Income special row */}
            <div className="flex items-center justify-between bg-white px-5 py-3 dark:bg-white/[0.02]">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Income</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Starting point</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${data.operating.netIncome >= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                {formatCurrency(data.operating.netIncome)}
              </span>
            </div>
            {/* Adjustments */}
            {data.operating.adjustments.length > 0 && (
              <>
                <div className="bg-gray-50/60 px-5 py-1.5 dark:bg-gray-800/30">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Adjustments for Working Capital</p>
                </div>
                {data.operating.adjustments.map((item, i) => (
                  <LineItem key={i} item={item} indent />
                ))}
                <SubtotalRow label="Total Adjustments" amount={data.operating.totalAdjustments} />
              </>
            )}
            <SubtotalRow label="Net Cash from Operating" amount={data.operating.totalOperating} />
          </CollapsibleSection>

          {/* Investing Activities */}
          <CollapsibleSection
            title="Investing Activities"
            subtitle="Capital expenditures & investments"
            total={data.investing.totalInvesting}
            style={SECTION_STYLES.investing}
          >
            {data.investing.items.length > 0 ? (
              data.investing.items.map((item, i) => <LineItem key={i} item={item} />)
            ) : (
              <div className="bg-white px-5 py-4 text-sm italic text-gray-400 dark:bg-white/[0.02] dark:text-gray-500">
                No investing activities in this period
              </div>
            )}
            <SubtotalRow label="Net Cash from Investing" amount={data.investing.totalInvesting} />
          </CollapsibleSection>

          {/* Financing Activities */}
          <CollapsibleSection
            title="Financing Activities"
            subtitle="Debt, equity & dividends"
            total={data.financing.totalFinancing}
            style={SECTION_STYLES.financing}
          >
            {data.financing.items.length > 0 ? (
              data.financing.items.map((item, i) => <LineItem key={i} item={item} />)
            ) : (
              <div className="bg-white px-5 py-4 text-sm italic text-gray-400 dark:bg-white/[0.02] dark:text-gray-500">
                No financing activities in this period
              </div>
            )}
            <SubtotalRow label="Net Cash from Financing" amount={data.financing.totalFinancing} />
          </CollapsibleSection>

          {/* Summary bar */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800/40">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Beginning Cash</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(data.beginningCash)}
              </p>
            </div>
            <div className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-4 ${data.netChangeInCash >= 0 ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20" : "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20"}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Net Change in Cash</p>
              <p className={`text-xl font-bold tabular-nums ${data.netChangeInCash >= 0 ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                {data.netChangeInCash >= 0 ? "+" : ""}{formatCurrency(data.netChangeInCash)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 dark:border-brand-800 dark:bg-brand-900/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Ending Cash</p>
              <p className="text-xl font-bold tabular-nums text-brand-700 dark:text-brand-300">
                {formatCurrency(data.endingCash)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CashFlowReport;
