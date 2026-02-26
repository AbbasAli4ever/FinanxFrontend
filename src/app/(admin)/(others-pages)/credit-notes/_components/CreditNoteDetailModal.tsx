"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import creditNotesService from "@/services/creditNotesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { CreditNote } from "@/types/creditNotes";

interface CreditNoteDetailModalProps {
  isOpen: boolean;
  creditNoteId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onOpen: (id: string, number: string, amount: number) => void;
  onApply: (id: string, number: string, customerId: string, remainingCredit: number) => void;
  onRefund: (id: string, number: string, remainingCredit: number) => void;
  onVoid: (id: string, number: string, remainingCredit: number) => void;
  onDelete: (id: string, number: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getStatusBadgeColor(status: string): "light" | "success" | "warning" | "error" | "dark" | "primary" | "info" {
  switch (status) {
    case "DRAFT": return "light";
    case "OPEN": return "info";
    case "PARTIALLY_APPLIED": return "warning";
    case "APPLIED": return "success";
    case "VOID": return "dark";
    default: return "light";
  }
}

const CreditNoteDetailModal: React.FC<CreditNoteDetailModalProps> = ({
  isOpen,
  creditNoteId,
  onClose,
  onEdit,
  onOpen,
  onApply,
  onRefund,
  onVoid,
  onDelete,
}) => {
  const { token } = useAuth();
  const [cn, setCn] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !creditNoteId || !token) return;
    setLoading(true);
    setError("");
    creditNotesService.getCreditNote(creditNoteId, token)
      .then(setCn)
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isOpen, creditNoteId, token]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading credit note...</span>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error" message={error} />
      ) : cn ? (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cn.creditNoteNumber}</h2>
                <Badge variant="light" color={getStatusBadgeColor(cn.status)}>
                  {cn.statusInfo.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {cn.customer.displayName}
                {cn.invoice && <span className="ml-2 text-xs text-brand-500">· {cn.invoice.invoiceNumber}</span>}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(cn.creditNoteDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(cn.totalAmount)}</p>
              {(cn.status === "OPEN" || cn.status === "PARTIALLY_APPLIED") && (
                <p className="text-sm tabular-nums text-brand-600 dark:text-brand-400">
                  {formatCurrency(cn.remainingCredit)} remaining
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
            {cn.statusInfo.allowEdit && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onEdit(cn.id); }}>Edit</Button>
            )}
            {cn.statusInfo.allowOpen && (
              <Button size="sm" onClick={() => { onClose(); onOpen(cn.id, cn.creditNoteNumber, cn.totalAmount); }}>Issue Credit Note</Button>
            )}
            {cn.statusInfo.allowApply && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onApply(cn.id, cn.creditNoteNumber, cn.customer.id, cn.remainingCredit); }}>Apply to Invoice</Button>
            )}
            {cn.statusInfo.allowRefund && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onRefund(cn.id, cn.creditNoteNumber, cn.remainingCredit); }}>Issue Refund</Button>
            )}
            {cn.statusInfo.allowVoid && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onVoid(cn.id, cn.creditNoteNumber, cn.remainingCredit); }}>Void</Button>
            )}
            {cn.statusInfo.allowDelete && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onDelete(cn.id, cn.creditNoteNumber); }}>Delete</Button>
            )}
          </div>

          {/* Reason */}
          {cn.reason && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Reason</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{cn.reason}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Line Items</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Unit Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Disc %</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Tax %</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cn.lineItems.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-gray-900 dark:text-white/90">{line.description}</p>
                        {line.product && <p className="text-[11px] text-gray-400">{line.product.sku}</p>}
                        {line.account && <p className="text-[11px] text-brand-500">{line.account.accountNumber} — {line.account.name}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">{line.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500">{line.discountPercent > 0 ? `${line.discountPercent}%` : "—"}</td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500">{line.taxPercent > 0 ? `${line.taxPercent}%` : "—"}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totals Footer */}
              <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="flex flex-col items-end gap-1 text-sm">
                  <div className="flex gap-12 text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span><span className="tabular-nums">{formatCurrency(cn.subtotal)}</span>
                  </div>
                  {cn.discountAmount > 0 && (
                    <div className="flex gap-12 text-success-600 dark:text-success-400">
                      <span>Discount</span><span className="tabular-nums">-{formatCurrency(cn.discountAmount)}</span>
                    </div>
                  )}
                  {cn.taxAmount > 0 && (
                    <div className="flex gap-12 text-gray-600 dark:text-gray-400">
                      <span>Tax</span><span className="tabular-nums">{formatCurrency(cn.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex gap-12 border-t border-gray-300 pt-1 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                    <span>Total</span><span className="tabular-nums">{formatCurrency(cn.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Applications */}
          {cn.applications.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Applied to Invoices</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Invoice</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Applied On</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cn.applications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-4 py-2.5 font-medium text-brand-600 dark:text-brand-400">{app.invoice.invoiceNumber}</td>
                        <td className="px-4 py-2.5 text-gray-500">{formatDate(app.appliedAt)}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(app.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refunds */}
          {cn.refunds && cn.refunds.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Refunds Issued</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Method</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cn.refunds.map((ref) => (
                      <tr key={ref.id}>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{formatDate(ref.refundDate)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{ref.paymentMethod.replace("_", " ")}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(ref.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {cn.notes && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{cn.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default CreditNoteDetailModal;
