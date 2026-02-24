"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Expense, ExpenseStatus, ExpenseStatusInfo } from "@/types/expenses";

interface ExpenseDetailModalProps {
  isOpen: boolean;
  expenseId: string | null;
  statusMap: Record<string, ExpenseStatusInfo>;
  onClose: () => void;
  onEdit: (id: string) => void;
  onSubmit: (id: string, expenseNumber: string) => void;
  onApprove: (id: string, expenseNumber: string) => void;
  onReject: (id: string, expenseNumber: string) => void;
  onMarkPaid: (id: string, expenseNumber: string, isReimbursable: boolean) => void;
  onVoid: (id: string, expenseNumber: string) => void;
  onDelete: (id: string, expenseNumber: string) => void;
}

const STATUS_BADGE_COLOR: Record<ExpenseStatus, "light" | "info" | "warning" | "success" | "error" | "primary" | "dark"> = {
  DRAFT: "light",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  REJECTED: "error",
  PAID: "success",
  REIMBURSED: "primary",
  VOID: "dark",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  OTHER: "Other",
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  expenseId,
  statusMap,
  onClose,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onMarkPaid,
  onVoid,
  onDelete,
}) => {
  const { token } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && expenseId && token) {
      setLoading(true);
      setError("");
      expensesService
        .getExpense(expenseId, token)
        .then((data) => setExpense(data))
        .catch((err) => setError(formatApiErrorMessage(err)))
        .finally(() => setLoading(false));
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId, token]);

  if (!isOpen) return null;

  const si = expense ? statusMap[expense.status] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-500">Loading expense...</span>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error" message={error} />
      ) : expense ? (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {expense.expenseNumber}
                </h2>
                <Badge
                  size="sm"
                  color={STATUS_BADGE_COLOR[expense.status]}
                  variant="light"
                >
                  {si?.label || expense.status}
                </Badge>
                {expense.isRecurring && (
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                    Recurring
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {expense.description || "No description"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {si?.allowEdit && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(expense.id); }}>
                  Edit
                </Button>
              )}
              {si?.allowSubmit && (
                <Button size="sm" onClick={() => { onClose(); onSubmit(expense.id, expense.expenseNumber); }}>
                  Submit
                </Button>
              )}
              {si?.allowApprove && (
                <Button size="sm" onClick={() => { onClose(); onApprove(expense.id, expense.expenseNumber); }}>
                  Approve
                </Button>
              )}
              {si?.allowReject && (
                <Button size="sm" className="bg-error-500 hover:bg-error-600" onClick={() => { onClose(); onReject(expense.id, expense.expenseNumber); }}>
                  Reject
                </Button>
              )}
              {si?.allowMarkPaid && (
                <Button size="sm" onClick={() => { onClose(); onMarkPaid(expense.id, expense.expenseNumber, expense.isReimbursable); }}>
                  {expense.isReimbursable ? "Reimburse" : "Mark Paid"}
                </Button>
              )}
              {si?.allowVoid && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onVoid(expense.id, expense.expenseNumber); }}>
                  Void
                </Button>
              )}
              {si?.allowDelete && (
                <Button variant="outline" size="sm" className="text-error-500 border-error-300 hover:bg-error-50" onClick={() => { onClose(); onDelete(expense.id, expense.expenseNumber); }}>
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(expense.expenseDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vendor</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.vendor?.displayName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.category?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Expense Account</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.expenseAccount.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reference #</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.referenceNumber || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.paymentMethod
                    ? PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Payment Account</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.paymentAccount?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.createdBy.firstName} {expense.createdBy.lastName}
                </p>
              </div>
            </div>

            {/* Amounts */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Amounts
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Subtotal</p>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tax ({expense.taxPercent}%)
                  </p>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(expense.taxAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">
                    {formatCurrency(expense.totalAmount)}
                  </p>
                </div>
                {expense.markedUpAmount !== null && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Billable ({expense.markupPercent}% markup)
                    </p>
                    <p className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {formatCurrency(expense.markedUpAmount)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Flags */}
            <div className="flex flex-wrap gap-2">
              {expense.isTaxDeductible && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  Tax Deductible
                </span>
              )}
              {expense.isBillable && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  Billable{expense.billableCustomer ? ` → ${expense.billableCustomer.displayName}` : ""}
                </span>
              )}
              {expense.isReimbursable && (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                  Reimbursable
                  {expense.reimbursedAt
                    ? ` (${formatCurrency(expense.reimbursedAmount || 0)} on ${formatDate(expense.reimbursedAt)})`
                    : ""}
                </span>
              )}
              {expense.isMileage && (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  Mileage: {expense.mileageDistance} mi × ${expense.mileageRate}/mi
                </span>
              )}
            </div>

            {/* Recurring Info */}
            {expense.isRecurring && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 dark:border-teal-800 dark:bg-teal-900/10">
                <h3 className="mb-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                  Recurring Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">Frequency</p>
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      {FREQUENCY_LABELS[expense.recurringFrequency || ""] || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">Next Date</p>
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      {formatDate(expense.nextRecurringDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">End Date</p>
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      {formatDate(expense.recurringEndDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Split Line Items */}
            {expense.lineItems.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Split Line Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Account</th>
                        <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                        <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                        <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.lineItems.map((li) => (
                        <tr key={li.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 text-gray-900 dark:text-white/90">{li.expenseAccount.name}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">{li.description}</td>
                          <td className="py-2 text-right tabular-nums text-gray-900 dark:text-white/90">
                            {formatCurrency(li.amount)}
                          </td>
                          <td className="py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                            {li.taxPercent > 0
                              ? `${formatCurrency(li.taxAmount)} (${li.taxPercent}%)`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Receipt */}
            {(expense.receiptUrl || expense.receiptFileName) && (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Receipt
                </h3>
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {expense.receiptUrl ? (
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-500 hover:text-brand-600 hover:underline"
                    >
                      {expense.receiptFileName || "View Receipt"}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {expense.receiptFileName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Approval Timeline */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Timeline
              </h3>
              <div className="relative space-y-4 pl-6">
                <div className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-px bg-gray-200 dark:bg-gray-700"></div>

                {/* Created */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"></div>
                  <p className="text-sm text-gray-900 dark:text-white">Created</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(expense.createdAt)} by {expense.createdBy.firstName} {expense.createdBy.lastName}
                  </p>
                </div>

                {/* Submitted */}
                {expense.submittedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-blue-400 bg-white dark:border-blue-500 dark:bg-gray-900"></div>
                    <p className="text-sm text-gray-900 dark:text-white">Submitted for Approval</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(expense.submittedAt)}
                    </p>
                  </div>
                )}

                {/* Approved */}
                {expense.approvedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-success-400 bg-white dark:border-success-500 dark:bg-gray-900"></div>
                    <p className="text-sm text-gray-900 dark:text-white">Approved</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(expense.approvedAt)}
                      {expense.approvedBy && ` by ${expense.approvedBy.firstName} ${expense.approvedBy.lastName}`}
                    </p>
                  </div>
                )}

                {/* Rejected */}
                {expense.rejectedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-error-400 bg-white dark:border-error-500 dark:bg-gray-900"></div>
                    <p className="text-sm text-gray-900 dark:text-white">Rejected</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(expense.rejectedAt)}
                    </p>
                    {expense.rejectionReason && (
                      <p className="mt-1 rounded-lg bg-error-50 px-3 py-2 text-xs text-error-700 dark:bg-error-900/20 dark:text-error-300">
                        {expense.rejectionReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Paid */}
                {expense.paidAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-success-500 bg-success-100 dark:bg-success-900"></div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {expense.status === "REIMBURSED" ? "Reimbursed" : "Paid"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(expense.paidAt)}
                    </p>
                  </div>
                )}

                {/* Voided */}
                {expense.voidedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-gray-500 bg-gray-200 dark:bg-gray-700"></div>
                    <p className="text-sm text-gray-900 dark:text-white">Voided</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(expense.voidedAt)}
                    </p>
                    {expense.voidReason && (
                      <p className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {expense.voidReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {expense.notes && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Notes
                </h3>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/40 dark:text-gray-400">
                  {expense.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default ExpenseDetailModal;
