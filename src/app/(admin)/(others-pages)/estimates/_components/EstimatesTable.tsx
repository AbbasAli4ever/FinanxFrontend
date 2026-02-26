"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import type { EstimateListItem } from "@/types/estimates";

interface EstimatesTableProps {
  estimates: EstimateListItem[];
  onView: (est: EstimateListItem) => void;
  onEdit: (est: EstimateListItem) => void;
  onDelete: (est: EstimateListItem) => void;
  onSend: (est: EstimateListItem) => void;
  onAccept: (est: EstimateListItem) => void;
  onReject: (est: EstimateListItem) => void;
  onConvert: (est: EstimateListItem) => void;
  onVoid: (est: EstimateListItem) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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

function getExpiryDisplay(expirationDate: string | null): { text: string; className: string; showWarning: boolean } {
  if (!expirationDate) return { text: "—", className: "text-gray-400 dark:text-gray-500", showWarning: false };
  const days = Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: formatDate(expirationDate), className: "text-error-600 dark:text-error-400", showWarning: false };
  if (days <= 7) return { text: formatDate(expirationDate), className: "text-warning-600 dark:text-warning-400", showWarning: true };
  return { text: formatDate(expirationDate), className: "text-gray-500 dark:text-gray-400", showWarning: false };
}

const EstimatesTable: React.FC<EstimatesTableProps> = ({
  estimates, onView, onEdit, onDelete, onSend, onAccept, onReject, onConvert, onVoid,
}) => {
  if (!estimates || estimates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-12 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <svg className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-400">No estimates found</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Create an estimate to send quotes to customers</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">EST #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Expires</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {estimates.map((est) => {
              const { allowEdit, allowDelete, allowSend, allowAccept, allowReject, allowConvert, allowVoid } = est.statusInfo;
              const badgeProps = getStatusBadgeProps(est.status);
              const expiry = getExpiryDisplay(est.expirationDate);

              return (
                <tr
                  key={est.id}
                  className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => onView(est)} className="text-left">
                      <p className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">{est.estimateNumber}</p>
                      {est.referenceNumber && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{est.referenceNumber}</p>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(est.estimateDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-sm ${expiry.className}`}>
                      {expiry.showWarning && (
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      )}
                      {expiry.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{est.customer.displayName}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(est.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={badgeProps.variant} color={badgeProps.color}>
                      {est.statusInfo.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <button onClick={() => onView(est)} title="View" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      {allowEdit && (
                        <button onClick={() => onEdit(est)} title="Edit" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                        </button>
                      )}
                      {allowSend && (
                        <button onClick={() => onSend(est)} title="Send" className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                        </button>
                      )}
                      {allowAccept && (
                        <button onClick={() => onAccept(est)} title="Accept" className="rounded-lg p-1.5 text-success-500 hover:bg-success-50 hover:text-success-700 dark:hover:bg-success-900/20">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                      )}
                      {allowReject && (
                        <button onClick={() => onReject(est)} title="Reject" className="rounded-lg p-1.5 text-error-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                      {allowConvert && (
                        <button onClick={() => onConvert(est)} title="Convert to Invoice" className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                        </button>
                      )}
                      {allowVoid && (
                        <button onClick={() => onVoid(est)} title="Void" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                      )}
                      {allowDelete && (
                        <button onClick={() => onDelete(est)} title="Delete" className="rounded-lg p-1.5 text-error-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstimatesTable;
