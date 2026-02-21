"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import vendorsService from "@/services/vendorsService";
import type { Vendor } from "@/types/vendors";

import VendorsTable from "./VendorsTable";
import CreateVendorModal from "./CreateVendorModal";
import EditVendorModal from "./EditVendorModal";
import DeleteVendorModal from "./DeleteVendorModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const VendorsPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    vendorType: "",
    isActive: "true",
    track1099: "",
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);

  const fetchVendors = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await vendorsService.getVendors(
        {
          search: filters.search || undefined,
          vendorType: filters.vendorType || undefined,
          isActive: filters.isActive || undefined,
          track1099: filters.track1099 || undefined,
          sortBy: "displayName",
          sortOrder: "asc",
        },
        token
      );
      setVendors(data);
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
          title: "Unable to load vendors",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [
    token,
    filters.search,
    filters.vendorType,
    filters.isActive,
    filters.track1099,
  ]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchVendors();
  }, [hasAccess, permissionsLoading, fetchVendors]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    editModal.openModal();
  };

  const handleDelete = (vendor: Vendor) => {
    setDeletingVendor({ id: vendor.id, name: vendor.displayName });
    deleteModal.openModal();
  };

  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Vendor Created",
      message: "The vendor has been created successfully.",
    });
    fetchVendors();
  };

  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Vendor Updated",
      message: "The vendor has been updated successfully.",
    });
    fetchVendors();
  };

  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Vendor Deactivated",
      message: "The vendor has been deactivated successfully.",
    });
    fetchVendors();
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
          Sign in to view vendors.
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
            Purchasing
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Vendors
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your vendors and suppliers
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
          New Vendor
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
            placeholder="Search vendors..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <select
          value={filters.vendorType}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, vendorType: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.vendorType
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

        {/* 1099 filter checkbox */}
        <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white px-3 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
          <Checkbox
            label="1099"
            checked={filters.track1099 === "true"}
            onChange={(checked) =>
              setFilters((prev) => ({
                ...prev,
                track1099: checked ? "true" : "",
              }))
            }
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading vendors...
            </span>
          </div>
        </div>
      ) : (
        <VendorsTable
          vendors={vendors}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <CreateVendorModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
      />

      <EditVendorModal
        isOpen={editModal.isOpen}
        vendor={editingVendor}
        onClose={() => {
          editModal.closeModal();
          setEditingVendor(null);
        }}
        onUpdated={handleUpdated}
      />

      <DeleteVendorModal
        isOpen={deleteModal.isOpen}
        vendorId={deletingVendor?.id || null}
        vendorName={deletingVendor?.name || ""}
        onClose={() => {
          deleteModal.closeModal();
          setDeletingVendor(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default VendorsPage;
