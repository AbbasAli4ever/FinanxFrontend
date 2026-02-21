"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import type { ProductListItem } from "@/types/products";

interface ProductsTableProps {
  products: ProductListItem[];
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  onAdjustStock: (product: ProductListItem) => void;
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const typeBadgeColor: Record<string, "primary" | "success" | "warning" | "info"> = {
  INVENTORY: "primary",
  NON_INVENTORY: "info",
  SERVICE: "success",
  BUNDLE: "warning",
};

const typeLabel: Record<string, string> = {
  INVENTORY: "Inventory",
  NON_INVENTORY: "Non-Inv",
  SERVICE: "Service",
  BUNDLE: "Bundle",
};

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onEdit,
  onDelete,
  onAdjustStock,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-800">
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                SKU
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Type
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Price
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Qty
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const isLowStock =
                product.trackInventory &&
                product.reorderPoint !== null &&
                product.quantityOnHand <= product.reorderPoint;

              return (
                <TableRow
                  key={product.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                        {product.name}
                      </span>
                      {product.category && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {product.category.name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {product.sku || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      size="sm"
                      color={typeBadgeColor[product.type] || "primary"}
                      variant="light"
                    >
                      {typeLabel[product.type] || product.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(product.salesPrice)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {product.trackInventory ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            isLowStock
                              ? "text-warning-500"
                              : "text-gray-900 dark:text-white/90"
                          }`}
                        >
                          {product.quantityOnHand}
                        </span>
                        {isLowStock && (
                          <svg
                            className="h-4 w-4 text-warning-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        )}
                      </div>
                    ) : product.type === "BUNDLE" ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({product.bundleItemsCount})
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge
                      size="sm"
                      color={product.isActive ? "success" : "error"}
                      variant="light"
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {product.trackInventory && (
                        <button
                          onClick={() => onAdjustStock(product)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          title="Adjust stock"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(product)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        title="Edit product"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M11.333 2.00004C11.51 1.82274 11.7214 1.68342 11.9542 1.59009C12.187 1.49676 12.4365 1.4514 12.6873 1.45669C12.9381 1.46198 13.1854 1.51772 13.4141 1.62082C13.6427 1.72392 13.8481 1.87216 14.0179 2.05671C14.1876 2.24126 14.3184 2.45851 14.4025 2.69523C14.4866 2.93195 14.5224 3.18329 14.5074 3.43399C14.4925 3.68469 14.4272 3.93002 14.3153 4.15528C14.2034 4.38053 14.0473 4.58108 13.8567 4.74537L5.17133 13.4307L1.33333 14.6667L2.56933 10.8287L11.333 2.00004Z"
                            stroke="currentColor"
                            strokeWidth="1.33"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Delete product"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z"
                            stroke="currentColor"
                            strokeWidth="1.33"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {products.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No products found.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
