"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import accountsService from "@/services/accountsService";
import type {
  Account,
  AccountTreeData,
  AccountTypesData,
  AccountTreeNode,
} from "@/types/accounts";

import AccountsTable from "./AccountsTable";
import AccountsTreeView from "./AccountsTreeView";
import CreateAccountModal from "./CreateAccountModal";
import EditAccountModal from "./EditAccountModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const ChartOfAccountsPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [treeData, setTreeData] = useState<AccountTreeData>({});
  const [accountTypes, setAccountTypes] = useState<AccountTypesData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // View mode
  const [treeView, setTreeView] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    accountType: "",
    search: "",
    isActive: "true",
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Modals
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<{
    id: string;
    name: string;
    isSystemAccount: boolean;
  } | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);

  // Load account types (for filter dropdown)
  useEffect(() => {
    if (!token || !hasAccess) return;

    const loadTypes = async () => {
      try {
        const data = await accountsService.getAccountTypes(token);
        setAccountTypes(data);
      } catch {
        // Non-critical — filters still work with manual typing
      }
    };
    loadTypes();
  }, [token, hasAccess]);

  // Fetch accounts (flat or tree)
  const fetchAccounts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      if (treeView) {
        const data = await accountsService.getAccountTree(
          { accountType: filters.accountType || undefined },
          token
        );
        setTreeData(data);
      } else {
        const data = await accountsService.getAccounts(
          {
            accountType: filters.accountType || undefined,
            search: filters.search || undefined,
            isActive: filters.isActive || undefined,
          },
          token
        );
        setAccounts(data);
      }
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: getPermissionDeniedMessage(error),
        });
      } else {
        setAlert({
          variant: "error",
          title: "Unable to load accounts",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, treeView, filters.accountType, filters.search, filters.isActive]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchAccounts();
  }, [hasAccess, permissionsLoading, fetchAccounts]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  // Handlers
  const handleEdit = (account: Account | AccountTreeNode) => {
    // AccountTreeNode may not have all Account fields, so we cast
    setEditingAccount(account as Account);
    editModal.openModal();
  };

  const handleDelete = (account: Account | AccountTreeNode) => {
    setDeletingAccount({
      id: account.id,
      name: account.name,
      isSystemAccount: account.isSystemAccount,
    });
    deleteModal.openModal();
  };

  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Account Created",
      message: "The account has been created successfully.",
    });
    fetchAccounts();
  };

  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Account Updated",
      message: "The account has been updated successfully.",
    });
    fetchAccounts();
  };

  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Account Deleted",
      message: "The account has been deleted successfully.",
    });
    fetchAccounts();
  };

  // Auth loading
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
          Sign in to view the Chart of Accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
            Accounting
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your accounts, categories, and balances
          </p>
        </div>
        <Button size="sm" onClick={createModal.openModal}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z"
              fill="currentColor"
            />
          </svg>
          New Account
        </Button>
      </header>

      {/* Alert */}
      {alert && (
        <div role="status" aria-live="assertive">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {/* Account Type Filter */}
        <select
          value={filters.accountType}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, accountType: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.accountType
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <option value="">All Types</option>
          {accountTypes?.groups.map((group) => (
            <optgroup
              key={group}
              label={group}
              className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
            >
              {accountTypes.grouped[group]?.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                  className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                >
                  {type.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.isActive}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, isActive: e.target.value }))
          }
          className={`${selectClasses} text-gray-800 dark:text-white/90`}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All Status</option>
        </select>

        {/* List / Tree Toggle */}
        <button
          onClick={() => setTreeView(!treeView)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          title={treeView ? "Switch to list view" : "Switch to tree view"}
        >
          {treeView ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M2 4H14M2 8H14M2 12H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              List
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M2 3H6M4 6H8M2 9H6M4 12H8M10 3V13M10 3L13 6M10 3L7 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Tree
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading accounts...
            </span>
          </div>
        </div>
      ) : treeView ? (
        <AccountsTreeView
          treeData={treeData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <AccountsTable
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <CreateAccountModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
      />

      <EditAccountModal
        isOpen={editModal.isOpen}
        account={editingAccount}
        onClose={() => {
          editModal.closeModal();
          setEditingAccount(null);
        }}
        onUpdated={handleUpdated}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        accountId={deletingAccount?.id || null}
        accountName={deletingAccount?.name || ""}
        isSystemAccount={deletingAccount?.isSystemAccount || false}
        onClose={() => {
          deleteModal.closeModal();
          setDeletingAccount(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default ChartOfAccountsPage;
