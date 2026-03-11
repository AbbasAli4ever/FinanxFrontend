"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import dataIOService from "@/services/dataIOService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type {
  SupportedEntity,
  ImportEntityType,
  DuplicateStrategy,
  ValidationResult,
  ImportJobListItem,
  WizardStep,
} from "@/types/dataIO";

interface ImportWizardProps {
  importableEntities: SupportedEntity[];
  token: string;
  onViewHistory: () => void;
}

function entityLabel(type: string): string {
  return type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function triggerCsvDownload(csvContent: string, fileName: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  customers: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  vendors: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  products: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
  ),
  accounts: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

const STEP_LABELS = ["Select Entity", "Upload File", "Validate", "Configure", "Results"];

const DUPLICATE_STRATEGIES: { value: DuplicateStrategy; label: string; description: string }[] = [
  { value: "skip", label: "Skip Duplicates", description: "Skip rows where the entity already exists. Safe choice for first-time imports." },
  { value: "update", label: "Update Existing", description: "Update existing entities with values from the CSV (upsert)." },
  { value: "fail", label: "Fail on Duplicate", description: "Report an error for any duplicate found. Use when data must be unique." },
];

const ImportWizard: React.FC<ImportWizardProps> = ({ importableEntities, token, onViewHistory }) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedEntity, setSelectedEntity] = useState<ImportEntityType | "">("");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip");
  const [importResult, setImportResult] = useState<ImportJobListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear error on step change
  useEffect(() => { setError(""); }, [step]);

  // Auto-validate on entering step 3
  useEffect(() => {
    if (step !== 3 || !csvText || !selectedEntity) return;
    let cancelled = false;
    setLoading(true);
    setValidationResult(null);
    dataIOService
      .validateImport(selectedEntity as ImportEntityType, csvText, fileName, token)
      .then((result) => { if (!cancelled) setValidationResult(result); })
      .catch((e) => { if (!cancelled) setError(formatApiErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetWizard = () => {
    setStep(1);
    setSelectedEntity("");
    setCsvText("");
    setFileName("");
    setValidationResult(null);
    setDuplicateStrategy("skip");
    setImportResult(null);
    setError("");
  };

  const handleFileRead = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported.");
      return;
    }
    if (file.size > 10_000_000) {
      setError("File size must be under 10MB.");
      return;
    }
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { setCsvText(ev.target?.result as string ?? ""); };
    reader.onerror = () => { setError("Failed to read file. Please try again."); };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDownloadTemplate = async () => {
    if (!selectedEntity) return;
    setTemplateDownloading(true);
    try {
      const res = await dataIOService.getTemplate(selectedEntity as ImportEntityType, token);
      triggerCsvDownload(res.csv, res.fileName);
    } catch (e) {
      setError(formatApiErrorMessage(e));
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedEntity || !csvText) return;
    setLoading(true);
    setError("");
    try {
      const result = await dataIOService.importData(
        selectedEntity as ImportEntityType,
        csvText,
        fileName,
        duplicateStrategy,
        token
      );
      setImportResult(result);
      setStep(5);
    } catch (e) {
      setError(formatApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // Count CSV rows for preview
  const csvRowCount = csvText ? Math.max(0, csvText.trim().split("\n").length - 1) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Step Indicator */}
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <div className="flex items-center">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = (idx + 1) as WizardStep;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <React.Fragment key={stepNum}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isDone
                      ? "bg-success-500 text-white"
                      : isActive
                      ? "bg-brand-500 text-white"
                      : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  }`}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <span className={`hidden text-[11px] font-medium sm:block ${
                    isActive ? "text-brand-600 dark:text-brand-400" : isDone ? "text-success-600 dark:text-success-400" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 rounded-full transition-colors ${
                    step > stepNum ? "bg-success-400" : "bg-gray-200 dark:bg-gray-700"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {error && (
          <div className="mb-5">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        {/* Step 1: Select Entity */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Select Entity Type</h2>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Choose what type of data you want to import.</p>
            {importableEntities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
                <p className="text-sm text-gray-400">Loading entities...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {importableEntities.map((entity) => (
                  <button
                    key={entity.entityType}
                    onClick={() => { setSelectedEntity(entity.entityType as ImportEntityType); setStep(2); }}
                    className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all hover:shadow-md ${
                      selectedEntity === entity.entityType
                        ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20"
                        : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-brand-600"
                    }`}
                  >
                    <span className={`${selectedEntity === entity.entityType ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}>
                      {ENTITY_ICONS[entity.entityType] ?? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm font-medium ${selectedEntity === entity.entityType ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                      {entityLabel(entity.entityType)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload File */}
        {step === 2 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <button onClick={() => setStep(1)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upload {entityLabel(selectedEntity)} CSV
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download the template, fill it in, and upload.</p>
              </div>
            </div>

            {/* Download template */}
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-500">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <p className="flex-1 text-sm text-brand-700 dark:text-brand-300">
                Start by downloading the CSV template for {entityLabel(selectedEntity)}.
              </p>
              <button
                onClick={handleDownloadTemplate}
                disabled={templateDownloading}
                className="shrink-0 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-50 dark:border-brand-700 dark:bg-transparent dark:text-brand-400"
              >
                {templateDownloading ? "Downloading..." : "Download Template"}
              </button>
            </div>

            {/* Drag and drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20"
                  : csvText
                  ? "border-success-300 bg-success-50 dark:border-success-700 dark:bg-success-900/10"
                  : "border-gray-300 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-brand-700"
              }`}
            >
              {csvText ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-600 dark:text-success-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="font-medium text-success-700 dark:text-success-400">{fileName}</p>
                  <p className="text-sm text-success-600 dark:text-success-500">{csvRowCount} data rows detected</p>
                  <p className="text-xs text-gray-400">Click or drop to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isDragging ? "bg-brand-100 dark:bg-brand-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDragging ? "text-brand-500" : "text-gray-400"}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {isDragging ? "Drop your CSV file here" : "Drag & drop your CSV file"}
                  </p>
                  <p className="text-sm text-gray-400">or click to browse — max 10MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

            <div className="mt-5 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>Back</Button>
              <Button size="sm" disabled={!csvText} onClick={() => setStep(3)}>
                Validate File
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validate */}
        {step === 3 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <button onClick={() => setStep(2)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Validate File</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Checking your CSV for errors before import.</p>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Validating {csvRowCount} rows...</p>
              </div>
            )}

            {!loading && validationResult && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-700 dark:bg-gray-800/40">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{validationResult.totalRows}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Rows</p>
                  </div>
                  <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-center dark:border-success-800 dark:bg-success-900/10">
                    <p className="text-2xl font-bold text-success-700 dark:text-success-400">{validationResult.validRows}</p>
                    <p className="text-xs text-success-600 dark:text-success-500">Valid Rows</p>
                  </div>
                  <div className={`rounded-xl border px-4 py-3 text-center ${validationResult.invalidRows > 0 ? "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10" : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"}`}>
                    <p className={`text-2xl font-bold ${validationResult.invalidRows > 0 ? "text-error-700 dark:text-error-400" : "text-gray-400"}`}>{validationResult.invalidRows}</p>
                    <p className={`text-xs ${validationResult.invalidRows > 0 ? "text-error-600 dark:text-error-500" : "text-gray-400"}`}>Invalid Rows</p>
                  </div>
                </div>

                {/* Result message */}
                {validationResult.invalidRows === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3 dark:border-success-800 dark:bg-success-900/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-success-600 dark:text-success-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p className="text-sm text-success-700 dark:text-success-400">All rows are valid. Ready to import!</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-800 dark:bg-warning-900/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-warning-600 dark:text-warning-400">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p className="text-sm text-warning-700 dark:text-warning-400">
                      {validationResult.invalidRows} row{validationResult.invalidRows !== 1 ? "s have" : " has"} errors. Valid rows can still be imported.
                    </p>
                  </div>
                )}

                {/* Error list */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Validation Errors</p>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      {validationResult.errors.map((err, i) => (
                        <div key={i} className={`flex items-start gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0 dark:border-gray-800 ${i % 2 === 0 ? "bg-error-50/50 dark:bg-error-900/10" : "bg-white dark:bg-transparent"}`}>
                          <span className="shrink-0 rounded bg-error-100 px-1.5 py-0.5 text-[11px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
                            Row {err.row}
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{err.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>Back</Button>
              <Button size="sm" disabled={loading || !validationResult} onClick={() => setStep(4)}>
                Continue to Configure
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Configure + Import */}
        {step === 4 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <button onClick={() => setStep(3)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configure Import</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose how to handle duplicate records.</p>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              {DUPLICATE_STRATEGIES.map((strategy) => (
                <button
                  key={strategy.value}
                  onClick={() => setDuplicateStrategy(strategy.value)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    duplicateStrategy === strategy.value
                      ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      duplicateStrategy === strategy.value
                        ? "border-brand-500 bg-brand-500 dark:border-brand-400 dark:bg-brand-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {duplicateStrategy === strategy.value && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${duplicateStrategy === strategy.value ? "text-brand-700 dark:text-brand-300" : "text-gray-800 dark:text-gray-200"}`}>
                        {strategy.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{strategy.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Import summary */}
            {validationResult && (
              <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/40">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Importing <strong className="text-gray-900 dark:text-white">{validationResult.validRows}</strong> valid rows from <span className="font-mono text-xs">{fileName}</span> into <strong className="text-gray-900 dark:text-white">{entityLabel(selectedEntity)}</strong>
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>Back</Button>
              <Button size="sm" disabled={loading} onClick={handleImport}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Importing...
                  </span>
                ) : "Import Data"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && importResult && (
          <div>
            <div className="mb-6 text-center">
              <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                importResult.errorCount === 0 ? "bg-success-100 dark:bg-success-900/30" : "bg-warning-100 dark:bg-warning-900/30"
              }`}>
                {importResult.errorCount === 0 ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-600 dark:text-success-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning-600 dark:text-warning-400">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {importResult.errorCount === 0 ? "Import Successful!" : "Import Completed with Errors"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {entityLabel(selectedEntity)} import finished
              </p>
            </div>

            {/* Result stats */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-700 dark:bg-gray-800/40">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{importResult.totalRows}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Rows</p>
              </div>
              <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-center dark:border-success-800 dark:bg-success-900/10">
                <p className="text-2xl font-bold text-success-700 dark:text-success-400">{importResult.successCount}</p>
                <p className="text-xs text-success-600 dark:text-success-500">Imported</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 text-center ${importResult.errorCount > 0 ? "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10" : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"}`}>
                <p className={`text-2xl font-bold ${importResult.errorCount > 0 ? "text-error-700 dark:text-error-400" : "text-gray-400"}`}>{importResult.errorCount}</p>
                <p className={`text-xs ${importResult.errorCount > 0 ? "text-error-600 dark:text-error-500" : "text-gray-400"}`}>Errors</p>
              </div>
            </div>

            {/* Error list if any */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Row Errors</p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0 dark:border-gray-800">
                      <span className="shrink-0 rounded bg-error-100 px-1.5 py-0.5 text-[11px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
                        Row {err.row}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{err.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={resetWizard}>
                Import Another File
              </Button>
              <Button size="sm" onClick={onViewHistory}>
                View History
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportWizard;
