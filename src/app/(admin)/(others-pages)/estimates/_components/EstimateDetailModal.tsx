"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Estimate } from "@/types/estimates";

interface EstimateDetailModalProps {
  isOpen: boolean;
  estimateId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onSend: (id: string, number: string, amount: number) => void;
  onAccept: (id: string, number: string, amount: number) => void;
  onReject: (id: string, number: string) => void;
  onConvert: (id: string, number: string, amount: number) => void;
  onVoid: (id: string, number: string) => void;
  onDelete: (id: string, number: string) => void;
  onDuplicated: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getStatusBadgeProps(status: string): { variant: "light" | "solid"; color: "light" | "success" | "warning" | "error" | "dark" | "primary" | "info" } {
  switch (status) {
    case "DRAFT":     return { variant: "light", color: "light" };
    case "SENT":      return { variant: "light", color: "info" };
    case "VIEWED":    return { variant: "light", color: "primary" };
    case "ACCEPTED":  return { variant: "light", color: "success" };
    case "REJECTED":  return { variant: "light", color: "error" };
    case "EXPIRED":   return { variant: "light", color: "warning" };
    case "CONVERTED": return { variant: "solid", color: "success" };
    case "VOID":      return { variant: "light", color: "dark" };
    default:          return { variant: "light", color: "light" };
  }
}

const EstimateDetailModal: React.FC<EstimateDetailModalProps> = ({
  isOpen, estimateId, onClose, onEdit, onSend, onAccept, onReject, onConvert, onVoid, onDelete, onDuplicated,
}) => {
  const { token } = useAuth();
  const [est, setEst] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (!isOpen || !estimateId || !token) return;
    setLoading(true); setError("");
    estimatesService.getEstimate(estimateId, token)
      .then(setEst)
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isOpen, estimateId, token]);

  const handleDuplicate = async () => {
    if (!token || !est) return;
    setDuplicating(true);
    try {
      await estimatesService.duplicateEstimate(est.id, token);
      onDuplicated(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setDuplicating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading estimate...</span>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error" message={error} />
      ) : est ? (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{est.estimateNumber}</h2>
                <Badge variant={getStatusBadgeProps(est.status).variant} color={getStatusBadgeProps(est.status).color}>
                  {est.statusInfo.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{est.customer.displayName}</p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span>Issued {formatDate(est.estimateDate)}</span>
                {est.expirationDate && <span>· Expires {formatDate(est.expirationDate)}</span>}
              </div>
              {est.referenceNumber && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Ref: {est.referenceNumber}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(est.totalAmount)}</p>
              {est.convertedInvoice && (
                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  → {est.convertedInvoice.invoiceNumber}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
            {est.statusInfo.allowEdit && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onEdit(est.id); }}>Edit</Button>
            )}
            {est.statusInfo.allowSend && (
              <Button size="sm" onClick={() => { onClose(); onSend(est.id, est.estimateNumber, est.totalAmount); }}>Send Estimate</Button>
            )}
            {est.statusInfo.allowAccept && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onAccept(est.id, est.estimateNumber, est.totalAmount); }}>Accept</Button>
            )}
            {est.statusInfo.allowReject && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onReject(est.id, est.estimateNumber); }}>Reject</Button>
            )}
            {est.statusInfo.allowConvert && (
              <Button size="sm" onClick={() => { onClose(); onConvert(est.id, est.estimateNumber, est.totalAmount); }}>Convert to Invoice</Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
            {est.statusInfo.allowVoid && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onVoid(est.id, est.estimateNumber); }}>Void</Button>
            )}
            {est.statusInfo.allowDelete && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onDelete(est.id, est.estimateNumber); }}>Delete</Button>
            )}
          </div>

          {/* Customer Message */}
          {est.customerMessage && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-800 dark:bg-blue-900/10">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Customer Message</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{est.customerMessage}</p>
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
                  {est.lineItems.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-gray-900 dark:text-white/90">{line.description}</p>
                        {line.product && <p className="text-[11px] text-gray-400">{line.product.sku}</p>}
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
                  <div className="flex gap-12 text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(est.subtotal)}</span></div>
                  {est.discountAmount > 0 && <div className="flex gap-12 text-success-600 dark:text-success-400"><span>Discount</span><span className="tabular-nums">-{formatCurrency(est.discountAmount)}</span></div>}
                  {est.taxAmount > 0 && <div className="flex gap-12 text-gray-600 dark:text-gray-400"><span>Tax</span><span className="tabular-nums">{formatCurrency(est.taxAmount)}</span></div>}
                  <div className="flex gap-12 border-t border-gray-300 pt-1 font-bold text-gray-900 dark:border-gray-700 dark:text-white"><span>Total</span><span className="tabular-nums">{formatCurrency(est.totalAmount)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {(est.termsAndConditions || est.notes) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {est.termsAndConditions && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Terms & Conditions</p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{est.termsAndConditions}</p>
                </div>
              )}
              {est.notes && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Internal Notes</p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{est.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Converted Invoice */}
          {est.convertedInvoice && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/10">
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Converted to Invoice</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{est.convertedInvoice.invoiceNumber}</p>
              </div>
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

export default EstimateDetailModal;
