"use client";

import React from "react";
import type { PeriodComparison, ChangeDirection } from "@/types/dashboard";

function fmt(n: number, isCurrency = true): string {
  const prefix = isCurrency ? "$" : "";
  if (Math.abs(n) >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${Math.round(n).toLocaleString()}`;
}

const CURRENCY_KEYS = new Set(["revenue", "expenses", "netIncome"]);
const isMonetary = (key: string) => CURRENCY_KEYS.has(key);

interface ArrowProps {
  direction: ChangeDirection;
  percent: number | null;
  invertColors?: boolean;
}

const ChangeIndicator: React.FC<ArrowProps> = ({ direction, percent, invertColors }) => {
  if (direction === "new") {
    return <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">New</span>;
  }
  if (direction === "flat") {
    return <span className="text-xs text-gray-400">— Flat</span>;
  }
  const isUp = direction === "up";
  const isGood = invertColors ? !isUp : isUp;
  const color = isGood ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      {isUp ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
      {percent !== null ? `${Math.abs(percent).toFixed(1)}%` : ""}
    </span>
  );
};

interface Props {
  data: PeriodComparison | null;
  loading?: boolean;
}

const PeriodComparisonCards: React.FC<Props> = ({ data, loading }) => {
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Period Comparison</h3>
        </div>
        {data && !loading && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span>{fmtDate(data.current.start)} – {fmtDate(data.current.end)}</span>
            </div>
            <span>vs</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{fmtDate(data.previous.start)} – {fmtDate(data.previous.end)}</span>
            </div>
          </div>
        )}
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {data.metrics.map((m) => {
            const monetary = isMonetary(m.key);
            const invertColors = m.key === "expenses";
            return (
              <div
                key={m.key}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-700/60 dark:bg-gray-800/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {m.label}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  {fmt(m.currentValue, monetary)}
                </p>
                <p className="text-[11px] text-gray-400">
                  prev: {fmt(m.previousValue, monetary)}
                </p>
                <div className="mt-1.5">
                  <ChangeIndicator
                    direction={m.changeDirection}
                    percent={m.changePercent}
                    invertColors={invertColors}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PeriodComparisonCards;
