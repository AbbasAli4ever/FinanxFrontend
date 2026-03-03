"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import type { BankAccount, BankTransaction } from "@/types/banking";

import BankAccountCards from "./BankAccountCards";
import BankTransactionsPanel from "./BankTransactionsPanel";
import MatchTransactionModal from "./MatchTransactionModal";
import ManualTransactionModal from "./ManualTransactionModal";
import CsvImportWizard from "./CsvImportWizard";
import TransferModal from "./TransferModal";
import ReconciliationPanel from "./ReconciliationPanel";

type ActiveView = "transactions" | "reconcile";

const BankingPage: React.FC = () => {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [unmatchedMap, setUnmatchedMap] = useState<Record<string, number>>({});
  const [activeView, setActiveView] = useState<ActiveView>("transactions");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals
  const [matchTxn, setMatchTxn] = useState<BankTransaction | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const fetchAccounts = useCallback(() => {
    if (!token) return;
    setAccountsLoading(true);
    bankingService
      .getAccounts(token)
      .then((data) => {
        setAccounts(data);
        // Auto-select first account
        if (!selectedAccount && data.length > 0) {
          setSelectedAccount(data[0]);
        } else if (selectedAccount) {
          // Refresh the selected account balance
          const refreshed = data.find((a) => a.id === selectedAccount.id);
          if (refreshed) setSelectedAccount(refreshed);
        }
      })
      .catch(() => {})
      .finally(() => setAccountsLoading(false));
  }, [token, selectedAccount]);

  useEffect(() => { fetchAccounts(); }, [token]);

  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setActiveView("transactions");
  };

  const handleUnmatchedChange = useCallback((accountId: string, count: number) => {
    setUnmatchedMap((prev) => ({ ...prev, [accountId]: count }));
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger((n) => n + 1);
    fetchAccounts();
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banking</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Manage bank accounts, import transactions, and reconcile statements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.length >= 2 && (
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Transfer Funds
            </button>
          )}
        </div>
      </div>

      {/* Account Cards */}
      <BankAccountCards
        accounts={accounts}
        loading={accountsLoading}
        selectedId={selectedAccount?.id ?? null}
        onSelect={handleSelectAccount}
        unmatchedMap={unmatchedMap}
      />

      {/* Account Detail Panel */}
      {selectedAccount && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Tab bar */}
          <div className="border-b border-gray-200 px-5 dark:border-gray-800">
            <nav className="-mb-px flex gap-1">
              {[
                {
                  label: "Transactions",
                  value: "transactions" as ActiveView,
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  ),
                },
                {
                  label: "Reconcile",
                  value: "reconcile" as ActiveView,
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveView(tab.value)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeView === tab.value
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.value === "transactions" && (unmatchedMap[selectedAccount.id] ?? 0) > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {unmatchedMap[selectedAccount.id]}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-5">
            {activeView === "transactions" && (
              <BankTransactionsPanel
                account={selectedAccount}
                onAddManual={() => setManualOpen(true)}
                onMatch={(txn) => setMatchTxn(txn)}
                onImport={() => setImportOpen(true)}
                onReconcile={() => setActiveView("reconcile")}
                refreshTrigger={refreshTrigger}
                onUnmatchedChange={handleUnmatchedChange}
              />
            )}
            {activeView === "reconcile" && (
              <ReconciliationPanel
                account={selectedAccount}
                onClose={() => { setActiveView("transactions"); triggerRefresh(); }}
              />
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <MatchTransactionModal
        isOpen={!!matchTxn}
        transaction={matchTxn}
        onClose={() => setMatchTxn(null)}
        onMatched={triggerRefresh}
      />

      <ManualTransactionModal
        isOpen={manualOpen}
        account={selectedAccount}
        onClose={() => setManualOpen(false)}
        onCreated={triggerRefresh}
      />

      <CsvImportWizard
        isOpen={importOpen}
        account={selectedAccount}
        onClose={() => setImportOpen(false)}
        onImported={triggerRefresh}
      />

      <TransferModal
        isOpen={transferOpen}
        accounts={accounts}
        defaultSourceId={selectedAccount?.id}
        onClose={() => setTransferOpen(false)}
        onTransferred={() => { setTransferOpen(false); triggerRefresh(); fetchAccounts(); }}
      />
    </div>
  );
};

export default BankingPage;
