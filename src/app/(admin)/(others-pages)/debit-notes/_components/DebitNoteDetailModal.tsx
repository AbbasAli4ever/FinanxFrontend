"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import debitNotesService from "@/services/debitNotesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { DebitNote } from "@/types/debitNotes";

interface DebitNoteDetailModalProps {
  isOpen: boolean;
  debitNoteId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onOpen: (id: string, number: string, amount: number) => void;
  onApply: (id: string, number: string, vendorId: string, remainingDebit: number) => void;
  onRefund: (id: string, number: string, remainingDebit: number) => void;
  onVoid: (id: string, number: string, remainingDebit: number) => void;
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

const DebitNoteDetailModal: React.FC<DebitNoteDetailModalProps> = ({
  isOpen, debitNoteId, onClose, onEdit, onOpen, onApply, onRefund, onVoid, onDelete,
}) => {
  const { token } = useAuth();
  const [dn, setDn] = useState<DebitNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !debitNoteId || !token) return;
    setLoading(true); setError("");
    debitNotesService.getDebitNote(debitNoteId, token)
      .then(setDn)
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isOpen, debitNoteId, token]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading debit note...</span>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error" message={error} />
      ) : dn ? (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{dn.debitNoteNumber}</h2>
                <Badge variant="light" color={getStatusBadgeColor(dn.status)}>
                  {dn.statusInfo.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {dn.vendor.displayName}
                {dn.bill && <span className="ml-2 text-xs text-brand-500">· {dn.bill.billNumber}</span>}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(dn.debitNoteDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(dn.totalAmount)}</p>
              {(dn.status === "OPEN" || dn.status === "PARTIALLY_APPLIED") && (
                <p className="text-sm tabular-nums text-brand-600 dark:text-brand-400">{formatCurrency(dn.remainingDebit)} remaining</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
            {dn.statusInfo.allowEdit && <Button size="sm" variant="outline" onClick={() => { onClose(); onEdit(dn.id); }}>Edit</Button>}
            {dn.statusInfo.allowOpen && <Button size="sm" onClick={() => { onClose(); onOpen(dn.id, dn.debitNoteNumber, dn.totalAmount); }}>Issue Debit Note</Button>}
            {dn.statusInfo.allowApply && <Button size="sm" variant="outline" onClick={() => { onClose(); onApply(dn.id, dn.debitNoteNumber, dn.vendor.id, dn.remainingDebit); }}>Apply to Bill</Button>}
            {dn.statusInfo.allowRefund && <Button size="sm" variant="outline" onClick={() => { onClose(); onRefund(dn.id, dn.debitNoteNumber, dn.remainingDebit); }}>Receive Refund</Button>}
            {dn.statusInfo.allowVoid && <Button size="sm" variant="outline" onClick={() => { onClose(); onVoid(dn.id, dn.debitNoteNumber, dn.remainingDebit); }}>Void</Button>}
            {dn.statusInfo.allowDelete && <Button size="sm" variant="outline" onClick={() => { onClose(); onDelete(dn.id, dn.debitNoteNumber); }}>Delete</Button>}
          </div>

          {dn.reason && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Reason</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{dn.reason}</p>
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
                  {dn.lineItems.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-gray-900 dark:text-white/90">{line.description}</p>
                        {line.product && <p className="text-[11px] text-gray-400">{line.product.sku}</p>}
                        {line.expenseAccount && <p className="text-[11px] text-brand-500">{line.expenseAccount.accountNumber} — {line.expenseAccount.name}</p>}
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
              <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="flex flex-col items-end gap-1 text-sm">
                  <div className="flex gap-12 text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(dn.subtotal)}</span></div>
                  {dn.discountAmount > 0 && <div className="flex gap-12 text-success-600 dark:text-success-400"><span>Discount</span><span className="tabular-nums">-{formatCurrency(dn.discountAmount)}</span></div>}
                  {dn.taxAmount > 0 && <div className="flex gap-12 text-gray-600 dark:text-gray-400"><span>Tax</span><span className="tabular-nums">{formatCurrency(dn.taxAmount)}</span></div>}
                  <div className="flex gap-12 border-t border-gray-300 pt-1 font-bold text-gray-900 dark:border-gray-700 dark:text-white"><span>Total</span><span className="tabular-nums">{formatCurrency(dn.totalAmount)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Applications to Bills */}
          {dn.applications.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Applied to Bills</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Bill</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Applied On</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {dn.applications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-4 py-2.5 font-medium text-brand-600 dark:text-brand-400">{app.bill.billNumber}</td>
                        <td className="px-4 py-2.5 text-gray-500">{formatDate(app.appliedAt)}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(app.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refunds Received */}
          {dn.refunds && dn.refunds.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Refunds Received</h3>
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
                    {dn.refunds.map((ref) => (
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

          {dn.notes && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{dn.notes}</p>
            </div>
          )}

          <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default DebitNoteDetailModal;
