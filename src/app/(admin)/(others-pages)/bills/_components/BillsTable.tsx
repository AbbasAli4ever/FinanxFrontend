"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import type { BillListItem } from "@/types/bills";

interface BillsTableProps {
  bills: BillListItem[];
  onView: (bill: BillListItem) => void;
  onEdit: (bill: BillListItem) => void;
  onDelete: (bill: BillListItem) => void;
  onReceive: (bill: BillListItem) => void;
  onVoid: (bill: BillListItem) => void;
  onRecordPayment: (bill: BillListItem) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusBadgeColor: Record<
  string,
  "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"
> = {
  DRAFT: "light",
  RECEIVED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "error",
  VOID: "dark",
};

const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  onView,
  onEdit,
  onDelete,
  onReceive,
  onVoid,
  onRecordPayment,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-800">
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Bill #
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Vendor
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Vendor Inv #
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Due Date
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Total
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Due
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => {
              const isOverdue = bill.status === "OVERDUE";

              return (
                <TableRow
                  key={bill.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="px-4 py-3">
                    <button
                      onClick={() => onView(bill)}
                      className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {bill.billNumber}
                    </button>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-white/90">
                      {bill.vendor.displayName}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {bill.vendorInvoiceNumber || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(bill.billDate)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`text-sm ${
                        isOverdue
                          ? "font-medium text-error-500"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {formatDate(bill.dueDate)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge
                      size="sm"
                      color={statusBadgeColor[bill.status] || "light"}
                      variant="light"
                    >
                      {bill.statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(bill.totalAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        bill.amountDue > 0
                          ? "text-gray-900 dark:text-white/90"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {formatCurrency(bill.amountDue)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <button
                        onClick={() => onView(bill)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        title="View"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {/* Edit */}
                      {bill.statusInfo.allowEdit && (
                        <button
                          onClick={() => onEdit(bill)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2.00004C11.51 1.82274 11.7214 1.68342 11.9542 1.59009C12.187 1.49676 12.4365 1.4514 12.6873 1.45669C12.9381 1.46198 13.1854 1.51772 13.4141 1.62082C13.6427 1.72392 13.8481 1.87216 14.0179 2.05671C14.1876 2.24126 14.3184 2.45851 14.4025 2.69523C14.4866 2.93195 14.5224 3.18329 14.5074 3.43399C14.4925 3.68469 14.4272 3.93002 14.3153 4.15528C14.2034 4.38053 14.0473 4.58108 13.8567 4.74537L5.17133 13.4307L1.33333 14.6667L2.56933 10.8287L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      {/* Receive */}
                      {bill.statusInfo.allowReceive && (
                        <button
                          onClick={() => onReceive(bill)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                          title="Receive"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                      {/* Record Payment */}
                      {bill.statusInfo.allowPayment && (
                        <button
                          onClick={() => onRecordPayment(bill)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-success-50 hover:text-success-500 dark:hover:bg-success-900/20 dark:hover:text-success-400"
                          title="Record Payment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </button>
                      )}
                      {/* Void */}
                      {bill.statusInfo.allowVoid && (
                        <button
                          onClick={() => onVoid(bill)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-warning-50 hover:text-warning-500 dark:hover:bg-warning-900/20 dark:hover:text-warning-400"
                          title="Void"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                        </button>
                      )}
                      {/* Delete */}
                      {bill.statusInfo.allowDelete && (
                        <button
                          onClick={() => onDelete(bill)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {bills.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No bills found.
          </p>
        </div>
      )}
    </div>
  );
};

export default BillsTable;
