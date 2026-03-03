export type TransactionType =
  | "PURCHASE_RECEIVE"
  | "SALES_FULFILL"
  | "MANUAL_ADJUSTMENT"
  | "INITIAL_STOCK"
  | "VOID_REVERSAL"
  | "TRANSFER";

export type ReferenceType =
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "INVOICE"
  | "BILL"
  | "MANUAL"
  | "OPENING_BALANCE";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface InventoryValuationItem {
  id: string;
  name: string;
  sku: string | null;
  type: string;
  category: { id: string; name: string } | null;
  quantityOnHand: number;
  averageCost: number;
  salesPrice: number;
  totalValue: number;
}

export interface InventoryValuationSummary {
  totalProducts: number;
  totalValue: number;
}

export interface InventoryValuationResponse {
  items: InventoryValuationItem[];
  summary: InventoryValuationSummary;
}

export interface InventoryMovement {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    type: string;
  };
  transactionType: TransactionType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: number;
  totalCost: number;
  referenceType: ReferenceType;
  referenceId: string | null;
  notes: string | null;
  date: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface MovementsFilters {
  productId?: string;
  transactionType?: TransactionType | "";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: string;
  limit?: string;
}

export interface StockSummaryItem {
  id: string;
  name: string;
  sku: string | null;
  type: string;
  category: { id: string; name: string } | null;
  preferredVendor: { id: string; displayName: string } | null;
  quantityOnHand: number;
  averageCost: number;
  salesPrice: number;
  totalValue: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: StockStatus;
}

export interface StockSummaryData {
  items: StockSummaryItem[];
  summary: {
    totalProducts: number;
    totalValue: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export interface ProductStockCard {
  product: {
    id: string;
    name: string;
    sku: string | null;
    type: string;
    trackInventory: boolean;
    currentQuantity: number;
    averageCost: number;
    salesPrice: number;
    reorderPoint: number;
    reorderQuantity: number;
  };
  transactions: InventoryMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockCardFilters {
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
}
