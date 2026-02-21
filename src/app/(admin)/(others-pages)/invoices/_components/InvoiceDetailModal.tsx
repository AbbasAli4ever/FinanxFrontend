"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import invoicesService from "@/services/invoicesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Invoice, InvoiceStatus } from "@/types/invoices";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onSend: (id: string, invoiceNumber: string) => void;
  onRecordPayment: (id: string, invoiceNumber: string, amountDue: number) => void;
  onVoid: (id: string, invoiceNumber: string) => void;
  onDelete: (id: string, invoiceNumber: string) => void;
}

const STATUS_BADGE_MAP: Record<InvoiceStatus, "light" | "info" | "warning" | "success" | "error" | "dark"> = {
  DRAFT: "light",
  SENT: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "error",
  VOID: "dark",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  OTHER: "Other",
};

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  invoiceId,
  onClose,
  onEdit,
  onSend,
  onRecordPayment,
  onVoid,
  onDelete,
}) => {
  const { token } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && invoiceId && token) {
      setLoading(true);
      setError("");
      invoicesService
        .getInvoice(invoiceId, token)
        .then((data) => setInvoice(data))
        .catch((err) => setError(formatApiErrorMessage(err)))
        .finally(() => setLoading(false));
    } else {
      setInvoice(null);
    }
  }, [isOpen, invoiceId, token]);

  if (!isOpen) return null;

  const si = invoice?.statusInfo;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="py-8">
          <Alert variant="error" title="Error" message={error} />
        </div>
      ) : invoice ? (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {invoice.invoiceNumber}
                </h2>
                <Badge size="sm" color={STATUS_BADGE_MAP[invoice.status]} variant="light">
                  {invoice.statusInfo.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {invoice.customer.displayName}
                {invoice.customer.email && ` • ${invoice.customer.email}`}
              </p>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-1">
            {/* Invoice Info Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(invoice.invoiceDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Payment Terms</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.paymentTerms?.replace(/_/g, " ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.referenceNumber || "—"}
                </p>
              </div>
            </div>

            {/* Customer Billing Address */}
            {invoice.customer.billingAddressLine1 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Billing Address
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {invoice.customer.billingAddressLine1}
                  {invoice.customer.billingAddressLine2 && <><br />{invoice.customer.billingAddressLine2}</>}
                  {invoice.customer.billingCity && <><br />{invoice.customer.billingCity}{invoice.customer.billingState ? `, ${invoice.customer.billingState}` : ""} {invoice.customer.billingPostalCode || ""}</>}
                  {invoice.customer.billingCountry && <><br />{invoice.customer.billingCountry}</>}
                </p>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Line Items
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Description</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Price</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Disc %</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Tax %</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((li, idx) => (
                      <tr key={li.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {li.description}
                          {li.product && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({li.product.sku || li.product.name})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{li.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(li.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                          {li.discountPercent > 0 ? `${li.discountPercent}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                          {li.taxPercent > 0 ? `${li.taxPercent}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(li.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Discount
                      {invoice.discountType === "PERCENTAGE" && invoice.discountValue
                        ? ` (${invoice.discountValue}%)`
                        : ""}
                    </span>
                    <span className="text-error-500">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
                {invoice.amountPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Paid</span>
                    <span className="text-success-500">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                )}
                {invoice.amountDue > 0 && (
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-900 dark:text-white">Amount Due</span>
                    <span className="text-error-500">{formatCurrency(invoice.amountDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Payment History
                </h3>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(p.paymentDate)} •{" "}
                          {PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                          {p.referenceNumber && ` • Ref: ${p.referenceNumber}`}
                        </p>
                        {p.notes && (
                          <p className="mt-1 text-xs text-gray-400">{p.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes & Terms */}
            {(invoice.notes || invoice.termsAndConditions) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {invoice.notes && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.termsAndConditions && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Terms & Conditions</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{invoice.termsAndConditions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Void Info */}
            {invoice.status === "VOID" && (
              <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 dark:border-error-800 dark:bg-error-900/20">
                <p className="text-sm font-medium text-error-700 dark:text-error-400">
                  Voided on {formatDate(invoice.voidedAt)}
                </p>
                {invoice.voidReason && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-300">
                    Reason: {invoice.voidReason}
                  </p>
                )}
              </div>
            )}

            {/* Deposit Account & Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 sm:grid-cols-4">
              {invoice.depositAccount && (
                <div>
                  <p className="font-medium">Deposit Account</p>
                  <p>{invoice.depositAccount.accountNumber} - {invoice.depositAccount.name}</p>
                </div>
              )}
              {invoice.sentAt && (
                <div>
                  <p className="font-medium">Sent</p>
                  <p>{formatDate(invoice.sentAt)}</p>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <p className="font-medium">Paid</p>
                  <p>{formatDate(invoice.paidAt)}</p>
                </div>
              )}
              <div>
                <p className="font-medium">Created</p>
                <p>{formatDate(invoice.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            {si?.allowEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(invoice.id);
                }}
              >
                Edit
              </Button>
            )}
            {si?.allowSend && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onSend(invoice.id, invoice.invoiceNumber);
                }}
              >
                Send Invoice
              </Button>
            )}
            {si?.allowPayment && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice.id, invoice.invoiceNumber, invoice.amountDue);
                }}
              >
                Record Payment
              </Button>
            )}
            {si?.allowVoid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onVoid(invoice.id, invoice.invoiceNumber);
                }}
              >
                Void
              </Button>
            )}
            {si?.allowDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(invoice.id, invoice.invoiceNumber);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default InvoiceDetailModal;
