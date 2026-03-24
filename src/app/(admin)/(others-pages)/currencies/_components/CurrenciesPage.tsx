"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import AppDatePicker from "@/components/form/AppDatePicker";
import currencyService from "@/services/currencyService";
import type {
  Currency,
  SupportedCurrency,
  ExchangeRate,
  CreateExchangeRatePayload,
} from "@/types/currency";
import CurrencyConverter from "./CurrencyConverter";

// ── Helpers ──────────────────────────────────────────────────────
function fmtDate(s: string) {
  if (!s) return "—";
  // Date-only strings like "2026-03-06" must be parsed as local time by appending time
  // otherwise UTC midnight shifts to the previous day in negative-offset timezones
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return s; // fallback: show raw value rather than "Invalid Date"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Skeleton ──────────────────────────────────────────────────────
const Skeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
    ))}
  </div>
);

// ── Enabled Currencies tab ───────────────────────────────────────
interface EnabledCurrenciesTabProps {
  currencies: Currency[];
  supported: SupportedCurrency[];
  loading: boolean;
  onRefresh: () => void;
}

const EnabledCurrenciesTab: React.FC<EnabledCurrenciesTabProps> = ({
  currencies,
  supported,
  loading,
  onRefresh,
}) => {
  const { token } = useAuth();
  const [adding, setAdding] = useState(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Latest rates per currency code
  const [latestRates, setLatestRates] = useState<Record<string, { rate: string; source: string } | null>>({});

  // Supported currencies not already enabled
  const enabledCodes = new Set(currencies.map((c) => c.code));
  const available = supported.filter((s) => !enabledCodes.has(s.code));

  // Fetch latest rate for each non-base currency
  useEffect(() => {
    if (!token) return;
    const nonBase = currencies.filter((c) => !c.isBaseCurrency);
    nonBase.forEach(async (c) => {
      try {
        const res = await currencyService.getLatestRate(c.code, token);
        setLatestRates((prev) => ({ ...prev, [c.code]: { rate: res.rate, source: res.source } }));
      } catch {
        setLatestRates((prev) => ({ ...prev, [c.code]: null }));
      }
    });
  }, [token, currencies]);

  const handleEnable = async () => {
    if (!token || !selectedCode) return;
    const chosen = supported.find((s) => s.code === selectedCode);
    if (!chosen) return;
    setSaving(true);
    setError("");
    try {
      await currencyService.enable({ code: chosen.code, name: chosen.name, symbol: chosen.symbol, decimalPlaces: chosen.decimalPlaces }, token);
      setSuccess(`${chosen.name} (${chosen.code}) enabled successfully.`);
      setAdding(false);
      setSelectedCode("");
      onRefresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to enable currency.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (currency: Currency) => {
    if (!token || currency.isBaseCurrency) return;
    if (!confirm(`Disable ${currency.name} (${currency.code})? It will no longer be available for new transactions.`)) return;
    setDisabling(currency.id);
    try {
      await currencyService.disable(currency.id, token);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to disable currency.");
    } finally {
      setDisabling(null);
    }
  };

  const inputCls = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-error-500">×</button>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400">
          {success}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currencies.length} currenc{currencies.length !== 1 ? "ies" : "y"} enabled
        </p>
        <button
          onClick={() => { setAdding(!adding); setSelectedCode(""); }}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Currency
        </button>
      </div>

      {/* Add currency form */}
      {adding && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800/40 dark:bg-brand-900/10">
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Enable New Currency</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Select Currency</label>
              <select value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)} className={inputCls + " w-full"}>
                <option value="">— Choose a currency —</option>
                {available.map((s) => (
                  <option key={s.code} value={s.code}>{s.code} — {s.name} ({s.symbol})</option>
                ))}
              </select>
            </div>
            {selectedCode && (
              <div className="flex items-end gap-2 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-800">
                <span className="text-lg font-bold text-gray-700 dark:text-white">
                  {supported.find((s) => s.code === selectedCode)?.symbol}
                </span>
                <div>
                  <p className="text-xs text-gray-400">{supported.find((s) => s.code === selectedCode)?.name}</p>
                  <p className="text-[11px] text-gray-300">{supported.find((s) => s.code === selectedCode)?.decimalPlaces} decimal places</p>
                </div>
              </div>
            )}
            <button
              onClick={handleEnable}
              disabled={!selectedCode || saving}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Enabling…" : "Enable"}
            </button>
            <button onClick={() => setAdding(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          {/* Head */}
          <div className="grid grid-cols-[60px_1fr_80px_80px_130px_90px_44px] border-b border-gray-200 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
            <span>Symbol</span>
            <span>Currency</span>
            <span>Code</span>
            <span>Decimals</span>
            <span>Latest Rate</span>
            <span>Type</span>
            <span />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {currencies.map((c) => {
              const lr = latestRates[c.code];
              return (
                <div key={c.id} className="grid grid-cols-[60px_1fr_80px_80px_130px_90px_44px] items-center gap-2 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/20">
                  {/* Symbol */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                    <span className="text-base font-bold text-brand-700 dark:text-brand-300">{c.symbol}</span>
                  </div>
                  {/* Name */}
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{c.name}</p>
                    <p className="text-[11px] text-gray-400">Added {fmtDate(c.createdAt)}</p>
                  </div>
                  {/* Code */}
                  <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{c.code}</span>
                  {/* Decimals */}
                  <span className="text-sm text-gray-500 dark:text-gray-400">{c.decimalPlaces}</span>
                  {/* Latest Rate */}
                  <div>
                    {c.isBaseCurrency ? (
                      <span className="text-sm text-gray-400">1.000000</span>
                    ) : lr === undefined ? (
                      <span className="text-xs text-gray-300 dark:text-gray-600 animate-pulse">Loading…</span>
                    ) : lr === null ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-gray-700 dark:text-gray-200">{parseFloat(lr.rate).toFixed(6)}</span>
                        <SourceBadge source={lr.source} />
                      </div>
                    )}
                  </div>
                  {/* Type */}
                  {c.isBaseCurrency ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      Base
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                  {/* Actions */}
                  <div className="flex justify-end">
                    {!c.isBaseCurrency && (
                      <button
                        onClick={() => handleDisable(c)}
                        disabled={disabling === c.id}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 disabled:opacity-50 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                        title="Disable currency"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Source badge ──────────────────────────────────────────────────
const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const map: Record<string, string> = {
    AUTO: "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300",
    MANUAL: "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400",
    LIVE: "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
    IDENTITY: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[source] ?? map.IDENTITY}`}>
      {source}
    </span>
  );
};

// ── Exchange Rates tab ────────────────────────────────────────────
interface ExchangeRatesTabProps {
  currencies: Currency[];
}

interface BulkRow {
  targetCurrency: string;
  rate: string;
}

const ExchangeRatesTab: React.FC<ExchangeRatesTabProps> = ({ currencies }) => {
  const { token } = useAuth();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Single rate form
  const [singleForm, setSingleForm] = useState<CreateExchangeRatePayload>({
    targetCurrency: "",
    rate: 0,
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  // Bulk form — one row per non-base currency
  const nonBase = currencies.filter((c) => !c.isBaseCurrency);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setBulkRows(nonBase.map((c) => ({ targetCurrency: c.code, rate: "" })));
  }, [currencies]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await currencyService.getRates(
        {
          targetCurrency: filterCurrency || undefined,
          startDate: filterFrom || undefined,
          endDate: filterTo || undefined,
          limit: 100,
        },
        token
      );
      setRates(data.rates);
    } catch {
      setError("Failed to load exchange rates.");
    } finally {
      setLoading(false);
    }
  }, [token, filterCurrency, filterFrom, filterTo]);

  useEffect(() => { loadRates(); }, [loadRates]);

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await currencyService.createRate(singleForm, token);
      setSuccess("Exchange rate saved.");
      setShowAddForm(false);
      setSingleForm({ targetCurrency: "", rate: 0, effectiveDate: new Date().toISOString().slice(0, 10) });
      loadRates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save rate.");
    }
  };

  const handleBulkSave = async () => {
    if (!token) return;
    const valid = bulkRows.filter((r) => r.rate && Number(r.rate) > 0);
    if (valid.length === 0) return;
    try {
      const res = await currencyService.bulkCreateRates({
        rates: valid.map((r) => ({ targetCurrency: r.targetCurrency, rate: Number(r.rate), effectiveDate: bulkDate })),
      }, token);
      setSuccess(`${res.count} rate(s) saved.`);
      setShowBulk(false);
      loadRates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bulk save failed.");
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!token || !confirm("Delete this exchange rate?")) return;
    try {
      await currencyService.deleteRate(id, token);
      loadRates();
    } catch {
      setError("Failed to delete rate.");
    }
  };

  const handleSyncRates = async () => {
    if (!token) return;
    setSyncing(true);
    setError("");
    try {
      const res = await currencyService.syncRates(token);
      setSuccess(`Synced ${res.synced} rate(s) from live data.`);
      loadRates();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Failed to sync rates. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  const inputCls = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
  const baseCcy = currencies.find((c) => c.isBaseCurrency);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-error-500">×</button>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400">
          {success}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} className={inputCls}>
          <option value="">All Currencies</option>
          {nonBase.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
        </select>
        <AppDatePicker value={filterFrom} onChange={(val) => setFilterFrom(val)} maxToday max={filterTo} />
        <AppDatePicker value={filterTo} onChange={(val) => setFilterTo(val)} min={filterFrom} maxToday />
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleSyncRates}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Fetch live rates for all enabled currencies"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={syncing ? "animate-spin" : ""}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            {syncing ? "Syncing…" : "Refresh All Rates"}
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowAddForm(false); }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            Bulk Entry
          </button>
          <button onClick={() => { setShowAddForm(!showAddForm); setShowBulk(false); }} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Rate
          </button>
        </div>
      </div>

      {/* Single rate form */}
      {showAddForm && (
        <form onSubmit={handleAddSingle} className="rounded-2xl border border-brand-200 bg-brand-50/30 p-4 dark:border-brand-800/40 dark:bg-brand-900/10">
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Add / Update Rate  <span className="text-gray-400 font-normal">(1 {baseCcy?.code} = X target)</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Currency</label>
              <select required value={singleForm.targetCurrency} onChange={(e) => setSingleForm((p) => ({ ...p, targetCurrency: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {nonBase.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Rate</label>
              <input required type="number" min="0.000001" step="any" value={singleForm.rate || ""} onChange={(e) => setSingleForm((p) => ({ ...p, rate: Number(e.target.value) }))} placeholder="0.0000" className={inputCls + " w-32"} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Effective Date</label>
              <AppDatePicker value={singleForm.effectiveDate} onChange={(val) => setSingleForm((p) => ({ ...p, effectiveDate: val }))} maxToday />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Save</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Bulk entry */}
      {showBulk && (
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Bulk Rate Entry  <span className="font-normal text-gray-400">(1 {baseCcy?.code} = X)</span>
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Date:</label>
              <AppDatePicker value={bulkDate} onChange={(val) => setBulkDate(val)} maxToday />
            </div>
          </div>
          <div className="space-y-2">
            {bulkRows.map((row, idx) => (
              <div key={row.targetCurrency} className="flex items-center gap-3">
                <span className="w-14 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{row.targetCurrency}</span>
                <span className="text-xs text-gray-400">{nonBase.find((c) => c.code === row.targetCurrency)?.name}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.0000"
                  value={row.rate}
                  onChange={(e) => setBulkRows((prev) => prev.map((r, i) => i === idx ? { ...r, rate: e.target.value } : r))}
                  className={inputCls + " ml-auto w-36"}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleBulkSave} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Save All Rates
            </button>
            <button onClick={() => setShowBulk(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rates table */}
      {loading ? (
        <Skeleton rows={5} />
      ) : rates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-400">No exchange rates found. Add your first rate above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-[100px_100px_120px_120px_80px_40px] border-b border-gray-200 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
            <span>Base</span>
            <span>Target</span>
            <span>Rate</span>
            <span>Effective Date</span>
            <span>Source</span>
            <span />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rates.map((r) => (
              <div key={r.id} className="grid grid-cols-[100px_100px_120px_120px_80px_40px] items-center gap-2 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/20">
                <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{r.baseCurrency}</span>
                <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">{r.targetCurrency}</span>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {parseFloat(r.rate).toFixed(6)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(r.effectiveDate)}</span>
                <SourceBadge source={r.source} />
                <button
                  onClick={() => handleDeleteRate(r.id)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────
const CurrenciesPage: React.FC = () => {
  const { token } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [supported, setSupported] = useState<SupportedCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"currencies" | "rates">("currencies");

  const loadCurrencies = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [list, supp] = await Promise.all([
        currencyService.getList(token),
        currencyService.getSupported(token),
      ]);
      // API may return wrapped object or direct array
      const listArr = Array.isArray(list) ? list : ((list as unknown as { currencies?: Currency[] }).currencies ?? []);
      const suppArr = Array.isArray(supp) ? supp : ((supp as unknown as { currencies?: SupportedCurrency[] }).currencies ?? []);
      setCurrencies(listArr);
      setSupported(suppArr);
    } catch {
      // silent — tabs show their own errors
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadCurrencies(); }, [loadCurrencies]);

  const baseCcy = currencies.find((c) => c.isBaseCurrency);
  const activeCurrencies = currencies.filter((c) => c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Currency</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage currencies and exchange rates for international transactions
          </p>
        </div>
        {baseCcy && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-lg font-bold text-brand-700 dark:text-brand-300">{baseCcy.symbol}</span>
            <div>
              <p className="text-xs text-gray-400">Base Currency</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{baseCcy.code} — {baseCcy.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Enabled Currencies", value: activeCurrencies.length, icon: "🌍", cls: "text-brand-600 bg-brand-50 dark:bg-brand-900/20" },
          { label: "Foreign Currencies", value: activeCurrencies.filter((c) => !c.isBaseCurrency).length, icon: "💱", cls: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
          { label: "Available to Add", value: supported.filter((s) => !activeCurrencies.find((c) => c.code === s.code)).length, icon: "➕", cls: "text-teal-600 bg-teal-50 dark:bg-teal-900/20" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg ${card.cls}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Main content + converter sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/40 w-fit">
            {([
              { id: "currencies", label: "Enabled Currencies" },
              { id: "rates", label: "Exchange Rates" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "currencies" && (
            <EnabledCurrenciesTab
              currencies={currencies}
              supported={supported}
              loading={loading}
              onRefresh={loadCurrencies}
            />
          )}
          {tab === "rates" && (
            <ExchangeRatesTab currencies={currencies} />
          )}
        </div>

        {/* Converter sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <CurrencyConverter currencies={activeCurrencies} />
        </div>
      </div>
    </div>
  );
};

export default CurrenciesPage;
