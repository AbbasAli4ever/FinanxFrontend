import { API_BASE_URL, request } from "./apiClient";
import type {
  Estimate,
  EstimateListItem,
  EstimateSummary,
  EstimateStatusInfo,
  EstimateFilters,
  CreateEstimateRequest,
  UpdateEstimateRequest,
  RejectEstimateRequest,
  VoidEstimateRequest,
} from "@/types/estimates";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const estimatesService = {
  async getSummary(token: string): Promise<EstimateSummary> {
    const response = await request<ApiResponse<EstimateSummary>>(
      `${API_BASE_URL}/estimates/summary`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextEstimateNumber: string }> {
    const response = await request<ApiResponse<{ nextEstimateNumber: string }>>(
      `${API_BASE_URL}/estimates/next-number`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getStatuses(token: string): Promise<Record<string, EstimateStatusInfo>> {
    const response = await request<ApiResponse<Record<string, EstimateStatusInfo>>>(
      `${API_BASE_URL}/estimates/statuses`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getEstimates(
    filters: EstimateFilters,
    token: string
  ): Promise<PaginatedResponse<EstimateListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.customerId) params.append("customerId", filters.customerId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/estimates${query ? `?${query}` : ""}`;
    const response = await request<ApiResponse<PaginatedResponse<EstimateListItem>>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getEstimate(id: string, token: string): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async createEstimate(payload: CreateEstimateRequest, token: string): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async updateEstimate(
    id: string,
    payload: UpdateEstimateRequest,
    token: string
  ): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async deleteEstimate(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/estimates/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
  },

  async sendEstimate(id: string, token: string): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}/send`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async markViewed(id: string, token: string): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}/mark-viewed`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async acceptEstimate(id: string, token: string): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}/accept`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async rejectEstimate(
    id: string,
    payload: RejectEstimateRequest,
    token: string
  ): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}/reject`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async convertToInvoice(
    id: string,
    token: string
  ): Promise<Estimate & { convertedInvoice: { id: string; invoiceNumber: string } }> {
    const response = await request<
      ApiResponse<Estimate & { convertedInvoice: { id: string; invoiceNumber: string } }>
    >(
      `${API_BASE_URL}/estimates/${id}/convert-to-invoice`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async duplicateEstimate(id: string, token: string): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}/duplicate`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async voidEstimate(
    id: string,
    payload: VoidEstimateRequest,
    token: string
  ): Promise<Estimate> {
    const response = await request<ApiResponse<Estimate>>(
      `${API_BASE_URL}/estimates/${id}/void`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async expireOverdue(token: string): Promise<{ expiredCount: number }> {
    const response = await request<ApiResponse<{ expiredCount: number }>>(
      `${API_BASE_URL}/estimates/expire-overdue`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

export default estimatesService;
