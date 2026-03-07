"use client";

/**
 * CurrencySelector — drop-in component for transaction forms (Invoice, Bill, Expense, etc.)
 *
 * Props:
 *  - currencies       — enabled Currency[] from the API (pass your loaded list)
 *  - currencyCode     — currently selected code
 *  - exchangeRate     — currently entered exchange rate
 *  - baseCurrencyCode — the company base currency (e.g. "USD")
 *  - onChange         — called whenever currency or rate changes
 *  - totalInForeign   — (optional) subtotal denominated in the foreign currency, for preview
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import currencyService from "@/services/currencyService";
import type { Currency } from "@/types/currency";

const SOURCE_COLORS: Record<string, string> = {
  AUTO: "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300",
  MANUAL: "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  LIVE: "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
};

interface CurrencySelectorProps {
  currencies: Currency[];
  currencyCode: string;
  exchangeRate: number;
  baseCurrencyCode: string;
  totalInForeign?: number;
  onChange: (currencyCode: string, exchangeRate: number) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currencies,
  currencyCode,
  exchangeRate,
  baseCurrencyCode,
  totalInForeign,
  onChange,
}) => {
  const { token } = useAuth();
  const [fetching, setFetching] = useState(false);
  const [rateInfo, setRateInfo] = useState<{ date: string; rate: number; source: string } | null>(null);
  const [rateError, setRateError] = useState("");
  const prevCode = useRef<string>(currencyCode);

  const isBase = currencyCode === baseCurrencyCode;

  // Fetch latest stored rate (auto-fetches from live API if missing)
  const fetchLatestRate = useCallback(
    async (code: string) => {
      if (!token || code === baseCurrencyCode) return;
      setFetching(true);
      setRateError("");
      try {
        const res = await currencyService.getLatestRate(code, token);
        const rate = parseFloat(res.rate);
        setRateInfo({ date: res.effectiveDate, rate, source: res.source });
        onChange(code, rate);
      } catch {
        setRateError(`No exchange rate found for ${code}. Enter rate manually.`);
        setRateInfo(null);
      } finally {
        setFetching(false);
      }
    },
    [token, baseCurrencyCode, onChange]
  );

  // Fetch real-time live rate (not stored) — for the refresh button
  const fetchLiveRate = useCallback(
    async () => {
      if (!token || !currencyCode || currencyCode === baseCurrencyCode) return;
      setFetching(true);
      setRateError("");
      try {
        const res = await currencyService.getLiveRate(currencyCode, token);
        const rate = Number(res.rate);
        setRateInfo({ date: res.fetchedAt, rate, source: "LIVE" });
        onChange(currencyCode, rate);
      } catch {
        setRateError(`Could not fetch live rate for ${currencyCode}.`);
      } finally {
        setFetching(false);
      }
    },
    [token, currencyCode, baseCurrencyCode, onChange]
  );

  // When currency changes, auto-fetch latest rate
  useEffect(() => {
    if (currencyCode !== prevCode.current) {
      prevCode.current = currencyCode;
      if (currencyCode === baseCurrencyCode) {
        onChange(currencyCode, 1);
        setRateInfo(null);
        setRateError("");
      } else {
        fetchLatestRate(currencyCode);
      }
    }
  }, [currencyCode, baseCurrencyCode, fetchLatestRate, onChange]);

  const selectedCcy = currencies.find((c) => c.code === currencyCode);
  const baseCcy = currencies.find((c) => c.code === baseCurrencyCode);

  // Compute base amount preview
  const basePreview =
    !isBase && totalInForeign !== undefined && exchangeRate > 0
      ? totalInForeign / exchangeRate
      : null;

  const inputCls =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-800/30">
      <div className="flex flex-wrap items-end gap-3">
        {/* Currency picker */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Currency</label>
          <select
            value={currencyCode}
            onChange={(e) => onChange(e.target.value, e.target.value === baseCurrencyCode ? 1 : exchangeRate)}
            className={inputCls}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Exchange rate — only shown for non-base currencies */}
        {!isBase && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Exchange Rate
              <span className="ml-1 text-gray-400">(1 {baseCurrencyCode} = X {currencyCode})</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0.000001"
                step="any"
                value={exchangeRate || ""}
                onChange={(e) => onChange(currencyCode, Number(e.target.value))}
                placeholder="0.0000"
                className={inputCls + " w-32"}
              />
              {/* Latest stored rate (auto-fetched) */}
              <button
                type="button"
                onClick={() => fetchLatestRate(currencyCode)}
                disabled={fetching}
                className="flex h-10 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                title="Load latest stored rate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={fetching ? "animate-spin" : ""}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                {fetching ? "…" : "Latest"}
              </button>
              {/* Real-time live rate */}
              <button
                type="button"
                onClick={fetchLiveRate}
                disabled={fetching}
                className="flex h-10 items-center gap-1 rounded-lg border border-warning-200 bg-warning-50 px-2.5 text-xs font-medium text-warning-700 hover:bg-warning-100 disabled:opacity-50 dark:border-warning-800/40 dark:bg-warning-900/10 dark:text-warning-400"
                title="Fetch real-time live rate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                Live
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info / preview row */}
      {!isBase && (
        <div className="mt-2.5 space-y-1">
          {rateInfo && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-brand-700 dark:text-brand-400">
              <span className="font-medium">1 {baseCurrencyCode} = {rateInfo.rate.toFixed(6)} {currencyCode}</span>
              <span className="text-brand-400">
                · as of {new Date(rateInfo.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {rateInfo.source && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${SOURCE_COLORS[rateInfo.source] ?? "bg-gray-100 text-gray-500"}`}>
                  {rateInfo.source}
                </span>
              )}
            </p>
          )}
          {rateError && (
            <p className="text-xs text-warning-700 dark:text-warning-400">{rateError}</p>
          )}
          {basePreview !== null && exchangeRate > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {selectedCcy?.symbol}{(totalInForeign ?? 0).toLocaleString("en-US", { minimumFractionDigits: selectedCcy?.decimalPlaces ?? 2, maximumFractionDigits: selectedCcy?.decimalPlaces ?? 2 })}
              </span>
              {" "}≈{" "}
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {baseCcy?.symbol}{basePreview.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCurrencyCode}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
