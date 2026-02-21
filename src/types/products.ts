export type ProductType = "INVENTORY" | "NON_INVENTORY" | "SERVICE" | "BUNDLE";

export type AdjustmentReason =
  | "RECEIVED"
  | "DAMAGED"
  | "LOST"
  | "RETURNED"
  | "CORRECTION"
  | "OTHER";

export interface ProductTypeInfo {
  type: ProductType;
  label: string;
  description: string;
  trackInventory: boolean;
}

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: { id: string; name: string; fullPath?: string } | null;
  salesDescription: string | null;
  purchaseDescription: string | null;
  salesPrice: number | null;
  purchaseCost: number | null;
  unitOfMeasure: { id: string; name: string; abbreviation: string } | null;
  incomeAccount: { id: string; name: string; accountNumber: string } | null;
  expenseAccount: { id: string; name: string; accountNumber: string } | null;
  inventoryAssetAccount: {
    id: string;
    name: string;
    accountNumber: string;
  } | null;
  taxable: boolean;
  taxRate: number | null;
  trackInventory: boolean;
  quantityOnHand: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  preferredVendor: { id: string; displayName: string } | null;
  imageUrl: string | null;
  isActive: boolean;
  bundleItems: BundleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    type: ProductType;
    salesPrice: number | null;
    purchaseCost: number | null;
  };
}

export interface ProductListItem {
  id: string;
  type: ProductType;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: { id: string; name: string } | null;
  salesPrice: number | null;
  purchaseCost: number | null;
  unitOfMeasure: { id: string; name: string; abbreviation: string } | null;
  taxable: boolean;
  trackInventory: boolean;
  quantityOnHand: number;
  reorderPoint: number | null;
  preferredVendor: { id: string; displayName: string } | null;
  isActive: boolean;
  bundleItemsCount: number;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string | null;
  type: ProductType;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number | null;
  deficit: number;
  salesPrice: number | null;
  purchaseCost: number | null;
  category: { id: string; name: string } | null;
  preferredVendor: { id: string; displayName: string } | null;
}

export interface CreateProductRequest {
  type: ProductType;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  salesDescription?: string;
  purchaseDescription?: string;
  salesPrice?: number;
  purchaseCost?: number;
  unitOfMeasureId?: string;
  incomeAccountId?: string;
  expenseAccountId?: string;
  inventoryAssetAccountId?: string;
  taxable?: boolean;
  taxRate?: number;
  quantityOnHand?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  preferredVendorId?: string;
  imageUrl?: string;
  bundleItems?: { productId: string; quantity: number }[];
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  salesDescription?: string;
  purchaseDescription?: string;
  salesPrice?: number;
  purchaseCost?: number;
  unitOfMeasureId?: string;
  incomeAccountId?: string;
  expenseAccountId?: string;
  inventoryAssetAccountId?: string;
  taxable?: boolean;
  taxRate?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  preferredVendorId?: string;
  imageUrl?: string;
  isActive?: boolean;
  bundleItems?: { productId: string; quantity: number }[];
}

export interface AdjustStockRequest {
  adjustmentQuantity: number;
  reason: AdjustmentReason;
  notes?: string;
}

export interface StockAdjustmentResponse {
  id: string;
  name: string;
  quantityOnHand: number;
  adjustment: {
    previousQuantity: number;
    adjustmentQuantity: number;
    newQuantity: number;
    reason: AdjustmentReason;
    notes: string | null;
  };
}

export interface ProductFilters {
  search: string;
  type: string;
  categoryId: string;
  isActive: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
