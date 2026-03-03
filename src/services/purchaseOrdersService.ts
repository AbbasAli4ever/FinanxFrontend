import { API_BASE_URL, request } from "./apiClient";
import type {
  PurchaseOrder,
  POListItem,
  POSummary,
  POStatusInfo,
  POFilters,
  CreatePORequest,
  UpdatePORequest,
  ReceiveItemsRequest,
  VoidPORequest,
} from "@/types/purchaseOrders";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const purchaseOrdersService = {
  async getSummary(token: string): Promise<POSummary> {
    const response = await request<ApiResponse<POSummary>>(
      `${API_BASE_URL}/purchase-orders/summary`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextPONumber: string }> {
    const response = await request<ApiResponse<{ nextPONumber: string }>>(
      `${API_BASE_URL}/purchase-orders/next-number`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getStatuses(token: string): Promise<POStatusInfo[]> {
    const response = await request<ApiResponse<POStatusInfo[]>>(
      `${API_BASE_URL}/purchase-orders/statuses`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getPurchaseOrders(
    filters: POFilters,
    token: string
  ): Promise<PaginatedResponse<POListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.vendorId) params.set("vendorId", filters.vendorId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    const qs = params.toString();
    const response = await request<ApiResponse<PaginatedResponse<POListItem>>>(
      `${API_BASE_URL}/purchase-orders${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getPurchaseOrder(id: string, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async createPurchaseOrder(payload: CreatePORequest, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async updatePurchaseOrder(id: string, payload: UpdatePORequest, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async deletePurchaseOrder(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/purchase-orders/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
  },

  async sendPurchaseOrder(id: string, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}/send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async receiveItems(id: string, payload: ReceiveItemsRequest, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}/receive`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async convertToBill(id: string, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}/convert-to-bill`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async duplicatePurchaseOrder(id: string, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}/duplicate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async closePurchaseOrder(id: string, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}/close`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async voidPurchaseOrder(id: string, payload: VoidPORequest, token: string): Promise<PurchaseOrder> {
    const response = await request<ApiResponse<PurchaseOrder>>(
      `${API_BASE_URL}/purchase-orders/${id}/void`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },
};

export default purchaseOrdersService;
