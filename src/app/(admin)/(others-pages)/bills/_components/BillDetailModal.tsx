"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import billsService from "@/services/billsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Bill, BillStatus } from "@/types/bills";

interface BillDetailModalProps {
  isOpen: boolean;
  billId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onReceive: (id: string, billNumber: string) => void;
  onRecordPayment: (id: string, billNumber: string, amountDue: number) => void;
  onVoid: (id: string, billNumber: string) => void;
  onDelete: (id: string, billNumber: string) => void;
}

const STATUS_BADGE_COLOR: Record<BillStatus, "light" | "info" | "warning" | "success" | "error" | "dark"> = {
  DRAFT: "light",
  RECEIVED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "error",
  VOID: "dark",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  OTHER: "Other",
};

const BillDetailModal: React.FC<BillDetailModalProps> = ({
  isOpen,
  billId,
  onClose,
  onEdit,
  onReceive,
  onRecordPayment,
  onVoid,
  onDelete,
}) => {
  const { token } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && billId && token) {
      setLoading(true);
      setError("");
      billsService.getBill(billId, token)
        .then((data) => setBill(data))
        .catch((err) => setError(formatApiErrorMessage(err)))
        .finally(() => setLoading(false));
    } else {
      setBill(null);
    }
  }, [isOpen, billId, token]);

  if (!isOpen) return null;

  const si = bill?.statusInfo;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="py-8"><Alert variant="error" title="Error" message={error} /></div>
      ) : bill ? (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{bill.billNumber}</h2>
                <Badge size="sm" color={STATUS_BADGE_COLOR[bill.status]} variant="light">{bill.statusInfo.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {bill.vendor.displayName}
                {bill.vendor.email && ` • ${bill.vendor.email}`}
              </p>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-1">
            {/* Bill Info Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bill Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(bill.billDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(bill.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Payment Terms</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.paymentTerms?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Invoice #</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.vendorInvoiceNumber || "—"}</p>
              </div>
              {bill.referenceNumber && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.referenceNumber}</p>
                </div>
              )}
            </div>

            {/* Vendor Address */}
            {bill.vendor.addressLine1 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Vendor Address</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {bill.vendor.addressLine1}
                  {bill.vendor.addressLine2 && <><br />{bill.vendor.addressLine2}</>}
                  {bill.vendor.city && <><br />{bill.vendor.city}{bill.vendor.state ? `, ${bill.vendor.state}` : ""} {bill.vendor.postalCode || ""}</>}
                  {bill.vendor.country && <><br />{bill.vendor.country}</>}
                </p>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Line Items</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Description</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Expense Acct</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Price</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Disc %</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Tax %</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.lineItems.map((li, idx) => (
                      <tr key={li.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {li.description}
                          {li.product && <span className="ml-1 text-xs text-gray-400">({li.product.sku || li.product.name})</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          {li.expenseAccount ? `${li.expenseAccount.code} - ${li.expenseAccount.name}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{li.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(li.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{li.discountPercent > 0 ? `${li.discountPercent}%` : "—"}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{li.taxPercent > 0 ? `${li.taxPercent}%` : "—"}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(li.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Subtotal</span><span className="text-gray-900 dark:text-white">{formatCurrency(bill.subtotal)}</span></div>
                {bill.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Discount{bill.discountType === "PERCENTAGE" && bill.discountValue ? ` (${bill.discountValue}%)` : ""}</span>
                    <span className="text-error-500">-{formatCurrency(bill.discountAmount)}</span>
                  </div>
                )}
                {bill.taxAmount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Tax</span><span className="text-gray-900 dark:text-white">{formatCurrency(bill.taxAmount)}</span></div>}
                <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                  <div className="flex justify-between text-base font-semibold"><span className="text-gray-900 dark:text-white">Total</span><span className="text-gray-900 dark:text-white">{formatCurrency(bill.totalAmount)}</span></div>
                </div>
                {bill.amountPaid > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Paid</span><span className="text-success-500">{formatCurrency(bill.amountPaid)}</span></div>}
                {bill.amountDue > 0 && <div className="flex justify-between text-sm font-semibold"><span className="text-gray-900 dark:text-white">Amount Due</span><span className="text-error-500">{formatCurrency(bill.amountDue)}</span></div>}
              </div>
            </div>

            {/* Payment History */}
            {bill.payments.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Payment History</h3>
                <div className="space-y-2">
                  {bill.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(p.paymentDate)} • {PAYMENT_METHOD_LABELS[p.paymentMethod || ""] || p.paymentMethod || "—"}
                          {p.referenceNumber && ` • Ref: ${p.referenceNumber}`}
                        </p>
                        {p.notes && <p className="mt-1 text-xs text-gray-400">{p.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes & Memo */}
            {(bill.notes || bill.memo) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {bill.notes && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{bill.notes}</p>
                  </div>
                )}
                {bill.memo && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Internal Memo</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{bill.memo}</p>
                  </div>
                )}
              </div>
            )}

            {/* Void Info */}
            {bill.status === "VOID" && (
              <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 dark:border-error-800 dark:bg-error-900/20">
                <p className="text-sm font-medium text-error-700 dark:text-error-400">Voided on {formatDate(bill.voidedAt)}</p>
                {bill.voidReason && <p className="mt-1 text-sm text-error-600 dark:text-error-300">Reason: {bill.voidReason}</p>}
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 sm:grid-cols-4">
              {bill.paymentAccount && <div><p className="font-medium">Payment Account</p><p>{bill.paymentAccount.code} - {bill.paymentAccount.name}</p></div>}
              {bill.receivedAt && <div><p className="font-medium">Received</p><p>{formatDate(bill.receivedAt)}</p></div>}
              {bill.paidAt && <div><p className="font-medium">Paid</p><p>{formatDate(bill.paidAt)}</p></div>}
              <div><p className="font-medium">Created</p><p>{formatDate(bill.createdAt)}</p></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            {si?.allowEdit && <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(bill.id); }}>Edit</Button>}
            {si?.allowReceive && <Button size="sm" onClick={() => { onClose(); onReceive(bill.id, bill.billNumber); }}>Receive Bill</Button>}
            {si?.allowPayment && <Button size="sm" onClick={() => { onClose(); onRecordPayment(bill.id, bill.billNumber, bill.amountDue); }}>Record Payment</Button>}
            {si?.allowVoid && <Button variant="outline" size="sm" onClick={() => { onClose(); onVoid(bill.id, bill.billNumber); }}>Void</Button>}
            {si?.allowDelete && <Button variant="outline" size="sm" onClick={() => { onClose(); onDelete(bill.id, bill.billNumber); }}>Delete</Button>}
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default BillDetailModal;
