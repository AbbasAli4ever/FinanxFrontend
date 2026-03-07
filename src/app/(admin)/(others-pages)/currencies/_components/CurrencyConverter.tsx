"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import currencyService from "@/services/currencyService";
import type { Currency, ConversionResult } from "@/types/currency";

interface Props {
  currencies: Currency[];
}

const CurrencyConverter: React.FC<Props> = ({ currencies }) => {
  const { token } = useAuth();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1000");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-set "to" to first non-base currency
  useEffect(() => {
    const nonBase = currencies.find((c) => !c.isBaseCurrency);
    if (nonBase && !to) setTo(nonBase.code);
  }, [currencies, to]);

  const convert = useCallback(async () => {
    if (!token || !from || !to || !amount || from === to) return;
    setLoading(true);
    setError("");
    try {
      const res = await currencyService.convert(from, to, Number(amount), undefined, token);
      setResult(res);
    } catch {
      setError("No exchange rate available for this pair.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [token, from, to, amount]);

  // Debounce auto-convert
  useEffect(() => {
    if (!from || !to || !amount || from === to) return;
    const t = setTimeout(convert, 600);
    return () => clearTimeout(t);
  }, [convert]);

  const fromCcy = currencies.find((c) => c.code === from);
  const toCcy = currencies.find((c) => c.code === to);

  const inputCls =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

  return (
    <div className="rounded-2xl border border-brand-200 bg-linear-to-br from-brand-50 to-white p-5 dark:border-brand-800/40 dark:from-brand-900/20 dark:to-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
            <path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/>
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Currency Converter</h3>
      </div>

      <div className="space-y-3">
        {/* From */}
        <div className="flex items-center gap-2">
          <div className="w-24">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">From</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + " w-full"}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
                {fromCcy?.symbol ?? ""}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls + " w-full pl-7"}
              />
            </div>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={() => { const tmp = from; setFrom(to); setTo(tmp); setResult(null); }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-brand-900/30"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="flex items-center gap-2">
          <div className="w-24">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">To</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + " w-full"}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">Result</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
                {toCcy?.symbol ?? ""}
              </span>
              <div className={inputCls + " flex w-full items-center pl-7"}>
                {loading ? (
                  <span className="text-gray-400 text-xs animate-pulse">Converting…</span>
                ) : result ? (
                  <span className="font-semibold text-success-700 dark:text-success-400">
                    {Number(result.convertedAmount).toLocaleString("en-US", {
                      minimumFractionDigits: toCcy?.decimalPlaces ?? 2,
                      maximumFractionDigits: toCcy?.decimalPlaces ?? 2,
                    })}
                  </span>
                ) : (
                  <span className="text-gray-300 dark:text-gray-600">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate info */}
        {result && !error && (
          <div className="rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
            {result.rate != null ? (
              <span>1 {from} = {Number(result.rate).toFixed(6)} {to}</span>
            ) : result.fromRate != null && result.toRate != null ? (
              <span>Cross-rate via base · {from} {Number(result.fromRate).toFixed(6)} → {to} {Number(result.toRate).toFixed(6)}</span>
            ) : null}
          </div>
        )}
        {error && (
          <p className="text-xs text-error-600 dark:text-error-400">{error}</p>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;
