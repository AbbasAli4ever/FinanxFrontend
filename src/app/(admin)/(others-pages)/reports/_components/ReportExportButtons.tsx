"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";

interface ReportExportButtonsProps {
  reportType: string;
  filters: Record<string, string>;
  disabled?: boolean;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportExportButtons({
  reportType,
  filters,
  disabled = false,
}: ReportExportButtonsProps) {
  const { token } = useAuth();
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const handleExport = async (format: "pdf" | "excel") => {
    if (!token) return;

    const setLoading = format === "pdf" ? setLoadingPdf : setLoadingExcel;
    setLoading(true);

    try {
      const blob = await reportsService.exportReport(reportType, format, filters, token);
      const ext = format === "pdf" ? "pdf" : "xlsx";
      const dateSuffix =
        filters.startDate && filters.endDate
          ? `${filters.startDate}-to-${filters.endDate}`
          : filters.asOfDate
            ? `as-of-${filters.asOfDate}`
            : new Date().toISOString().split("T")[0];
      downloadBlob(blob, `${reportType}-${dateSuffix}.${ext}`);
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleExport("pdf")}
        disabled={disabled || loadingPdf}
      >
        {loadingPdf ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            PDF
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </span>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleExport("excel")}
        disabled={disabled || loadingExcel}
      >
        {loadingExcel ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            Excel
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Excel
          </span>
        )}
      </Button>
    </div>
  );
}
