"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppDatePicker from "@/components/form/AppDatePicker";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { formatApiErrorMessage } from "@/utils/apiError";
import payrollService from "@/services/payrollService";
import type { PayrollSummaryReport, TaxLiabilityReport, DeductionType } from "@/types/payroll";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };
type ReportView = "summary" | "tax";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function currentYearRange() {
  const year = new Date().getFullYear();
  return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

const deductionLabels: Record<string, string> = {
  FEDERAL_TAX: "Federal Tax",
  STATE_TAX: "State Tax",
  LOCAL_TAX: "Local Tax",
  SOCIAL_SECURITY: "Social Security",
  MEDICARE: "Medicare",
  HEALTH_INSURANCE: "Health Insurance",
  RETIREMENT_401K: "401(k)",
  LOAN_REPAYMENT: "Loan Repayment",
  UNION_DUES: "Union Dues",
  GARNISHMENT: "Garnishment",
  OTHER: "Other",
};

const PayrollReportsTab: React.FC = () => {
  const { token } = useAuth();
  const [view, setView] = useState<ReportView>("summary");
  const [dateRange, setDateRange] = useState(currentYearRange());
  const [summary, setSummary] = useState<PayrollSummaryReport | null>(null);
  const [taxReport, setTaxReport] = useState<TaxLiabilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setAlert(null);
    try {
      if (view === "summary") {
        const data = await payrollService.getPayrollSummary(dateRange, token);
        setSummary(data);
      } else {
        const data = await payrollService.getTaxLiability(dateRange, token);
        setTaxReport(data);
      }
    } catch (error) {
      setAlert({ variant: "error", title: "Unable to load report", message: formatApiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [token, view, dateRange]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleDateChange = (key: "startDate" | "endDate", value: string) => {
    setDateRange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {alert && <Alert variant={alert.variant} title={alert.title} message={alert.message} />}

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Report type switch */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900/50">
          {([["summary", "Payroll Summary"], ["tax", "Tax Liability"]] as [ReportView, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                view === id
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">From</label>
            <AppDatePicker
              value={dateRange.startDate}
              onChange={(val) => handleDateChange("startDate", val)}
              maxToday
              max={dateRange.endDate}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
            <AppDatePicker
              value={dateRange.endDate}
              onChange={(val) => handleDateChange("endDate", val)}
              min={dateRange.startDate}
              maxToday
            />
          </div>
          <Button size="sm" variant="outline" onClick={fetchReport}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating report...</span>
          </div>
        </div>
      ) : view === "summary" && summary ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Gross Pay", value: formatCurrency(summary.totalGrossPay), color: "bg-brand-50 dark:bg-brand-900/10", text: "text-brand-700 dark:text-brand-300" },
              { label: "Net Pay", value: formatCurrency(summary.totalNetPay), color: "bg-success-50 dark:bg-success-900/10", text: "text-success-700 dark:text-success-300" },
              { label: "Deductions", value: formatCurrency(summary.totalDeductions), color: "bg-error-50 dark:bg-error-900/10", text: "text-error-700 dark:text-error-300" },
              { label: "Employer Taxes", value: formatCurrency(summary.totalEmployerTaxes), color: "bg-warning-50 dark:bg-warning-900/10", text: "text-warning-700 dark:text-warning-300" },
              { label: "Pay Runs", value: summary.payRunCount.toString(), color: "bg-gray-50 dark:bg-gray-800/40", text: "text-gray-700 dark:text-gray-300" },
              { label: "Employees Paid", value: summary.employeeCount.toString(), color: "bg-blue-50 dark:bg-blue-900/10", text: "text-blue-700 dark:text-blue-300" },
            ].map((kpi) => (
              <div key={kpi.label} className={`rounded-2xl border border-gray-200 p-5 dark:border-gray-800 ${kpi.color}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${kpi.text}`}>{kpi.label}</p>
                <p className={`mt-2 text-xl font-bold ${kpi.text}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly Breakdown */}
          {summary.monthlyBreakdown.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["Month", "Employees", "Gross Pay", "Net Pay"].map((h) => (
                        <th key={h} className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${h === "Month" || h === "Employees" ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.monthlyBreakdown.map((row) => (
                      <tr key={row.month} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white/90">
                          {new Date(row.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </td>
                        <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{row.employeeCount}</td>
                        <td className="px-6 py-3 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">{formatCurrency(row.grossPay)}</td>
                        <td className="px-6 py-3 text-right text-sm tabular-nums font-medium text-success-600 dark:text-success-400">{formatCurrency(row.netPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pay Runs list */}
          {summary.payRuns.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pay Runs Included</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["Period", "Pay Date", "Freq.", "Employees", "Gross Pay", "Net Pay", "Status"].map((h) => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${["Employees", "Gross Pay", "Net Pay"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.payRuns.map((pr) => (
                      <tr key={pr.id} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(pr.payPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(pr.payPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(pr.payDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{pr.payFrequency.toLowerCase()}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{pr.employeeCount}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">{formatCurrency(pr.totalGrossPay)}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">{formatCurrency(pr.totalNetPay)}</td>
                        <td className="px-4 py-3">
                          <Badge size="sm" color={pr.status === "PAID" ? "success" : "primary"} variant="light">{pr.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : view === "tax" && taxReport ? (
        <div className="space-y-6">
          {/* Tax KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Employee Tax", value: formatCurrency(taxReport.totalEmployeeTax), color: "bg-error-50 dark:bg-error-900/10", text: "text-error-700 dark:text-error-300" },
              { label: "Employer Tax", value: formatCurrency(taxReport.totalEmployerTax), color: "bg-warning-50 dark:bg-warning-900/10", text: "text-warning-700 dark:text-warning-300" },
              { label: "Total Tax", value: formatCurrency(taxReport.totalTax), color: "bg-brand-50 dark:bg-brand-900/10", text: "text-brand-700 dark:text-brand-300" },
            ].map((kpi) => (
              <div key={kpi.label} className={`rounded-2xl border border-gray-200 p-6 dark:border-gray-800 ${kpi.color}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${kpi.text}`}>{kpi.label}</p>
                <p className={`mt-2 text-2xl font-bold ${kpi.text}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Tax breakdown table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tax Liability by Type</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Tax Type", "Employee", "Employer", "Total"].map((h) => (
                      <th key={h} className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${h === "Tax Type" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taxReport.byType.map((row) => (
                    <tr key={row.deductionType} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white/90">
                        {deductionLabels[row.deductionType] || row.deductionType}
                      </td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{formatCurrency(row.employeeAmount)}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{formatCurrency(row.employerAmount)}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums font-semibold text-gray-900 dark:text-white/90">{formatCurrency(row.totalAmount)}</td>
                    </tr>
                  ))}
                  {taxReport.byType.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">No tax data for this period.</td>
                    </tr>
                  )}
                </tbody>
                {taxReport.byType.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">Total</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums font-bold text-gray-900 dark:text-white">{formatCurrency(taxReport.totalEmployeeTax)}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums font-bold text-gray-900 dark:text-white">{formatCurrency(taxReport.totalEmployerTax)}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums font-bold text-brand-600 dark:text-brand-400">{formatCurrency(taxReport.totalTax)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PayrollReportsTab;
