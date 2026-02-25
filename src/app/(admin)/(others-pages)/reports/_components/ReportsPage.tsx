"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";

import TrialBalanceReport from "./TrialBalanceReport";
import AccountLedgerReport from "./AccountLedgerReport";
import IncomeStatementReport from "./IncomeStatementReport";
import BalanceSheetReport from "./BalanceSheetReport";

type ReportTab = "trial-balance" | "account-ledger" | "income-statement" | "balance-sheet";

const TABS: { key: ReportTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: "trial-balance",
    label: "Trial Balance",
    description: "Account debit/credit summary",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    key: "account-ledger",
    label: "Account Ledger",
    description: "Transaction detail by account",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: "income-statement",
    label: "Income Statement",
    description: "Profit & Loss overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
  {
    key: "balance-sheet",
    label: "Balance Sheet",
    description: "Assets, liabilities & equity",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
];

const ReportsPage: React.FC = () => {
  const { isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<ReportTab>("trial-balance");

  const hasAccess = isAuthenticated;

  if (!isReady || permissionsLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
        <p className="font-semibold text-gray-900 dark:text-white/90">
          Waiting for authentication...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sign in to view financial reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
          Finance
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Financial Reports
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate and view financial statements
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:ring-brand-800"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {tab.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? "text-brand-700 dark:text-brand-300" : ""}`}>
                    {tab.label}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate hidden sm:block">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      <div>
        {activeTab === "trial-balance" && <TrialBalanceReport />}
        {activeTab === "account-ledger" && <AccountLedgerReport />}
        {activeTab === "income-statement" && <IncomeStatementReport />}
        {activeTab === "balance-sheet" && <BalanceSheetReport />}
      </div>
    </div>
  );
};

export default ReportsPage;
