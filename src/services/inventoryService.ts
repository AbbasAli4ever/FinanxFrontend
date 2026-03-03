import { API_BASE_URL, request } from "./apiClient";
import type {
  InventoryValuationResponse,
  InventoryMovement,
  MovementsFilters,
  StockSummaryData,
  ProductStockCard,
  StockCardFilters,
} from "@/types/inventory";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedMovements {
  items: InventoryMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const inventoryService = {
  async getValuation(token: string): Promise<InventoryValuationResponse> {
    const response = await request<ApiResponse<InventoryValuationResponse>>(
      `${API_BASE_URL}/inventory/valuation`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getMovements(
    filters: MovementsFilters,
    token: string
  ): Promise<PaginatedMovements> {
    const params = new URLSearchParams();
    if (filters.productId) params.set("productId", filters.productId);
    if (filters.transactionType) params.set("transactionType", filters.transactionType);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    const qs = params.toString();
    const response = await request<ApiResponse<PaginatedMovements>>(
      `${API_BASE_URL}/inventory/movements${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getStockSummary(token: string): Promise<StockSummaryData> {
    const response = await request<ApiResponse<StockSummaryData>>(
      `${API_BASE_URL}/inventory/stock-summary`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getProductStockCard(
    productId: string,
    filters: StockCardFilters,
    token: string
  ): Promise<ProductStockCard> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    const qs = params.toString();
    const response = await request<ApiResponse<ProductStockCard>>(
      `${API_BASE_URL}/inventory/product/${productId}/stock-card${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

export default inventoryService;
