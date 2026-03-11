import { API_BASE_URL, request } from "./apiClient";
import type {
  TaxRate,
  TaxGroup,
  TaxSummary,
  TaxByRateReport,
  Vendor1099Report,
  CreateTaxRateRequest,
  UpdateTaxRateRequest,
  CreateTaxGroupRequest,
  UpdateTaxGroupRequest,
  TaxRateFilters,
} from "@/types/taxes";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const taxesService = {
  // ── Tax Rates ───────────────────────────────────────────────────────────────

  async listRates(
    token: string,
    filters?: TaxRateFilters
  ): Promise<{ taxRates: TaxRate[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.taxType) params.set("taxType", filters.taxType);
    if (filters?.isActive !== undefined)
      params.set("isActive", String(filters.isActive));
    const qs = params.toString();
    const response = await request<
      ApiResponse<{ taxRates: TaxRate[]; total: number }>
    >(`${API_BASE_URL}/taxes/rates${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getRate(token: string, id: string): Promise<TaxRate> {
    const response = await request<ApiResponse<TaxRate>>(
      `${API_BASE_URL}/taxes/rates/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async createRate(
    token: string,
    body: CreateTaxRateRequest
  ): Promise<TaxRate> {
    const response = await request<ApiResponse<TaxRate>>(
      `${API_BASE_URL}/taxes/rates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return response.data;
  },

  async updateRate(
    token: string,
    id: string,
    body: UpdateTaxRateRequest
  ): Promise<TaxRate> {
    const response = await request<ApiResponse<TaxRate>>(
      `${API_BASE_URL}/taxes/rates/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return response.data;
  },

  async deleteRate(token: string, id: string): Promise<void> {
    await request<ApiResponse<null>>(`${API_BASE_URL}/taxes/rates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Tax Groups ──────────────────────────────────────────────────────────────

  async listGroups(
    token: string
  ): Promise<{ taxGroups: TaxGroup[]; total: number }> {
    const response = await request<
      ApiResponse<{ taxGroups: TaxGroup[]; total: number }>
    >(`${API_BASE_URL}/taxes/groups`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getGroup(token: string, id: string): Promise<TaxGroup> {
    const response = await request<ApiResponse<TaxGroup>>(
      `${API_BASE_URL}/taxes/groups/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async createGroup(
    token: string,
    body: CreateTaxGroupRequest
  ): Promise<TaxGroup> {
    const response = await request<ApiResponse<TaxGroup>>(
      `${API_BASE_URL}/taxes/groups`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return response.data;
  },

  async updateGroup(
    token: string,
    id: string,
    body: UpdateTaxGroupRequest
  ): Promise<TaxGroup> {
    const response = await request<ApiResponse<TaxGroup>>(
      `${API_BASE_URL}/taxes/groups/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return response.data;
  },

  async deleteGroup(token: string, id: string): Promise<void> {
    await request<ApiResponse<null>>(`${API_BASE_URL}/taxes/groups/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async addRateToGroup(
    token: string,
    groupId: string,
    rateId: string
  ): Promise<TaxGroup> {
    const response = await request<ApiResponse<TaxGroup>>(
      `${API_BASE_URL}/taxes/groups/${groupId}/rates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rateId }),
      }
    );
    return response.data;
  },

  async removeRateFromGroup(
    token: string,
    groupId: string,
    rateId: string
  ): Promise<TaxGroup> {
    const response = await request<ApiResponse<TaxGroup>>(
      `${API_BASE_URL}/taxes/groups/${groupId}/rates/${rateId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // ── Reports ─────────────────────────────────────────────────────────────────

  async getSummaryReport(
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<TaxSummary> {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    const response = await request<ApiResponse<TaxSummary>>(
      `${API_BASE_URL}/taxes/reports/summary${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getByRateReport(
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<TaxByRateReport> {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    const response = await request<ApiResponse<TaxByRateReport>>(
      `${API_BASE_URL}/taxes/reports/by-rate${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async get1099Report(
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<Vendor1099Report> {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    const response = await request<ApiResponse<Vendor1099Report>>(
      `${API_BASE_URL}/taxes/reports/1099${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

export default taxesService;
