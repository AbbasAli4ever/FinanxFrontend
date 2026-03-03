import { API_BASE_URL, request } from "./apiClient";
import type {
  SalesOrder,
  SOListItem,
  SOSummary,
  SOStatusInfo,
  SOFilters,
  CreateSORequest,
  UpdateSORequest,
  FulfillItemsRequest,
  VoidSORequest,
} from "@/types/salesOrders";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const salesOrdersService = {
  async getSummary(token: string): Promise<SOSummary> {
    const response = await request<ApiResponse<SOSummary>>(
      `${API_BASE_URL}/sales-orders/summary`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextSONumber: string }> {
    const response = await request<ApiResponse<{ nextSONumber: string }>>(
      `${API_BASE_URL}/sales-orders/next-number`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getStatuses(token: string): Promise<SOStatusInfo[]> {
    const response = await request<ApiResponse<SOStatusInfo[]>>(
      `${API_BASE_URL}/sales-orders/statuses`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getSalesOrders(
    filters: SOFilters,
    token: string
  ): Promise<PaginatedResponse<SOListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.customerId) params.set("customerId", filters.customerId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    const qs = params.toString();
    const response = await request<ApiResponse<PaginatedResponse<SOListItem>>>(
      `${API_BASE_URL}/sales-orders${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getSalesOrder(id: string, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async createSalesOrder(payload: CreateSORequest, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async updateSalesOrder(id: string, payload: UpdateSORequest, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async deleteSalesOrder(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/sales-orders/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
  },

  async sendSalesOrder(id: string, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async confirmSalesOrder(id: string, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/confirm`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async fulfillItems(id: string, payload: FulfillItemsRequest, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/fulfill`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async convertToInvoice(id: string, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/convert-to-invoice`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async duplicateSalesOrder(id: string, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/duplicate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async closeSalesOrder(id: string, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/close`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  async voidSalesOrder(id: string, payload: VoidSORequest, token: string): Promise<SalesOrder> {
    const response = await request<ApiResponse<SalesOrder>>(
      `${API_BASE_URL}/sales-orders/${id}/void`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },
};

export default salesOrdersService;
