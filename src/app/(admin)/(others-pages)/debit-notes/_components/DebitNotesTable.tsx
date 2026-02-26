"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import type { DebitNoteListItem } from "@/types/debitNotes";

interface DebitNotesTableProps {
  debitNotes: DebitNoteListItem[];
  onView: (dn: DebitNoteListItem) => void;
  onEdit: (dn: DebitNoteListItem) => void;
  onDelete: (dn: DebitNoteListItem) => void;
  onOpen: (dn: DebitNoteListItem) => void;
  onApply: (dn: DebitNoteListItem) => void;
  onRefund: (dn: DebitNoteListItem) => void;
  onVoid: (dn: DebitNoteListItem) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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

const DebitNotesTable: React.FC<DebitNotesTableProps> = ({
  debitNotes, onView, onEdit, onDelete, onOpen, onApply, onRefund, onVoid,
}) => {
  if (!debitNotes || debitNotes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-12 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <svg className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">No debit notes found</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Create a debit note for defective goods or vendor adjustments.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">DN #</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Bill</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Remaining</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {debitNotes.map((dn) => (
              <tr key={dn.id} className="group transition hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <button onClick={() => onView(dn)} className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400">
                    {dn.debitNoteNumber}
                  </button>
                  {dn.referenceNumber && <p className="text-[11px] text-gray-400">{dn.referenceNumber}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(dn.debitNoteDate)}</td>
                <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900 dark:text-white/90">{dn.vendor.displayName}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {dn.bill ? <span className="text-xs text-brand-500">{dn.bill.billNumber}</span> : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(dn.totalAmount)}</td>
                <td className="px-4 py-3 text-right">
                  {(dn.status === "OPEN" || dn.status === "PARTIALLY_APPLIED") ? (
                    <span className="text-sm font-semibold tabular-nums text-brand-600 dark:text-brand-400">{formatCurrency(dn.remainingDebit)}</span>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="light" color={getStatusBadgeColor(dn.status)}>
                    {dn.statusInfo.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onView(dn)} title="View" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    {dn.statusInfo.allowEdit && (
                      <button onClick={() => onEdit(dn)} title="Edit" className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      </button>
                    )}
                    {dn.statusInfo.allowOpen && (
                      <button onClick={() => onOpen(dn)} title="Issue Debit Note" className="rounded-lg p-1.5 text-gray-400 hover:bg-success-50 hover:text-success-600 dark:hover:bg-success-900/20 dark:hover:text-success-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    )}
                    {dn.statusInfo.allowApply && (
                      <button onClick={() => onApply(dn)} title="Apply to Bill" className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </button>
                    )}
                    {dn.statusInfo.allowRefund && (
                      <button onClick={() => onRefund(dn)} title="Receive Refund" className="rounded-lg p-1.5 text-gray-400 hover:bg-warning-50 hover:text-warning-600 dark:hover:bg-warning-900/20 dark:hover:text-warning-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                      </button>
                    )}
                    {dn.statusInfo.allowVoid && (
                      <button onClick={() => onVoid(dn)} title="Void" className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                    )}
                    {dn.statusInfo.allowDelete && (
                      <button onClick={() => onDelete(dn)} title="Delete" className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
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

export default DebitNotesTable;
