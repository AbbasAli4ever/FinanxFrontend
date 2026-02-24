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
import expensesService from "@/services/expensesService";
import vendorsService from "@/services/vendorsService";
import customersService from "@/services/customersService";
import accountsService from "@/services/accountsService";
import categoriesService from "@/services/categoriesService";
import type { ExpenseListItem, ExpenseSummary, ExpenseStatusInfo } from "@/types/expenses";

import ExpenseSummaryCards from "./ExpenseSummaryCards";
import ExpensesTable from "./ExpensesTable";
import CreateExpenseModal from "./CreateExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import ExpenseDetailModal from "./ExpenseDetailModal";
import SubmitExpenseModal from "./SubmitExpenseModal";
import ApproveExpenseModal from "./ApproveExpenseModal";
import RejectExpenseModal from "./RejectExpenseModal";
import MarkPaidModal from "./MarkPaidModal";
import VoidExpenseModal from "./VoidExpenseModal";
import DeleteExpenseModal from "./DeleteExpenseModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const ExpensesPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, ExpenseStatusInfo>>({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Reference data
  const [vendorsList, setVendorsList] = useState<
    { id: string; displayName: string }[]
  >([]);
  const [customersList, setCustomersList] = useState<
    { id: string; displayName: string }[]
  >([]);
  const [accountsList, setAccountsList] = useState<
    { id: string; name: string; accountNumber: string }[]
  >([]);
  const [categoriesList, setCategoriesList] = useState<
    { id: string; name: string }[]
  >([]);

  // Filters
  const [filters, setFilters] = useState({ search: "", status: "" });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Modals
  const createModal = useModal();
  const editModal = useModal();
  const detailModal = useModal();
  const submitModal = useModal();
  const approveModal = useModal();
  const rejectModal = useModal();
  const markPaidModal = useModal();
  const voidModal = useModal();
  const deleteModal = useModal();

  // Selected expense context
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedExpenseNumber, setSelectedExpenseNumber] = useState("");
  const [selectedIsReimbursable, setSelectedIsReimbursable] = useState(false);

  const hasAccess = Boolean(token && isAuthenticated);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await expensesService.getExpenses(
        {
          search: filters.search || undefined,
          status: filters.status || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        },
        token
      );
      setExpenses(data.items);
      setPagination(data.pagination);
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
          title: "Unable to load expenses",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters.search, filters.status, pagination.page, pagination.limit]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const data = await expensesService.getSummary(token);
      setSummary(data);
    } catch {
      // Non-critical
    }
  }, [token]);

  // Fetch statuses
  const fetchStatuses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await expensesService.getStatuses(token);
      setStatusMap(data);
    } catch {
      // Non-critical
    }
  }, [token]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    if (!token) return;

    try {
      const vendors = await vendorsService.getVendors(
        { isActive: "true", sortBy: "displayName", sortOrder: "asc" },
        token
      );
      setVendorsList(
        vendors.map((v) => ({ id: v.id, displayName: v.displayName }))
      );
    } catch {
      /* Non-critical */
    }

    try {
      const customers = await customersService.getCustomers(
        { isActive: "true", sortBy: "displayName", sortOrder: "asc" },
        token
      );
      setCustomersList(
        customers.map((c) => ({ id: c.id, displayName: c.displayName }))
      );
    } catch {
      /* Non-critical */
    }

    try {
      const accounts = await accountsService.getAccounts(
        { isActive: "true", sortBy: "accountNumber", sortOrder: "asc" },
        token
      );
      setAccountsList(
        accounts.map((a) => ({
          id: a.id,
          name: a.name,
          accountNumber: a.accountNumber,
        }))
      );
    } catch {
      /* Non-critical */
    }

    try {
      const cats = await categoriesService.getCategories(token);
      setCategoriesList(cats.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      /* Non-critical */
    }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchExpenses();
    fetchSummary();
    fetchStatuses();
    fetchReferenceData();
  }, [
    hasAccess,
    permissionsLoading,
    fetchExpenses,
    fetchSummary,
    fetchStatuses,
    fetchReferenceData,
  ]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const refreshAll = () => {
    fetchExpenses();
    fetchSummary();
  };

  // Modal handlers — from table rows
  const handleView = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    detailModal.openModal();
  };
  const handleEdit = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    editModal.openModal();
  };
  const handleSubmit = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseNumber(expense.expenseNumber);
    submitModal.openModal();
  };
  const handleApprove = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseNumber(expense.expenseNumber);
    approveModal.openModal();
  };
  const handleReject = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseNumber(expense.expenseNumber);
    rejectModal.openModal();
  };
  const handleMarkPaid = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseNumber(expense.expenseNumber);
    setSelectedIsReimbursable(expense.isReimbursable);
    markPaidModal.openModal();
  };
  const handleVoid = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseNumber(expense.expenseNumber);
    voidModal.openModal();
  };
  const handleDelete = (expense: ExpenseListItem) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseNumber(expense.expenseNumber);
    deleteModal.openModal();
  };

  // Modal handlers — from detail modal
  const handleEditById = (id: string) => {
    setSelectedExpenseId(id);
    editModal.openModal();
  };
  const handleSubmitById = (id: string, num: string) => {
    setSelectedExpenseId(id);
    setSelectedExpenseNumber(num);
    submitModal.openModal();
  };
  const handleApproveById = (id: string, num: string) => {
    setSelectedExpenseId(id);
    setSelectedExpenseNumber(num);
    approveModal.openModal();
  };
  const handleRejectById = (id: string, num: string) => {
    setSelectedExpenseId(id);
    setSelectedExpenseNumber(num);
    rejectModal.openModal();
  };
  const handleMarkPaidById = (id: string, num: string, isReimb: boolean) => {
    setSelectedExpenseId(id);
    setSelectedExpenseNumber(num);
    setSelectedIsReimbursable(isReimb);
    markPaidModal.openModal();
  };
  const handleVoidById = (id: string, num: string) => {
    setSelectedExpenseId(id);
    setSelectedExpenseNumber(num);
    voidModal.openModal();
  };
  const handleDeleteById = (id: string, num: string) => {
    setSelectedExpenseId(id);
    setSelectedExpenseNumber(num);
    deleteModal.openModal();
  };

  // Success callbacks
  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Expense Created",
      message: "The expense has been created successfully.",
    });
    refreshAll();
  };
  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Expense Updated",
      message: "The expense has been updated successfully.",
    });
    refreshAll();
  };
  const handleSubmitted = () => {
    setAlert({
      variant: "success",
      title: "Expense Submitted",
      message: "The expense has been submitted for approval.",
    });
    refreshAll();
  };
  const handleApproved = () => {
    setAlert({
      variant: "success",
      title: "Expense Approved",
      message: "The expense has been approved.",
    });
    refreshAll();
  };
  const handleRejected = () => {
    setAlert({
      variant: "success",
      title: "Expense Rejected",
      message: "The expense has been rejected.",
    });
    refreshAll();
  };
  const handleMarkedPaid = () => {
    setAlert({
      variant: "success",
      title: "Expense Paid",
      message: "The expense has been marked as paid.",
    });
    refreshAll();
  };
  const handleVoided = () => {
    setAlert({
      variant: "success",
      title: "Expense Voided",
      message: "The expense has been voided.",
    });
    refreshAll();
  };
  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Expense Deleted",
      message: "The expense has been permanently deleted.",
    });
    refreshAll();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

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
          Sign in to view expenses.
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
            Finance
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage company expenses
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
          New Expense
        </Button>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      <ExpenseSummaryCards summary={summary} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            placeholder="Search expenses..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.status
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PAID">Paid</option>
          <option value="REIMBURSED">Reimbursed</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading expenses...
            </span>
          </div>
        </div>
      ) : (
        <>
          <ExpensesTable
            expenses={expenses}
            statusMap={statusMap}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkPaid={handleMarkPaid}
            onVoid={handleVoid}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateExpenseModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
        vendors={vendorsList}
        customers={customersList}
        accounts={accountsList}
        categories={categoriesList}
      />

      <EditExpenseModal
        isOpen={editModal.isOpen}
        expenseId={selectedExpenseId}
        onClose={() => {
          editModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onUpdated={handleUpdated}
        vendors={vendorsList}
        customers={customersList}
        accounts={accountsList}
        categories={categoriesList}
      />

      <ExpenseDetailModal
        isOpen={detailModal.isOpen}
        expenseId={selectedExpenseId}
        statusMap={statusMap}
        onClose={() => {
          detailModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onEdit={handleEditById}
        onSubmit={handleSubmitById}
        onApprove={handleApproveById}
        onReject={handleRejectById}
        onMarkPaid={handleMarkPaidById}
        onVoid={handleVoidById}
        onDelete={handleDeleteById}
      />

      <SubmitExpenseModal
        isOpen={submitModal.isOpen}
        expenseId={selectedExpenseId}
        expenseNumber={selectedExpenseNumber}
        onClose={() => {
          submitModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onSubmitted={handleSubmitted}
      />

      <ApproveExpenseModal
        isOpen={approveModal.isOpen}
        expenseId={selectedExpenseId}
        expenseNumber={selectedExpenseNumber}
        onClose={() => {
          approveModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onApproved={handleApproved}
      />

      <RejectExpenseModal
        isOpen={rejectModal.isOpen}
        expenseId={selectedExpenseId}
        expenseNumber={selectedExpenseNumber}
        onClose={() => {
          rejectModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onRejected={handleRejected}
      />

      <MarkPaidModal
        isOpen={markPaidModal.isOpen}
        expenseId={selectedExpenseId}
        expenseNumber={selectedExpenseNumber}
        isReimbursable={selectedIsReimbursable}
        onClose={() => {
          markPaidModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onMarkedPaid={handleMarkedPaid}
        accounts={accountsList}
      />

      <VoidExpenseModal
        isOpen={voidModal.isOpen}
        expenseId={selectedExpenseId}
        expenseNumber={selectedExpenseNumber}
        onClose={() => {
          voidModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onVoided={handleVoided}
      />

      <DeleteExpenseModal
        isOpen={deleteModal.isOpen}
        expenseId={selectedExpenseId}
        expenseNumber={selectedExpenseNumber}
        onClose={() => {
          deleteModal.closeModal();
          setSelectedExpenseId(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default ExpensesPage;
