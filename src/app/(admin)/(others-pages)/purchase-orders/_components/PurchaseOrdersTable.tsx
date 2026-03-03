"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import type { POListItem, POStatus } from "@/types/purchaseOrders";

interface Props {
  purchaseOrders: POListItem[];
  loading?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSend: (id: string, poNumber: string, amount: number) => void;
  onReceive: (id: string) => void;
  onConvert: (id: string, poNumber: string, amount: number) => void;
  onClose: (id: string, poNumber: string) => void;
  onVoid: (id: string, poNumber: string) => void;
  onDelete: (id: string, poNumber: string) => void;
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function DeliveryDateCell({ date, status }: { date: string | null; status: POStatus }) {
  if (!date) return <span className="text-gray-400">—</span>;
  const isOverdueStatus = status === "SENT" || status === "PARTIAL";
  if (!isOverdueStatus) return <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(date)}</span>;

  const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  let cls = "text-sm text-gray-600 dark:text-gray-400";
  let badge: React.ReactNode = null;
  if (daysUntil < 0) {
    cls = "text-sm font-medium text-error-600 dark:text-error-400";
    badge = <span className="ml-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">OVERDUE</span>;
  } else if (daysUntil <= 7) {
    cls = "text-sm font-medium text-amber-600 dark:text-amber-400";
    badge = <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{daysUntil}d</span>;
  }
  return <span className={cls}>{formatDate(date)}{badge}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

const PurchaseOrdersTable: React.FC<Props> = ({
  purchaseOrders, loading,
  onView, onEdit, onSend, onReceive, onConvert, onClose, onVoid, onDelete,
}) => {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">PO #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Expected</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (!purchaseOrders || purchaseOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">No purchase orders found</p>
        <p className="mt-1 text-xs text-gray-400">Create your first purchase order to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">PO #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">PO Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Expected Delivery</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {purchaseOrders.map((po) => (
              <tr
                key={po.id}
                className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
                onClick={() => onView(po.id)}
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{po.poNumber}</span>
                  {po.convertedBill && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">→ {po.convertedBill.billNumber}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(po.poDate)}</td>
                <td className="px-4 py-3">
                  <DeliveryDateCell date={po.expectedDeliveryDate} status={po.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 dark:text-white/90">{po.vendor.displayName}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {po.lineItemCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white/90">
                  {formatCurrency(po.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusBadgeVariant(po.status)} color={getStatusBadgeColor(po.status)}>
                    {po.statusInfo.label}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {po.statusInfo.allowSend && (
                      <button
                        onClick={() => onSend(po.id, po.poNumber, Number(po.totalAmount))}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        title="Send"
                      >Send</button>
                    )}
                    {po.statusInfo.allowReceive && (
                      <button
                        onClick={() => onReceive(po.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                        title="Receive"
                      >Receive</button>
                    )}
                    {po.statusInfo.allowConvert && (
                      <button
                        onClick={() => onConvert(po.id, po.poNumber, Number(po.totalAmount))}
                        className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        title="Convert to Bill"
                      >Bill</button>
                    )}
                    {po.statusInfo.allowEdit && (
                      <button
                        onClick={() => onEdit(po.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Edit"
                      >Edit</button>
                    )}
                    {po.statusInfo.allowClose && (
                      <button
                        onClick={() => onClose(po.id, po.poNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Close"
                      >Close</button>
                    )}
                    {po.statusInfo.allowVoid && (
                      <button
                        onClick={() => onVoid(po.id, po.poNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        title="Void"
                      >Void</button>
                    )}
                    {po.statusInfo.allowDelete && (
                      <button
                        onClick={() => onDelete(po.id, po.poNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        title="Delete"
                      >Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrdersTable;
