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
import type { Account } from "@/types/accounts";

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const TYPE_GROUP_ORDER = ["Assets", "Liabilities", "Equity", "Income", "Expenses"];

const TYPE_TO_GROUP: Record<string, string> = {
  Bank: "Assets",
  "Accounts Receivable": "Assets",
  "Other Current Assets": "Assets",
  "Fixed Assets": "Assets",
  "Other Assets": "Assets",
  "Accounts Payable": "Liabilities",
  "Credit Card": "Liabilities",
  "Other Current Liabilities": "Liabilities",
  "Long Term Liabilities": "Liabilities",
  Equity: "Equity",
  Income: "Income",
  "Other Income": "Income",
  "Cost of Goods Sold": "Expenses",
  Expenses: "Expenses",
  "Other Expense": "Expenses",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function groupAccountsByTypeGroup(accounts: Account[]) {
  const grouped: Record<string, Account[]> = {};

  for (const group of TYPE_GROUP_ORDER) {
    grouped[group] = [];
  }

  for (const account of accounts) {
    const group = TYPE_TO_GROUP[account.accountType] || "Other";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(account);
  }

  return grouped;
}

const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  onEdit,
  onDelete,
}) => {
  const grouped = groupAccountsByTypeGroup(accounts);

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
                Number
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Type
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Detail Type
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Balance
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
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TYPE_GROUP_ORDER.map((group) => {
              const groupAccounts = grouped[group];
              if (!groupAccounts || groupAccounts.length === 0) return null;

              return (
                <React.Fragment key={group}>
                  {/* Group Header Row */}
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td
                      colSpan={7}
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300"
                    >
                      {group}
                    </td>
                  </tr>

                  {/* Account Rows */}
                  {groupAccounts.map((account) => (
                    <TableRow
                      key={account.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                        {account.accountNumber || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${account.depth * 20}px` }}
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                            {account.name}
                          </span>
                          {account.isSystemAccount && (
                            <Badge size="sm" color="primary" variant="light">
                              System
                            </Badge>
                          )}
                          {account.subAccountsCount > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({account.subAccountsCount} sub)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {account.accountType}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {account.detailType}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">
                        {formatCurrency(account.currentBalance)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge
                          size="sm"
                          color={account.isActive ? "success" : "error"}
                          variant="light"
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(account)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            title="Edit account"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M11.333 2.00004C11.51 1.82274 11.7214 1.68342 11.9542 1.59009C12.187 1.49676 12.4365 1.4514 12.6873 1.45669C12.9381 1.46198 13.1854 1.51772 13.4141 1.62082C13.6427 1.72392 13.8481 1.87216 14.0179 2.05671C14.1876 2.24126 14.3184 2.45851 14.4025 2.69523C14.4866 2.93195 14.5224 3.18329 14.5074 3.43399C14.4925 3.68469 14.4272 3.93002 14.3153 4.15528C14.2034 4.38053 14.0473 4.58108 13.8567 4.74537L5.17133 13.4307L1.33333 14.6667L2.56933 10.8287L11.333 2.00004Z"
                                stroke="currentColor"
                                strokeWidth="1.33"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete(account)}
                            disabled={account.isSystemAccount}
                            className={`rounded-lg p-1.5 transition ${
                              account.isSystemAccount
                                ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                                : "text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            }`}
                            title={
                              account.isSystemAccount
                                ? "System accounts cannot be deleted"
                                : "Delete account"
                            }
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z"
                                stroke="currentColor"
                                strokeWidth="1.33"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {accounts.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No accounts found.
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountsTable;
