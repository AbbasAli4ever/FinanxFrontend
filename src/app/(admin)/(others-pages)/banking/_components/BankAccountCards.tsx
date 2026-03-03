"use client";

import React from "react";
import type { BankAccount } from "@/types/banking";

interface Props {
  accounts: BankAccount[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (account: BankAccount) => void;
  unmatchedMap: Record<string, number>;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function AccountTypeIcon({ type }: { type: string }) {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("check")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    );
  }
  if (t.includes("sav")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-1 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-3 h-8 w-36 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

const BankAccountCards: React.FC<Props> = ({
  accounts,
  loading,
  selectedId,
  onSelect,
  unmatchedMap,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 dark:border-gray-700">
        <svg className="h-12 w-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No bank accounts found</p>
        <p className="mt-1 text-xs text-gray-400">Add a bank-type account in Chart of Accounts first</p>
      </div>
    );
  }

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Total across all accounts */}
      <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 dark:border-brand-800 dark:bg-brand-900/10">
        <div>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Total Bank Balance</p>
          <p className="text-3xl font-bold tabular-nums text-brand-900 dark:text-brand-100">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="text-right text-sm text-brand-600 dark:text-brand-400">
          <p>{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
          <p className="text-xs text-brand-500">
            {Object.values(unmatchedMap).reduce((a, b) => a + b, 0)} unmatched txns
          </p>
        </div>
      </div>

      {/* Account cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => {
          const isSelected = selectedId === account.id;
          const unmatched = unmatchedMap[account.id] ?? 0;
          const isNegative = account.currentBalance < 0;

          return (
            <button
              key={account.id}
              onClick={() => onSelect(account)}
              className={`group relative flex flex-col rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
                isSelected
                  ? "border-brand-400 bg-brand-50 shadow-sm ring-2 ring-brand-200 dark:border-brand-500 dark:bg-brand-900/20 dark:ring-brand-800"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              }`}
            >
              {/* Header row */}
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isSelected
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  <AccountTypeIcon type={account.detailType} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {account.detailType}
                  </span>
                  {unmatched > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {unmatched} unmatched
                    </span>
                  )}
                </div>
              </div>

              {/* Account info */}
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  #{account.accountNumber}
                  {account.accountNumberLast4 && (
                    <span className="ml-1">····{account.accountNumberLast4}</span>
                  )}
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  {account.name}
                </p>
                {account.institutionName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{account.institutionName}</p>
                )}
              </div>

              {/* Balance */}
              <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-400">Current Balance</p>
                  <p className={`text-xl font-bold tabular-nums ${
                    isNegative ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                  }`}>
                    {formatCurrency(account.currentBalance)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"
                }`}>
                  {isSelected ? (
                    <>
                      <span>Viewing</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>View</span>
                      <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BankAccountCards;
