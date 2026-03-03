"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import type { SOListItem, SOStatus } from "@/types/salesOrders";

interface Props {
  salesOrders: SOListItem[];
  loading?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSend: (id: string, soNumber: string, amount: number) => void;
  onConfirm: (id: string, soNumber: string) => void;
  onFulfill: (id: string) => void;
  onConvert: (id: string, soNumber: string, amount: number) => void;
  onClose: (id: string, soNumber: string) => void;
  onVoid: (id: string, soNumber: string) => void;
  onDelete: (id: string, soNumber: string) => void;
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusBadgeColor(status: SOStatus): "light" | "success" | "warning" | "error" | "dark" | "primary" | "info" {
  switch (status) {
    case "DRAFT":     return "light";
    case "SENT":      return "info";
    case "CONFIRMED": return "primary";
    case "PARTIAL":   return "warning";
    case "FULFILLED": return "success";
    case "CLOSED":    return "success";
    case "VOID":      return "dark";
    default:          return "light";
  }
}

function getStatusBadgeVariant(status: SOStatus): "light" | "solid" {
  return status === "CLOSED" ? "solid" : "light";
}

function DeliveryDateCell({ date, status }: { date: string | null; status: SOStatus }) {
  if (!date) return <span className="text-gray-400">—</span>;
  const isOverdueStatus = status === "SENT" || status === "CONFIRMED" || status === "PARTIAL";
  if (!isOverdueStatus) return <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(date)}</span>;

  const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (daysUntil < 0) {
    return (
      <span className="text-sm font-medium text-error-600 dark:text-error-400">
        {formatDate(date)}
        <span className="ml-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">LATE</span>
      </span>
    );
  }
  if (daysUntil <= 7) {
    return (
      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
        {formatDate(date)}
        <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{daysUntil}d</span>
      </span>
    );
  }
  return <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(date)}</span>;
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

const SalesOrdersTable: React.FC<Props> = ({
  salesOrders, loading,
  onView, onEdit, onSend, onConfirm, onFulfill, onConvert, onClose, onVoid, onDelete,
}) => {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
              {["SO #", "Date", "Expected", "Customer", "Items", "Total", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (!salesOrders || salesOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">No sales orders found</p>
        <p className="mt-1 text-xs text-gray-400">Create your first sales order to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">SO #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Expected Delivery</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {salesOrders.map((so) => (
              <tr
                key={so.id}
                className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
                onClick={() => onView(so.id)}
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{so.soNumber}</span>
                  {so.referenceNumber && (
                    <p className="text-[11px] text-gray-400">{so.referenceNumber}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(so.orderDate)}</td>
                <td className="px-4 py-3">
                  <DeliveryDateCell date={so.expectedDeliveryDate} status={so.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 dark:text-white/90">{so.customer.displayName}</span>
                  {so.customer.email && <p className="text-[11px] text-gray-400">{so.customer.email}</p>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {so.lineItemCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white/90">
                  {formatCurrency(so.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusBadgeVariant(so.status)} color={getStatusBadgeColor(so.status)}>
                    {so.statusInfo.label}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {so.statusInfo.allowSend && (
                      <button onClick={() => onSend(so.id, so.soNumber, Number(so.totalAmount))}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">Send</button>
                    )}
                    {so.statusInfo.allowConfirm && (
                      <button onClick={() => onConfirm(so.id, so.soNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20">Confirm</button>
                    )}
                    {so.statusInfo.allowFulfill && (
                      <button onClick={() => onFulfill(so.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20">Fulfill</button>
                    )}
                    {so.statusInfo.allowConvert && (
                      <button onClick={() => onConvert(so.id, so.soNumber, Number(so.totalAmount))}
                        className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">Invoice</button>
                    )}
                    {so.statusInfo.allowEdit && (
                      <button onClick={() => onEdit(so.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Edit</button>
                    )}
                    {so.statusInfo.allowClose && (
                      <button onClick={() => onClose(so.id, so.soNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Close</button>
                    )}
                    {so.statusInfo.allowVoid && (
                      <button onClick={() => onVoid(so.id, so.soNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400">Void</button>
                    )}
                    {so.statusInfo.allowDelete && (
                      <button onClick={() => onDelete(so.id, so.soNumber)}
                        className="rounded px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400">Delete</button>
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

export default SalesOrdersTable;
