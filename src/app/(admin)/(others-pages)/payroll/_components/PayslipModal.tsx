"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import payrollService from "@/services/payrollService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Payslip, EarningType, DeductionType } from "@/types/payroll";

interface PayslipModalProps {
  isOpen: boolean;
  payRunId: string;
  itemId: string | null; // null = show all payslips for this pay run
  onClose: () => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const earningLabels: Record<EarningType, string> = {
  REGULAR: "Regular Pay", OVERTIME: "Overtime Pay", BONUS: "Bonus",
  COMMISSION: "Commission", ALLOWANCE: "Allowance", OTHER: "Other Earnings",
};
const deductionLabels: Record<DeductionType, string> = {
  FEDERAL_TAX: "Federal Income Tax", STATE_TAX: "State Income Tax", LOCAL_TAX: "Local Tax",
  SOCIAL_SECURITY: "Social Security", MEDICARE: "Medicare", HEALTH_INSURANCE: "Health Insurance",
  RETIREMENT_401K: "401(k) Retirement", LOAN_REPAYMENT: "Loan Repayment",
  UNION_DUES: "Union Dues", GARNISHMENT: "Wage Garnishment", OTHER: "Other Deductions",
};

const PayslipView: React.FC<{ payslip: Payslip }> = ({ payslip }) => {
  const employeeDeductions = payslip.deductions.filter((d) => !d.isEmployerContribution);
  const employerDeductions = payslip.deductions.filter((d) => d.isEmployerContribution);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 print:border-0 print:shadow-none">
      {/* Payslip header */}
      <div className="border-b border-gray-200 bg-brand-50 px-6 py-5 dark:border-gray-700 dark:bg-brand-900/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Pay Slip</p>
            <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{payslip.employee.fullName}</h3>
            {payslip.employee.jobTitle && <p className="text-sm text-gray-500 dark:text-gray-400">{payslip.employee.jobTitle}</p>}
            {payslip.employee.department && <p className="text-xs text-gray-400 dark:text-gray-500">{payslip.employee.department}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Employee #</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{payslip.employee.employeeNumber}</p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Pay Date</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatDate(payslip.payRun.payDate)}</p>
          </div>
        </div>

        {/* Pay period bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-white/60 px-4 py-3 dark:bg-white/[0.05]">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Pay Period</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {formatDate(payslip.payRun.payPeriodStart)} – {formatDate(payslip.payRun.payPeriodEnd)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Frequency</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{payslip.payRun.payFrequency}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Hours Worked</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {payslip.regularHours} reg{payslip.overtimeHours > 0 ? ` + ${payslip.overtimeHours} OT` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Earnings */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Earnings</p>
            <div className="space-y-1.5">
              {payslip.earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {earningLabels[e.earningType] || e.earningType}
                    {e.description ? <span className="ml-1 text-xs text-gray-400">({e.description})</span> : null}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Gross Pay</span>
                <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(payslip.grossPay)}</span>
              </div>
            </div>
          </div>

          {/* Employee Deductions */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Deductions (Employee)</p>
            <div className="space-y-1.5">
              {employeeDeductions.length === 0 ? (
                <p className="text-xs text-gray-400">No employee deductions.</p>
              ) : (
                employeeDeductions.map((d) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{deductionLabels[d.deductionType] || d.deductionType}</span>
                    <span className="text-sm font-medium tabular-nums text-error-600 dark:text-error-400">−{formatCurrency(d.amount)}</span>
                  </div>
                ))
              )}
              <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Deductions</span>
                <span className="text-sm font-bold tabular-nums text-error-600 dark:text-error-400">−{formatCurrency(payslip.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employer contributions */}
        {employerDeductions.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Employer Contributions</p>
            <div className="space-y-1.5">
              {employerDeductions.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{deductionLabels[d.deductionType] || d.deductionType}</span>
                  <span className="text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300">{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Net pay highlight */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-success-50 px-5 py-4 dark:bg-success-900/20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-success-600 dark:text-success-400">Net Pay</p>
            <p className="text-xs text-success-500 dark:text-success-500">Amount deposited / paid</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-success-700 dark:text-success-300">{formatCurrency(payslip.netPay)}</p>
        </div>

        {/* Address */}
        {payslip.employee.addressLine1 && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            {payslip.employee.addressLine1}{payslip.employee.city ? `, ${payslip.employee.city}` : ""}{payslip.employee.state ? `, ${payslip.employee.state}` : ""} {payslip.employee.postalCode}
          </p>
        )}
      </div>
    </div>
  );
};

const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, payRunId, itemId, onClose }) => {
  const { token } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [singlePayslip, setSinglePayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (itemId) {
        const data = await payrollService.getPayslip(itemId, token);
        setSinglePayslip(data);
      } else {
        const data = await payrollService.getPayslips(payRunId, token);
        setPayslips(data);
        setSelectedIdx(0);
      }
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, payRunId, itemId]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const displayed = itemId ? singlePayslip : payslips[selectedIdx] || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {itemId ? "Payslip" : `Payslips (${payslips.length})`}
          </h2>
          {!itemId && payslips.length > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={selectedIdx === 0} onClick={() => setSelectedIdx((i) => i - 1)}>← Prev</Button>
              <span className="text-sm text-gray-500">{selectedIdx + 1} / {payslips.length}</span>
              <Button variant="outline" size="sm" disabled={selectedIdx === payslips.length - 1} onClick={() => setSelectedIdx((i) => i + 1)}>Next →</Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-error-600">{error}</p>
        ) : displayed ? (
          <PayslipView payslip={displayed} />
        ) : (
          <p className="py-10 text-center text-sm text-gray-400">No payslips found.</p>
        )}

        {/* Employee quick-select list if not single */}
        {!itemId && payslips.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {payslips.map((ps, i) => (
              <button
                key={ps.id}
                onClick={() => setSelectedIdx(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${i === selectedIdx ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"}`}
              >
                {ps.employee.fullName}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PayslipModal;
