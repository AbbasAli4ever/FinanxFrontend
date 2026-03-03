"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";

import TrialBalanceReport from "./TrialBalanceReport";
import AccountLedgerReport from "./AccountLedgerReport";
import IncomeStatementReport from "./IncomeStatementReport";
import BalanceSheetReport from "./BalanceSheetReport";
import CashFlowReport from "./CashFlowReport";
import ArAgingReport from "./ArAgingReport";
import ApAgingReport from "./ApAgingReport";
import SalesByCustomerReport from "./SalesByCustomerReport";
import PurchasesByVendorReport from "./PurchasesByVendorReport";
import ExpenseByCategoryReport from "./ExpenseByCategoryReport";

// ── Tab definitions ───────────────────────────────────────────
type ReportTab =
  | "overview"
  | "income-statement"
  | "balance-sheet"
  | "cash-flow"
  | "trial-balance"
  | "account-ledger"
  | "ar-aging"
  | "ap-aging"
  | "sales-by-customer"
  | "purchases-by-vendor"
  | "expense-by-category";

interface TabDef {
  key: ReportTab;
  label: string;
  description: string;
  group: "overview" | "financial" | "aging" | "analytics";
  icon: React.ReactNode;
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TABS: TabDef[] = [
  {
    key: "overview",
    label: "Dashboard",
    description: "Quick financial overview",
    group: "overview",
    icon: <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  },
  {
    key: "income-statement",
    label: "Income Statement",
    description: "Profit & Loss",
    group: "financial",
    icon: <Icon d="M12 20V10M18 20V4M6 20v-4" />,
  },
  {
    key: "balance-sheet",
    label: "Balance Sheet",
    description: "Assets, liabilities & equity",
    group: "financial",
    icon: <Icon d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />,
  },
  {
    key: "cash-flow",
    label: "Cash Flow",
    description: "Operating, investing, financing",
    group: "financial",
    icon: <Icon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  },
  {
    key: "trial-balance",
    label: "Trial Balance",
    description: "Debit & credit summary",
    group: "financial",
    icon: <Icon d="M3 3h18v18H3zM3 9h18M9 21V9" />,
  },
  {
    key: "account-ledger",
    label: "Account Ledger",
    description: "Transactions by account",
    group: "financial",
    icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  },
  {
    key: "ar-aging",
    label: "AR Aging",
    description: "Receivables by age",
    group: "aging",
    icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  },
  {
    key: "ap-aging",
    label: "AP Aging",
    description: "Payables by age",
    group: "aging",
    icon: <Icon d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />,
  },
  {
    key: "sales-by-customer",
    label: "Sales by Customer",
    description: "Revenue breakdown",
    group: "analytics",
    icon: <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  },
  {
    key: "purchases-by-vendor",
    label: "Purchases by Vendor",
    description: "Spend breakdown",
    group: "analytics",
    icon: <Icon d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />,
  },
  {
    key: "expense-by-category",
    label: "Expense Categories",
    description: "Cost breakdown by type",
    group: "analytics",
    icon: <Icon d="M12 2a10 10 0 1 0 10 10H12V2z" />,
  },
];

const GROUP_LABELS: Record<string, string> = {
  overview: "Overview",
  financial: "Financial Statements",
  aging: "Aging Reports",
  analytics: "Analytics",
};

// ── Overview Dashboard ────────────────────────────────────────
const OverviewDashboard: React.FC<{ onNavigate: (tab: ReportTab) => void }> = ({ onNavigate }) => {
  const cards: {
    tab: ReportTab;
    title: string;
    description: string;
    color: string;
    bg: string;
    dotColor: string;
    bullets: string[];
  }[] = [
    {
      tab: "income-statement",
      title: "Income Statement",
      description: "Profit & Loss report showing revenue, expenses, and net income.",
      color: "text-success-700 dark:text-success-300",
      bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800",
      dotColor: "bg-success-500",
      bullets: ["Revenue breakdown", "COGS tracking", "Net income"],
    },
    {
      tab: "balance-sheet",
      title: "Balance Sheet",
      description: "Snapshot of assets, liabilities, and owner equity at a point in time.",
      color: "text-brand-700 dark:text-brand-300",
      bg: "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800",
      dotColor: "bg-brand-500",
      bullets: ["Total assets", "Liabilities", "Equity balance"],
    },
    {
      tab: "cash-flow",
      title: "Cash Flow",
      description: "Operating, investing, and financing activities.",
      color: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      dotColor: "bg-blue-500",
      bullets: ["Operating activities", "Investing activities", "Ending cash balance"],
    },
    {
      tab: "ar-aging",
      title: "AR Aging",
      description: "Accounts receivable aged by days outstanding.",
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      dotColor: "bg-emerald-500",
      bullets: ["Current vs overdue", "Per-customer detail", "Invoice drill-down"],
    },
    {
      tab: "ap-aging",
      title: "AP Aging",
      description: "Accounts payable aged by days outstanding.",
      color: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      dotColor: "bg-orange-500",
      bullets: ["Current vs overdue", "Per-vendor detail", "Bill drill-down"],
    },
    {
      tab: "sales-by-customer",
      title: "Sales by Customer",
      description: "Revenue ranked by customer with collection metrics.",
      color: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
      dotColor: "bg-violet-500",
      bullets: ["Top customers chart", "Collection rate", "Outstanding breakdown"],
    },
    {
      tab: "purchases-by-vendor",
      title: "Purchases by Vendor",
      description: "Spend ranked by vendor with payment status.",
      color: "text-cyan-700 dark:text-cyan-300",
      bg: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
      dotColor: "bg-cyan-500",
      bullets: ["Top vendors chart", "Payment rate", "Outstanding bills"],
    },
    {
      tab: "expense-by-category",
      title: "Expense Categories",
      description: "Expense breakdown by account type with donut chart.",
      color: "text-rose-700 dark:text-rose-300",
      bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
      dotColor: "bg-rose-500",
      bullets: ["Interactive donut chart", "% breakdown", "Account detail"],
    },
    {
      tab: "trial-balance",
      title: "Trial Balance",
      description: "All accounts with debit and credit balances.",
      color: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
      dotColor: "bg-amber-500",
      bullets: ["All accounts", "Balance verification", "Grouped view"],
    },
    {
      tab: "account-ledger",
      title: "Account Ledger",
      description: "Full transaction history for any account.",
      color: "text-gray-700 dark:text-gray-300",
      bg: "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700",
      dotColor: "bg-gray-500",
      bullets: ["Per-account history", "Running balance", "Date range filter"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-blue-50 p-6 dark:border-brand-800 dark:from-brand-900/20 dark:to-blue-900/20">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Reports</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          10 comprehensive reports covering financial statements, aging analysis, and business analytics. Select a report to get started.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Financial Statements", count: 4, color: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300" },
            { label: "Aging Reports", count: 2, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
            { label: "Analytics", count: 3, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
          ].map((g) => (
            <span key={g.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${g.color}`}>
              {g.label} ({g.count})
            </span>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.tab}
            onClick={() => onNavigate(card.tab)}
            className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.bg}`}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${card.dotColor}`} />
                <h3 className={`text-sm font-bold ${card.color}`}>{card.title}</h3>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{card.description}</p>
            <ul className="mt-auto space-y-1">
              {card.bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-500">
                  <svg className="h-3 w-3 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main ReportsPage ──────────────────────────────────────────
const ReportsPage: React.FC = () => {
  const { isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  const groups = ["overview", "financial", "aging", "analytics"] as const;

  if (!isReady || permissionsLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
        <p className="font-semibold text-gray-900 dark:text-white/90">Waiting for authentication...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to view financial reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Finance</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Financial Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and view financial statements &amp; analytics</p>
      </header>

      {/* Sidebar + Content layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar Navigation */}
        <nav className="w-full shrink-0 lg:w-56">
          <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            {groups.map((group) => {
              const groupTabs = TABS.filter((t) => t.group === group);
              return (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="mb-1 px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {GROUP_LABELS[group]}
                  </p>
                  {groupTabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                        }`}
                      >
                        <span className={`shrink-0 ${isActive ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}`}>
                          {tab.icon}
                        </span>
                        <span className="truncate font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Report Content */}
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          {activeTab !== "overview" && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setActiveTab("overview")}
                className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              >
                Reports
              </button>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-900 dark:text-white">
                {TABS.find((t) => t.key === activeTab)?.label}
              </span>
            </div>
          )}

          {activeTab === "overview" && <OverviewDashboard onNavigate={setActiveTab} />}
          {activeTab === "income-statement" && <IncomeStatementReport />}
          {activeTab === "balance-sheet" && <BalanceSheetReport />}
          {activeTab === "cash-flow" && <CashFlowReport />}
          {activeTab === "trial-balance" && <TrialBalanceReport />}
          {activeTab === "account-ledger" && <AccountLedgerReport />}
          {activeTab === "ar-aging" && <ArAgingReport />}
          {activeTab === "ap-aging" && <ApAgingReport />}
          {activeTab === "sales-by-customer" && <SalesByCustomerReport />}
          {activeTab === "purchases-by-vendor" && <PurchasesByVendorReport />}
          {activeTab === "expense-by-category" && <ExpenseByCategoryReport />}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
