"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import purchaseOrdersService from "@/services/purchaseOrdersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PurchaseOrder, POStatus } from "@/types/purchaseOrders";

interface Props {
  isOpen: boolean;
  poId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onSend: (id: string, poNumber: string, amount: number) => void;
  onReceive: (id: string) => void;
  onConvert: (id: string, poNumber: string, amount: number) => void;
  onClose2: (id: string, poNumber: string) => void;
  onVoid: (id: string, poNumber: string) => void;
  onDelete: (id: string, poNumber: string) => void;
  onDuplicated: () => void;
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getStatusBadgeColor(status: POStatus): "light" | "success" | "warning" | "error" | "dark" | "primary" | "info" {
  switch (status) {
    case "DRAFT":    return "light";
    case "SENT":     return "info";
    case "PARTIAL":  return "warning";
    case "RECEIVED": return "success";
    case "CLOSED":   return "success";
    case "VOID":     return "dark";
    default:         return "light";
  }
}

function getStatusBadgeVariant(status: POStatus): "light" | "solid" {
  return status === "CLOSED" ? "solid" : "light";
}

const PurchaseOrderDetailModal: React.FC<Props> = ({
  isOpen, poId, onClose, onEdit, onSend, onReceive, onConvert, onClose2, onVoid, onDelete, onDuplicated,
}) => {
  const { token } = useAuth();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (!isOpen || !poId || !token) return;
    setLoading(true); setError("");
    purchaseOrdersService.getPurchaseOrder(poId, token)
      .then(setPo)
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isOpen, poId, token]);

  const handleDuplicate = async () => {
    if (!token || !po) return;
    setDuplicating(true);
    try {
      await purchaseOrdersService.duplicatePurchaseOrder(po.id, token);
      onDuplicated(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setDuplicating(false);
    }
  };

  const hasShipping = po && (po.shippingAddressLine1 || po.shippingCity || po.shippingCountry);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading purchase order...</span>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error" message={error} />
      ) : po ? (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{po.poNumber}</h2>
                <Badge variant={getStatusBadgeVariant(po.status)} color={getStatusBadgeColor(po.status)}>
                  {po.statusInfo.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{po.vendor.displayName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                <span>PO Date: {formatDate(po.poDate)}</span>
                {po.expectedDeliveryDate && <span>· Delivery: {formatDate(po.expectedDeliveryDate)}</span>}
                {po.paymentTerms && <span>· {po.paymentTerms}</span>}
              </div>
              {po.referenceNumber && (
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Ref: {po.referenceNumber}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(po.totalAmount)}</p>
              {po.convertedBill && (
                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  → {po.convertedBill.billNumber}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
            {po.statusInfo.allowEdit && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onEdit(po.id); }}>Edit</Button>
            )}
            {po.statusInfo.allowSend && (
              <Button size="sm" onClick={() => { onClose(); onSend(po.id, po.poNumber, po.totalAmount); }}>Send to Vendor</Button>
            )}
            {po.statusInfo.allowReceive && (
              <Button size="sm" onClick={() => { onClose(); onReceive(po.id); }}>Receive Items</Button>
            )}
            {po.statusInfo.allowConvert && (
              <Button size="sm" onClick={() => { onClose(); onConvert(po.id, po.poNumber, po.totalAmount); }}>Convert to Bill</Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
            {po.statusInfo.allowClose && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onClose2(po.id, po.poNumber); }}>Close PO</Button>
            )}
            {po.statusInfo.allowVoid && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onVoid(po.id, po.poNumber); }}>Void</Button>
            )}
            {po.statusInfo.allowDelete && (
              <Button size="sm" variant="outline" onClick={() => { onClose(); onDelete(po.id, po.poNumber); }}>Delete</Button>
            )}
          </div>

          {/* Vendor Message */}
          {po.vendorMessage && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-800 dark:bg-blue-900/10">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Message to Vendor</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{po.vendorMessage}</p>
            </div>
          )}

          {/* Shipping Address */}
          {hasShipping && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Shipping Address</p>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {po.shippingAddressLine1 && <p>{po.shippingAddressLine1}</p>}
                {po.shippingAddressLine2 && <p>{po.shippingAddressLine2}</p>}
                <p>
                  {[po.shippingCity, po.shippingState, po.shippingPostalCode].filter(Boolean).join(", ")}
                  {po.shippingCountry && ` · ${po.shippingCountry}`}
                </p>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Line Items</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Unit Price</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Disc %</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Tax %</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Qty Rcvd</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {po.lineItems.map((line) => {
                      const progress = line.quantity > 0
                        ? Math.min((line.quantityReceived / line.quantity) * 100, 100)
                        : 0;
                      const isFullyReceived = line.quantityReceived >= line.quantity;
                      return (
                        <tr key={line.id}>
                          <td className="px-4 py-2.5">
                            <p className="text-sm text-gray-900 dark:text-white/90">{line.description}</p>
                            {line.product && <p className="text-[11px] text-gray-400">{line.product.sku}</p>}
                            {line.expenseAccount && (
                              <p className="text-[11px] text-gray-400">{line.expenseAccount.accountNumber} - {line.expenseAccount.name}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">{line.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">{formatCurrency(line.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500">{line.discountPercent > 0 ? `${line.discountPercent}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500">{line.taxPercent > 0 ? `${line.taxPercent}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(line.amount)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-sm tabular-nums font-medium ${isFullyReceived ? "text-green-600 dark:text-green-400" : line.quantityReceived > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>
                              {line.quantityReceived} / {line.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className={`h-full rounded-full transition-all ${isFullyReceived ? "bg-green-500" : "bg-amber-400"}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-gray-400">{Math.round(progress)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="flex flex-col items-end gap-1 text-sm">
                  <div className="flex gap-12 text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(po.subtotal)}</span></div>
                  {po.discountAmount > 0 && (
                    <div className="flex gap-12 text-success-600 dark:text-success-400"><span>Discount</span><span className="tabular-nums">-{formatCurrency(po.discountAmount)}</span></div>
                  )}
                  {po.taxAmount > 0 && (
                    <div className="flex gap-12 text-gray-600 dark:text-gray-400"><span>Tax</span><span className="tabular-nums">{formatCurrency(po.taxAmount)}</span></div>
                  )}
                  <div className="flex gap-12 border-t border-gray-300 pt-1 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                    <span>Total</span><span className="tabular-nums">{formatCurrency(po.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Memo */}
          {(po.notes || po.memo) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {po.notes && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Internal Notes</p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{po.notes}</p>
                </div>
              )}
              {po.memo && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Memo</p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{po.memo}</p>
                </div>
              )}
            </div>
          )}

          {/* Void reason */}
          {po.voidReason && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Void Reason</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{po.voidReason}</p>
            </div>
          )}

          {/* Converted Bill Banner */}
          {po.convertedBill && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/10">
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Converted to Bill</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {po.convertedBill.billNumber} · {po.convertedBill.status} · {formatCurrency(po.convertedBill.totalAmount)}
                </p>
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

export default PurchaseOrderDetailModal;
