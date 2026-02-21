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
import invoicesService from "@/services/invoicesService";
import customersService from "@/services/customersService";
import accountsService from "@/services/accountsService";
import type { InvoiceListItem, InvoiceSummary } from "@/types/invoices";

import InvoiceSummaryCards from "./InvoiceSummaryCards";
import InvoicesTable from "./InvoicesTable";
import CreateInvoiceModal from "./CreateInvoiceModal";
import EditInvoiceModal from "./EditInvoiceModal";
import InvoiceDetailModal from "./InvoiceDetailModal";
import SendInvoiceModal from "./SendInvoiceModal";
import VoidInvoiceModal from "./VoidInvoiceModal";
import RecordPaymentModal from "./RecordPaymentModal";
import DeleteInvoiceModal from "./DeleteInvoiceModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const InvoicesPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Reference data for modals
  const [customersList, setCustomersList] = useState<
    { id: string; displayName: string; email: string | null }[]
  >([]);
  const [accountsList, setAccountsList] = useState<
    { id: string; name: string; accountNumber: string }[]
  >([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Modals
  const createModal = useModal();
  const editModal = useModal();
  const detailModal = useModal();
  const sendModal = useModal();
  const voidModal = useModal();
  const paymentModal = useModal();
  const deleteModal = useModal();

  // Selected invoice context for modals
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [selectedAmountDue, setSelectedAmountDue] = useState(0);

  const hasAccess = Boolean(token && isAuthenticated);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await invoicesService.getInvoices(
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
      setInvoices(data.items);
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
          title: "Unable to load invoices",
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
      const data = await invoicesService.getSummary(token);
      setSummary(data);
    } catch {
      // Non-critical
    }
  }, [token]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    if (!token) return;

    try {
      const customers = await customersService.getCustomers(
        { isActive: "true", sortBy: "displayName", sortOrder: "asc" },
        token
      );
      setCustomersList(
        customers.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          email: c.email,
        }))
      );
    } catch {
      // Non-critical
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
      // Non-critical
    }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchInvoices();
    fetchSummary();
    fetchReferenceData();
  }, [hasAccess, permissionsLoading, fetchInvoices, fetchSummary, fetchReferenceData]);

  // Search debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  // Refresh helper
  const refreshAll = () => {
    fetchInvoices();
    fetchSummary();
  };

  // Modal handlers
  const handleView = (inv: InvoiceListItem) => {
    setSelectedInvoiceId(inv.id);
    detailModal.openModal();
  };

  const handleEdit = (inv: InvoiceListItem) => {
    setSelectedInvoiceId(inv.id);
    editModal.openModal();
  };

  const handleEditById = (id: string) => {
    setSelectedInvoiceId(id);
    editModal.openModal();
  };

  const handleSend = (inv: InvoiceListItem) => {
    setSelectedInvoiceId(inv.id);
    setSelectedInvoiceNumber(inv.invoiceNumber);
    sendModal.openModal();
  };

  const handleSendById = (id: string, invoiceNumber: string) => {
    setSelectedInvoiceId(id);
    setSelectedInvoiceNumber(invoiceNumber);
    sendModal.openModal();
  };

  const handleRecordPayment = (inv: InvoiceListItem) => {
    setSelectedInvoiceId(inv.id);
    setSelectedInvoiceNumber(inv.invoiceNumber);
    setSelectedAmountDue(inv.amountDue);
    paymentModal.openModal();
  };

  const handleRecordPaymentById = (id: string, invoiceNumber: string, amountDue: number) => {
    setSelectedInvoiceId(id);
    setSelectedInvoiceNumber(invoiceNumber);
    setSelectedAmountDue(amountDue);
    paymentModal.openModal();
  };

  const handleVoid = (inv: InvoiceListItem) => {
    setSelectedInvoiceId(inv.id);
    setSelectedInvoiceNumber(inv.invoiceNumber);
    voidModal.openModal();
  };

  const handleVoidById = (id: string, invoiceNumber: string) => {
    setSelectedInvoiceId(id);
    setSelectedInvoiceNumber(invoiceNumber);
    voidModal.openModal();
  };

  const handleDelete = (inv: InvoiceListItem) => {
    setSelectedInvoiceId(inv.id);
    setSelectedInvoiceNumber(inv.invoiceNumber);
    deleteModal.openModal();
  };

  const handleDeleteById = (id: string, invoiceNumber: string) => {
    setSelectedInvoiceId(id);
    setSelectedInvoiceNumber(invoiceNumber);
    deleteModal.openModal();
  };

  // Success callbacks
  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Invoice Created",
      message: "The invoice has been created successfully.",
    });
    refreshAll();
  };

  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Invoice Updated",
      message: "The invoice has been updated successfully.",
    });
    refreshAll();
  };

  const handleSent = () => {
    setAlert({
      variant: "success",
      title: "Invoice Sent",
      message: "The invoice has been sent. Inventory has been deducted.",
    });
    refreshAll();
  };

  const handleVoided = () => {
    setAlert({
      variant: "success",
      title: "Invoice Voided",
      message: "The invoice has been voided. Inventory has been restored.",
    });
    refreshAll();
  };

  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Invoice Deleted",
      message: "The draft invoice has been permanently deleted.",
    });
    refreshAll();
  };

  const handlePaymentRecorded = () => {
    setAlert({
      variant: "success",
      title: "Payment Recorded",
      message: "The payment has been recorded successfully.",
    });
    refreshAll();
  };

  // Pagination
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
          Sign in to view invoices.
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
            Sales
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage customer invoices
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
          New Invoice
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

      {/* Summary Cards */}
      <InvoiceSummaryCards summary={summary} />

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
            placeholder="Search invoices..."
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
          <option value="SENT">Sent</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading invoices...
            </span>
          </div>
        </div>
      ) : (
        <>
          <InvoicesTable
            invoices={invoices}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSend={handleSend}
            onVoid={handleVoid}
            onRecordPayment={handleRecordPayment}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
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
      <CreateInvoiceModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
        customers={customersList}
        accounts={accountsList}
      />

      <EditInvoiceModal
        isOpen={editModal.isOpen}
        invoiceId={selectedInvoiceId}
        onClose={() => {
          editModal.closeModal();
          setSelectedInvoiceId(null);
        }}
        onUpdated={handleUpdated}
        customers={customersList}
        accounts={accountsList}
      />

      <InvoiceDetailModal
        isOpen={detailModal.isOpen}
        invoiceId={selectedInvoiceId}
        onClose={() => {
          detailModal.closeModal();
          setSelectedInvoiceId(null);
        }}
        onEdit={handleEditById}
        onSend={handleSendById}
        onRecordPayment={handleRecordPaymentById}
        onVoid={handleVoidById}
        onDelete={handleDeleteById}
      />

      <SendInvoiceModal
        isOpen={sendModal.isOpen}
        invoiceId={selectedInvoiceId}
        invoiceNumber={selectedInvoiceNumber}
        onClose={() => {
          sendModal.closeModal();
          setSelectedInvoiceId(null);
        }}
        onSent={handleSent}
      />

      <VoidInvoiceModal
        isOpen={voidModal.isOpen}
        invoiceId={selectedInvoiceId}
        invoiceNumber={selectedInvoiceNumber}
        onClose={() => {
          voidModal.closeModal();
          setSelectedInvoiceId(null);
        }}
        onVoided={handleVoided}
      />

      <RecordPaymentModal
        isOpen={paymentModal.isOpen}
        invoiceId={selectedInvoiceId}
        invoiceNumber={selectedInvoiceNumber}
        amountDue={selectedAmountDue}
        onClose={() => {
          paymentModal.closeModal();
          setSelectedInvoiceId(null);
        }}
        onPaymentRecorded={handlePaymentRecorded}
        accounts={accountsList}
      />

      <DeleteInvoiceModal
        isOpen={deleteModal.isOpen}
        invoiceId={selectedInvoiceId}
        invoiceNumber={selectedInvoiceNumber}
        onClose={() => {
          deleteModal.closeModal();
          setSelectedInvoiceId(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default InvoicesPage;
