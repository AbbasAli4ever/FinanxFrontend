"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import payrollService from "@/services/payrollService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type {
  PayRun,
  PayRunItem,
  PayRunStatus,
  EarningType,
  DeductionType,
  EmployeeListItem,
  CreateEarningRequest,
  CreateDeductionRequest,
} from "@/types/payroll";
import PayslipModal from "./PayslipModal";
import { useModal } from "@/hooks/useModal";
import { ExportButton } from "@/components/export/ExportButton";
import { usePermissions } from "@/context/PermissionsContext";

interface PayRunDetailModalProps {
  isOpen: boolean;
  payRunId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onAction: (action: string) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusBadgeColor: Record<PayRunStatus, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  DRAFT: "light", PENDING_APPROVAL: "warning", APPROVED: "info", POSTED: "primary", PAID: "success", VOID: "dark",
};
const statusLabel: Record<PayRunStatus, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved", POSTED: "Posted", PAID: "Paid", VOID: "Void",
};

const earningTypes: EarningType[] = ["REGULAR", "OVERTIME", "BONUS", "COMMISSION", "ALLOWANCE", "OTHER"];
const deductionTypes: DeductionType[] = ["FEDERAL_TAX", "STATE_TAX", "LOCAL_TAX", "SOCIAL_SECURITY", "MEDICARE", "HEALTH_INSURANCE", "RETIREMENT_401K", "LOAN_REPAYMENT", "UNION_DUES", "GARNISHMENT", "OTHER"];

const earningLabels: Record<EarningType, string> = {
  REGULAR: "Regular", OVERTIME: "Overtime", BONUS: "Bonus", COMMISSION: "Commission", ALLOWANCE: "Allowance", OTHER: "Other",
};
const deductionLabels: Record<DeductionType, string> = {
  FEDERAL_TAX: "Federal Tax", STATE_TAX: "State Tax", LOCAL_TAX: "Local Tax",
  SOCIAL_SECURITY: "Social Security", MEDICARE: "Medicare", HEALTH_INSURANCE: "Health Insurance",
  RETIREMENT_401K: "401(k)", LOAN_REPAYMENT: "Loan Repayment", UNION_DUES: "Union Dues", GARNISHMENT: "Garnishment", OTHER: "Other",
};

