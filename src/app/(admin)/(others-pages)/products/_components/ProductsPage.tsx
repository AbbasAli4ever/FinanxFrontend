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
import productsService from "@/services/productsService";
import vendorsService from "@/services/vendorsService";
import type { ProductListItem, LowStockItem, PaginatedResponse } from "@/types/products";

import ProductsTable from "./ProductsTable";
import CreateProductModal from "./CreateProductModal";
import EditProductModal from "./EditProductModal";
import DeleteProductModal from "./DeleteProductModal";
import AdjustStockModal from "./AdjustStockModal";
import LowStockAlert from "./LowStockAlert";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const ProductsPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Reference data for modals
  const [vendorsList, setVendorsList] = useState<
    { id: string; displayName: string }[]
  >([]);
  const [accountsList, setAccountsList] = useState<
    { id: string; name: string; accountNumber: string }[]
  >([]);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    isActive: "true",
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const adjustStockModal = useModal();

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<{
    id: string;
    name: string;
    qty: number;
  } | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data: PaginatedResponse<ProductListItem> =
        await productsService.getProducts(
          {
            search: filters.search || undefined,
            type: filters.type || undefined,
            isActive: filters.isActive || undefined,
            sortBy: "name",
            sortOrder: "asc",
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
          },
          token
        );
      setProducts(data.items);
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
          title: "Unable to load products",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters.search, filters.type, filters.isActive, pagination.page, pagination.limit]);

  // Fetch low stock
  const fetchLowStock = useCallback(async () => {
    if (!token) return;
    try {
      const items = await productsService.getLowStock(token);
      setLowStockItems(items);
    } catch {
      // Non-critical, silently fail
    }
  }, [token]);

  // Fetch reference data for modals
  const fetchReferenceData = useCallback(async () => {
    if (!token) return;
    try {
      // Load vendors for preferred vendor dropdown
      const vendorsData = await vendorsService.getVendors(
        { isActive: "true", sortBy: "displayName", sortOrder: "asc" },
        token
      );
      setVendorsList(
        vendorsData.map((v) => ({ id: v.id, displayName: v.displayName }))
      );
    } catch {
      // Non-critical
    }

    try {
      // Load accounts for account dropdowns
      const { request } = await import("@/services/apiClient");
      const { API_BASE_URL } = await import("@/services/apiClient");
      const res = await request<{
        success: boolean;
        data: { id: string; name: string; accountNumber: string }[];
      }>(`${API_BASE_URL}/accounts?isActive=true`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccountsList(
        res.data.map((a) => ({
          id: a.id,
          name: a.name,
          accountNumber: a.accountNumber,
        }))
      );
    } catch {
      // Non-critical, accounts can be auto-assigned
    }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchProducts();
    fetchLowStock();
    fetchReferenceData();
  }, [hasAccess, permissionsLoading, fetchProducts, fetchLowStock, fetchReferenceData]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const handleEdit = (product: ProductListItem) => {
    setEditingProductId(product.id);
    editModal.openModal();
  };

  const handleDelete = (product: ProductListItem) => {
    setDeletingProduct({ id: product.id, name: product.name });
    deleteModal.openModal();
  };

  const handleAdjustStock = (product: ProductListItem) => {
    setAdjustingProduct({
      id: product.id,
      name: product.name,
      qty: product.quantityOnHand,
    });
    adjustStockModal.openModal();
  };

  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Product Created",
      message: "The product has been created successfully.",
    });
    fetchProducts();
    fetchLowStock();
  };

  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Product Updated",
      message: "The product has been updated successfully.",
    });
    fetchProducts();
    fetchLowStock();
  };

  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Product Deactivated",
      message: "The product has been deactivated successfully.",
    });
    fetchProducts();
    fetchLowStock();
  };

  const handleStockAdjusted = () => {
    setAlert({
      variant: "success",
      title: "Stock Adjusted",
      message: "The stock has been adjusted successfully.",
    });
    fetchProducts();
    fetchLowStock();
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
          Sign in to view products.
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
            Inventory
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Products & Services
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your products, services, and bundles
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
          Add Product
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

      {/* Low Stock Alerts */}
      <LowStockAlert items={lowStockItems} />

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
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.type
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <option value="">All Types</option>
          <option value="INVENTORY">Inventory</option>
          <option value="NON_INVENTORY">Non-Inventory</option>
          <option value="SERVICE">Service</option>
          <option value="BUNDLE">Bundle</option>
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
              Loading products...
            </span>
          </div>
        </div>
      ) : (
        <>
          <ProductsTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdjustStock={handleAdjustStock}
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
      <CreateProductModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
        vendors={vendorsList}
        accounts={accountsList}
      />

      <EditProductModal
        isOpen={editModal.isOpen}
        productId={editingProductId}
        onClose={() => {
          editModal.closeModal();
          setEditingProductId(null);
        }}
        onUpdated={handleUpdated}
        vendors={vendorsList}
        accounts={accountsList}
      />

      <DeleteProductModal
        isOpen={deleteModal.isOpen}
        productId={deletingProduct?.id || null}
        productName={deletingProduct?.name || ""}
        onClose={() => {
          deleteModal.closeModal();
          setDeletingProduct(null);
        }}
        onDeleted={handleDeleted}
      />

      <AdjustStockModal
        isOpen={adjustStockModal.isOpen}
        productId={adjustingProduct?.id || null}
        productName={adjustingProduct?.name || ""}
        currentQty={adjustingProduct?.qty || 0}
        onClose={() => {
          adjustStockModal.closeModal();
          setAdjustingProduct(null);
        }}
        onAdjusted={handleStockAdjusted}
      />
    </div>
  );
};

export default ProductsPage;
