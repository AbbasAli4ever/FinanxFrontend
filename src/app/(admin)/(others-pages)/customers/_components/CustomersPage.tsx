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
import customersService from "@/services/customersService";
import type { Customer } from "@/types/customers";

import CustomersTable from "./CustomersTable";
import CreateCustomerModal from "./CreateCustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import DeleteCustomerModal from "./DeleteCustomerModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const CustomersPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    customerType: "",
    isActive: "true",
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);

  const fetchCustomers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await customersService.getCustomers(
        {
          search: filters.search || undefined,
          customerType: filters.customerType || undefined,
          isActive: filters.isActive || undefined,
          sortBy: "displayName",
          sortOrder: "asc",
        },
        token
      );
      setCustomers(data);
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
          title: "Unable to load customers",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters.search, filters.customerType, filters.isActive]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchCustomers();
  }, [hasAccess, permissionsLoading, fetchCustomers]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    editModal.openModal();
  };

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer({ id: customer.id, name: customer.displayName });
    deleteModal.openModal();
  };

  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Customer Created",
      message: "The customer has been created successfully.",
    });
    fetchCustomers();
  };

  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Customer Updated",
      message: "The customer has been updated successfully.",
    });
    fetchCustomers();
  };

  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Customer Deactivated",
      message: "The customer has been deactivated successfully.",
    });
    fetchCustomers();
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
          Sign in to view customers.
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
            Customers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your customers and their details
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
          New Customer
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
            placeholder="Search customers..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <select
          value={filters.customerType}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, customerType: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.customerType
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <option value="">All Types</option>
          <option value="Business">Business</option>
          <option value="Individual">Individual</option>
        </select>

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
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading customers...
            </span>
          </div>
        </div>
      ) : (
        <CustomersTable
          customers={customers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <CreateCustomerModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
      />

      <EditCustomerModal
        isOpen={editModal.isOpen}
        customer={editingCustomer}
        onClose={() => {
          editModal.closeModal();
          setEditingCustomer(null);
        }}
        onUpdated={handleUpdated}
      />

      <DeleteCustomerModal
        isOpen={deleteModal.isOpen}
        customerId={deletingCustomer?.id || null}
        customerName={deletingCustomer?.name || ""}
        onClose={() => {
          deleteModal.closeModal();
          setDeletingCustomer(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default CustomersPage;