const inputSm = "h-9 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";
const selectSm = "h-9 w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// ─── Add Item Form ────────────────────────────────────────────────────────────
interface AddItemFormProps {
  employees: EmployeeListItem[];
  payRunId: string;
  onAdded: () => void;
  onCancel: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ employees, payRunId, onAdded, onCancel }) => {
  const { token } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [overtimeRate, setOvertimeRate] = useState("1.5");
  const [earnings, setEarnings] = useState<{ earningType: EarningType; description: string; amount: string }[]>([]);
  const [deductions, setDeductions] = useState<{ deductionType: DeductionType; amount: string; isEmployerContribution: boolean }[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEarning = () => setEarnings((p) => [...p, { earningType: "BONUS", description: "", amount: "" }]);
  const removeEarning = (i: number) => setEarnings((p) => p.filter((_, idx) => idx !== i));
  const addDeduction = () => setDeductions((p) => [...p, { deductionType: "FEDERAL_TAX", amount: "", isEmployerContribution: false }]);
  const removeDeduction = (i: number) => setDeductions((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!token || !employeeId) { setError("Select an employee."); return; }
    setSaving(true); setError(null);
    try {
      await payrollService.addPayRunItem(payRunId, {
        employeeId,
        regularHours: regularHours ? parseFloat(regularHours) : undefined,
        overtimeHours: overtimeHours ? parseFloat(overtimeHours) : undefined,
        overtimeRate: overtimeRate ? parseFloat(overtimeRate) : undefined,
        earnings: earnings.filter((e) => e.amount).map((e) => ({
          earningType: e.earningType, description: e.description || undefined, amount: parseFloat(e.amount),
        })),
        deductions: deductions.filter((d) => d.amount).map((d) => ({
          deductionType: d.deductionType, amount: parseFloat(d.amount), isEmployerContribution: d.isEmployerContribution,
        })),
        notes: notes || undefined,
      }, token);
      onAdded();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
      <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Add Employee to Pay Run</p>
      {error && <div className="mb-3 text-xs text-error-600 dark:text-error-400">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Employee *</label>
          <div className="relative">
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={selectSm}>
              <option value="">Select employee...</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} · {e.employeeNumber}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Regular Hours</label>
          <input type="number" value={regularHours} onChange={(e) => setRegularHours(e.target.value)} min="0" step="0.5" placeholder="173.33" className={inputSm} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Overtime Hours</label>
          <input type="number" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} min="0" step="0.5" placeholder="0" className={inputSm} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Overtime Rate</label>
          <input type="number" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} min="1" step="0.1" className={inputSm} />
        </div>
      </div>

      {/* Additional Earnings */}
      {earnings.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Additional Earnings</p>
          {earnings.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="relative flex-1">
                <select value={e.earningType} onChange={(ev) => setEarnings((p) => p.map((r, idx) => idx === i ? { ...r, earningType: ev.target.value as EarningType } : r))} className={selectSm}>
                  {earningTypes.map((t) => <option key={t} value={t}>{earningLabels[t]}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <input type="text" value={e.description} onChange={(ev) => setEarnings((p) => p.map((r, idx) => idx === i ? { ...r, description: ev.target.value } : r))} placeholder="Description" className={`${inputSm} flex-1`} />
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input type="number" value={e.amount} onChange={(ev) => setEarnings((p) => p.map((r, idx) => idx === i ? { ...r, amount: ev.target.value } : r))} min="0" step="0.01" placeholder="0.00" className={`${inputSm} pl-5`} />
              </div>
              <button onClick={() => removeEarning(i)} className="text-gray-400 hover:text-error-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Deductions */}
      {deductions.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Deductions</p>
          {deductions.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="relative flex-1">
                <select value={d.deductionType} onChange={(ev) => setDeductions((p) => p.map((r, idx) => idx === i ? { ...r, deductionType: ev.target.value as DeductionType } : r))} className={selectSm}>
                  {deductionTypes.map((t) => <option key={t} value={t}>{deductionLabels[t]}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input type="number" value={d.amount} onChange={(ev) => setDeductions((p) => p.map((r, idx) => idx === i ? { ...r, amount: ev.target.value } : r))} min="0" step="0.01" placeholder="0.00" className={`${inputSm} pl-5`} />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                <input type="checkbox" checked={d.isEmployerContribution} onChange={(ev) => setDeductions((p) => p.map((r, idx) => idx === i ? { ...r, isEmployerContribution: ev.target.checked } : r))} className="rounded" />
                Employer
              </label>
              <button onClick={() => removeDeduction(i)} className="text-gray-400 hover:text-error-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={addEarning} className="text-xs text-brand-500 hover:text-brand-600 hover:underline">+ Add Earning</button>
        <span className="text-gray-300">·</span>
        <button onClick={addDeduction} className="text-xs text-brand-500 hover:text-brand-600 hover:underline">+ Add Deduction</button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Employee"}</Button>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const PayRunDetailModal: React.FC<PayRunDetailModalProps> = ({
  isOpen, payRunId, onClose, onUpdated, onAction,
}) => {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const [payRun, setPayRun] = useState<PayRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const payslipModal = useModal();

  const loadPayRun = useCallback(async () => {
    if (!token || !payRunId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await payrollService.getPayRun(payRunId, token);
      setPayRun(data);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, payRunId]);

  const loadEmployees = useCallback(async () => {
    if (!token) return;
    try {
      const data = await payrollService.getEmployees({ isActive: "true", limit: "200" }, token);
      setEmployees(data.items);
    } catch {
      // non-critical
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && payRunId) {
      loadPayRun();
      loadEmployees();
      setShowAddItem(false);
      setConfirmAction(null);
      setRejectReason("");
      setVoidReason("");
    }
  }, [isOpen, payRunId]);

  const handleGenerate = async () => {
    if (!token || !payRunId) return;
    setActionLoading("generate");
    setError(null);
    try {
      await payrollService.generatePayRunItems(payRunId, token);
      await loadPayRun();
      onUpdated();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!token || !payRunId) return;
    setActionLoading(`remove_${itemId}`);
    try {
      await payrollService.removePayRunItem(payRunId, itemId, token);
      await loadPayRun();
      onUpdated();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const doLifecycle = async (action: string) => {
    if (!token || !payRunId) return;
    setActionLoading(action);
    setError(null);
    try {
      if (action === "submit") await payrollService.submitPayRun(payRunId, token);
      else if (action === "approve") await payrollService.approvePayRun(payRunId, token);
      else if (action === "reject") await payrollService.rejectPayRun(payRunId, rejectReason, token);
      else if (action === "post") await payrollService.postPayRun(payRunId, token);
      else if (action === "mark-paid") await payrollService.markPaidPayRun(payRunId, token);
      else if (action === "void") await payrollService.voidPayRun(payRunId, voidReason, token);
      else if (action === "delete") { await payrollService.deletePayRun(payRunId, token); onAction("deleted"); onClose(); return; }
      await loadPayRun();
      onAction(action === "mark-paid" ? "paid" : action + "ed");
      setConfirmAction(null);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const isDraft = payRun?.status === "DRAFT";
  const isPendingApproval = payRun?.status === "PENDING_APPROVAL";
  const isApproved = payRun?.status === "APPROVED";
  const isPosted = payRun?.status === "POSTED";
  const isPaid = payRun?.status === "PAID";
  const canViewPayslips = isPosted || isPaid;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 lg:p-8">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : error && !payRun ? (
          <Alert variant="error" title="Error" message={error} />
        ) : payRun ? (
          <>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Badge size="sm" color={statusBadgeColor[payRun.status]} variant="light">{statusLabel[payRun.status]}</Badge>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{payRun.payFrequency}</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {formatDate(payRun.payPeriodStart)} – {formatDate(payRun.payPeriodEnd)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pay Date: {formatDate(payRun.payDate)}</p>
                {payRun.notes && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{payRun.notes}</p>}
              </div>

              {/* Lifecycle action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <ExportButton
                  entityType="pay-run"
                  entityId={payRun.id}
                  fileName={`PayRun_${payRun.id.slice(0, 8)}`}
                  token={token ?? ""}
                  canExport={hasPermission("data:export")}
                />
                {isDraft && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={!!actionLoading}>
                      {actionLoading === "generate" ? "Generating..." : "Auto-Generate"}
                    </Button>
                    <Button size="sm" onClick={() => setConfirmAction("submit")} disabled={!!actionLoading}>
                      Submit for Approval
                    </Button>
                    <button
                      onClick={() => setConfirmAction("delete")}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition"
                      title="Delete pay run"
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </>
                )}
                {isPendingApproval && (
                  <>
                    <button onClick={() => setConfirmAction("reject")} className="inline-flex items-center gap-1.5 rounded-lg border border-error-200 bg-white px-3 py-1.5 text-xs font-medium text-error-600 transition hover:bg-error-50 dark:border-error-800 dark:bg-transparent dark:text-error-400">Reject</button>
                    <Button size="sm" onClick={() => setConfirmAction("approve")} disabled={!!actionLoading}>Approve</Button>
                  </>
                )}
                {isApproved && (
                  <Button size="sm" onClick={() => setConfirmAction("post")} disabled={!!actionLoading}>Post (Create Journal Entry)</Button>
                )}
                {isPosted && (
                  <>
                    <Button size="sm" onClick={() => setConfirmAction("mark-paid")} disabled={!!actionLoading}>Mark as Paid</Button>
                    <button onClick={() => setConfirmAction("void")} className="inline-flex items-center gap-1.5 rounded-lg border border-warning-200 bg-white px-3 py-1.5 text-xs font-medium text-warning-600 transition hover:bg-warning-50 dark:border-warning-800 dark:bg-transparent dark:text-warning-400">Void</button>
                  </>
                )}
                {isPaid && (
                  <button onClick={() => setConfirmAction("void")} className="inline-flex items-center gap-1.5 rounded-lg border border-warning-200 bg-white px-3 py-1.5 text-xs font-medium text-warning-600 transition hover:bg-warning-50 dark:border-warning-800 dark:bg-transparent dark:text-warning-400">Void</button>
                )}
                {canViewPayslips && (
                  <Button variant="outline" size="sm" onClick={() => { setSelectedItemId(null); payslipModal.openModal(); }}>
                    View Payslips
                  </Button>
                )}
              </div>
            </div>

            {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}

            {/* Confirm dialogs */}
            {confirmAction && (
              <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/10">
                <p className="text-sm font-medium text-warning-700 dark:text-warning-300">
                  {confirmAction === "delete" ? "Delete this pay run?" : confirmAction === "void" ? "Void this pay run?" : confirmAction === "reject" ? "Reject this pay run?" : `Confirm ${confirmAction}?`}
                </p>
                {confirmAction === "reject" && (
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={2} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 resize-none focus:outline-none" />
                )}
                {confirmAction === "void" && (
                  <textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for voiding..." rows={2} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 resize-none focus:outline-none" />
                )}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
                  <button
                    onClick={() => doLifecycle(confirmAction)}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-warning-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-warning-600 disabled:opacity-60"
                  >
                    {actionLoading ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </div>
            )}

            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Employees", value: payRun.employeeCount.toString(), sub: "in this run" },
                { label: "Gross Pay", value: formatCurrency(payRun.totalGrossPay), sub: "total" },
                { label: "Net Pay", value: formatCurrency(payRun.totalNetPay), sub: "employees receive" },
                { label: "Deductions", value: formatCurrency(payRun.totalDeductions), sub: "withheld" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{card.label}</p>
                  <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Pay run items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Employees ({payRun.items.length})
                </h3>
                {isDraft && !showAddItem && (
                  <button onClick={() => setShowAddItem(true)} className="text-xs font-medium text-brand-500 hover:text-brand-600 hover:underline">+ Add Employee</button>
                )}
              </div>

              {isDraft && showAddItem && (
                <AddItemForm
                  employees={employees.filter((e) => !payRun.items.find((i) => i.employee.id === e.id))}
                  payRunId={payRun.id}
                  onAdded={async () => { setShowAddItem(false); await loadPayRun(); onUpdated(); }}
                  onCancel={() => setShowAddItem(false)}
                />
              )}

              {payRun.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No employees in this pay run yet.</p>
                  {isDraft && <p className="mt-1 text-xs text-gray-400">Use "Auto-Generate" or "Add Employee" above.</p>}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30">
                          {["Employee", "Reg. Hours", "OT Hours", "Gross Pay", "Deductions", "Net Pay", ""].map((h) => (
                            <th key={h} className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${["Reg. Hours", "OT Hours", "Gross Pay", "Deductions", "Net Pay"].includes(h) ? "text-right" : "text-left"} ${h === "" ? "w-10" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payRun.items.map((item) => (
                          <React.Fragment key={item.id}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white/90">{item.employee.fullName}</p>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.employee.employeeNumber} · {item.employee.department || item.employee.payType}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{item.regularHours}</td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{item.overtimeHours}</td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">{formatCurrency(item.grossPay)}</td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-error-600 dark:text-error-400">−{formatCurrency(item.totalDeductions)}</td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums font-semibold text-success-600 dark:text-success-400">{formatCurrency(item.netPay)}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {canViewPayslips && (
                                    <button
                                      onClick={() => { setSelectedItemId(item.id); payslipModal.openModal(); }}
                                      className="rounded p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-900/20"
                                      title="View Payslip"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    </button>
                                  )}
                                  {isDraft && (
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      disabled={actionLoading === `remove_${item.id}`}
                                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                      title="Remove"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Earnings/deductions breakdown */}
                            {(item.earnings.length > 0 || item.deductions.length > 0) && (
                              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.01]">
                                <td colSpan={7} className="px-4 py-2">
                                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                                    {item.earnings.filter((e) => e.earningType !== "REGULAR").map((e) => (
                                      <span key={e.id} className="text-[11px] text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">{earningLabels[e.earningType]}</span>{e.description ? ` (${e.description})` : ""}: {formatCurrency(e.amount)}
                                      </span>
                                    ))}
                                    {item.deductions.map((d) => (
                                      <span key={d.id} className="text-[11px] text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">{deductionLabels[d.deductionType]}</span>{d.isEmployerContribution ? " (Empl.)" : ""}: −{formatCurrency(d.amount)}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>

                      {/* Footer total */}
                      {payRun.items.length > 1 && (
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30">
                            <td className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</td>
                            <td colSpan={2} />
                            <td className="px-4 py-2.5 text-right text-sm tabular-nums font-bold text-gray-900 dark:text-white">{formatCurrency(payRun.totalGrossPay)}</td>
                            <td className="px-4 py-2.5 text-right text-sm tabular-nums font-bold text-error-600 dark:text-error-400">−{formatCurrency(payRun.totalDeductions)}</td>
                            <td className="px-4 py-2.5 text-right text-sm tabular-nums font-bold text-success-600 dark:text-success-400">{formatCurrency(payRun.totalNetPay)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Void reason display */}
            {payRun.voidReason && (
              <div className="mt-4 rounded-xl bg-gray-100 p-4 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Void Reason</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{payRun.voidReason}</p>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Payslip viewer */}
      {payRun && (
        <PayslipModal
          isOpen={payslipModal.isOpen}
          payRunId={payRun.id}
          itemId={selectedItemId}
          onClose={payslipModal.closeModal}
        />
      )}
    </Modal>
  );
};

export default PayRunDetailModal;
