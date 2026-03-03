"use client";

import React, { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { BankAccount, BankTransactionType, ImportTransactionItem } from "@/types/banking";

interface Props {
  isOpen: boolean;
  account: BankAccount | null;
  onClose: () => void;
  onImported: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: BankTransactionType;
  valid: boolean;
  error?: string;
}

function detectType(amount: number, desc: string): BankTransactionType {
  const d = desc.toLowerCase();
  if (d.includes("interest")) return "INTEREST";
  if (d.includes("fee") || d.includes("charge")) return "FEE";
  if (d.includes("transfer")) return "TRANSFER";
  if (d.includes("check") || d.includes("chk")) return "CHECK";
  return amount >= 0 ? "DEPOSIT" : "WITHDRAWAL";
}

function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cols: string[] = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n));
}

const CsvImportWizard: React.FC<Props> = ({ isOpen, account, onClose, onImported }) => {
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [colDate, setColDate] = useState(0);
  const [colDesc, setColDesc] = useState(1);
  const [colAmount, setColAmount] = useState(2);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (!rows.length) { setError("CSV appears empty."); return; }
      setRawRows(rows);
      setHeaders(rows[0] ?? []);
      // Guess columns by header names
      const h = (rows[0] ?? []).map((c) => c.toLowerCase());
      const dateIdx = h.findIndex((c) => c.includes("date"));
      const descIdx = h.findIndex((c) => c.includes("desc") || c.includes("memo") || c.includes("narration"));
      const amtIdx = h.findIndex((c) => c.includes("amount") || c.includes("amt") || c.includes("debit") || c.includes("credit"));
      if (dateIdx >= 0) setColDate(dateIdx);
      if (descIdx >= 0) setColDesc(descIdx);
      if (amtIdx >= 0) setColAmount(amtIdx);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleMapConfirm = () => {
    setError("");
    const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
    const parsed: ParsedRow[] = dataRows.map((row) => {
      const rawDate = row[colDate] ?? "";
      const rawDesc = row[colDesc] ?? "";
      const rawAmt = row[colAmount] ?? "";

      const amount = parseFloat(rawAmt.replace(/[$,\s]/g, ""));
      const dateVal = new Date(rawDate);
      const valid = rawDesc.trim().length > 0 && !isNaN(amount) && !isNaN(dateVal.getTime());

      return {
        date: valid ? dateVal.toISOString().split("T")[0] : rawDate,
        description: rawDesc.trim() || "(no description)",
        amount: isNaN(amount) ? 0 : amount,
        type: detectType(amount, rawDesc),
        valid,
        error: !valid ? `Invalid date or amount: "${rawDate}", "${rawAmt}"` : undefined,
      };
    });
    setParsedRows(parsed);
    setStep(3);
  };

  const handleImport = async () => {
    if (!token || !account) return;
    const validRows: ImportTransactionItem[] = parsedRows
      .filter((r) => r.valid)
      .map((r) => ({ date: r.date, description: r.description, amount: r.amount, type: r.type }));

    if (!validRows.length) { setError("No valid rows to import."); return; }

    setLoading(true);
    setError("");
    try {
      const result = await bankingService.importTransactions(account.id, validRows, token);
      setImportResult({ imported: result.imported });
      setStep(4);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setRawRows([]);
    setHeaders([]);
    setHasHeader(true);
    setColDate(0); setColDesc(1); setColAmount(2);
    setParsedRows([]);
    setImportResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };
  const handleFinish = () => { reset(); onImported(); onClose(); };

  if (!isOpen || !account) return null;

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

  const stepLabels = ["Upload File", "Map Columns", "Preview", "Done"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import CSV Transactions</h2>
              <p className="text-xs text-gray-500">{account.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress steps */}
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {stepLabels.map((label, idx) => {
              const s = (idx + 1) as Step;
              const isActive = step === s;
              const isDone = step > s;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      isDone
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}>
                      {isDone ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : s}
                    </span>
                    <span className={`text-xs font-medium ${
                      isActive ? "text-brand-600 dark:text-brand-400" : "text-gray-400"
                    }`}>{label}</span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div className={`h-px flex-1 transition-colors ${isDone ? "bg-green-300" : "bg-gray-200 dark:bg-gray-800"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Select your CSV file</h3>
                <p className="mt-1 text-sm text-gray-500">Your CSV should have columns for date, description, and amount.</p>
              </div>
              <label className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 px-8 py-6 text-center transition-colors hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-600">
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
                <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Click to browse</p>
                <p className="text-xs text-gray-400">CSV, TXT — max 5 MB</p>
              </label>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Map CSV Columns</h3>
                <p className="text-sm text-gray-500">{rawRows.length} rows detected.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                First row is a header
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Date column *", val: colDate, set: setColDate },
                  { label: "Description column *", val: colDesc, set: setColDesc },
                  { label: "Amount column *", val: colAmount, set: setColAmount },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                    <select
                      value={val}
                      onChange={(e) => set(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      {(hasHeader ? headers : rawRows[0] ?? []).map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview first 3 data rows */}
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Date (col {colDate + 1})</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Description (col {colDesc + 1})</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Amount (col {colAmount + 1})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(hasHeader ? rawRows.slice(1, 4) : rawRows.slice(0, 3)).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row[colDate] ?? ""}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row[colDesc] ?? ""}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{row[colAmount] ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Preview Import</h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-green-600">{validCount} valid</span>
                    {invalidCount > 0 && <span className="ml-2 font-medium text-red-600">{invalidCount} invalid</span>}
                  </p>
                </div>
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Description</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Type</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Amount</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {parsedRows.map((row, i) => (
                      <tr key={i} className={row.valid ? "" : "bg-red-50/50 dark:bg-red-900/10"}>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.date}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate text-gray-700 dark:text-gray-300" title={row.description}>{row.description}</td>
                        <td className="px-3 py-2 text-gray-500">{row.type}</td>
                        <td className={`px-3 py-2 text-right font-semibold tabular-nums ${
                          row.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {row.amount >= 0 ? "+" : "-"}{formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.valid ? (
                            <svg className="mx-auto h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <span className="text-[10px] font-bold text-red-600" title={row.error}>✕ {row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalidCount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {invalidCount} row{invalidCount !== 1 ? "s" : ""} will be skipped due to invalid data.
                </p>
              )}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && importResult && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Import Complete!</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-green-600">{importResult.imported}</span> transactions imported into <span className="font-medium">{account.name}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 p-5 dark:border-gray-800">
          <button
            onClick={step === 1 ? handleClose : () => setStep((step - 1) as Step)}
            disabled={step === 4}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step === 1 && (
            <p className="text-xs text-gray-400">Select a file to continue</p>
          )}
          {step === 2 && (
            <button
              onClick={handleMapConfirm}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Preview Import
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleImport}
              disabled={loading || validCount === 0}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Importing..." : `Import ${validCount} Transaction${validCount !== 1 ? "s" : ""}`}
            </button>
          )}
          {step === 4 && (
            <button
              onClick={handleFinish}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvImportWizard;
