import { API_BASE_URL, request } from "./apiClient";
import type {
  Bill,
  BillListItem,
  BillSummary,
  BillStatusInfo,
  CreateBillRequest,
  UpdateBillRequest,
  RecordBillPaymentRequest,
  VoidBillRequest,
  BillFilters,
} from "@/types/bills";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const billsService = {
  async getSummary(token: string): Promise<BillSummary> {
    const response = await request<ApiResponse<BillSummary>>(
      `${API_BASE_URL}/bills/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextBillNumber: string }> {
    const response = await request<
      ApiResponse<{ nextBillNumber: string }>
    >(`${API_BASE_URL}/bills/next-number`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getStatuses(
    token: string
  ): Promise<Record<string, BillStatusInfo>> {
    const response = await request<ApiResponse<Record<string, BillStatusInfo>>>(
      `${API_BASE_URL}/bills/statuses`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getBills(
    filters: Partial<BillFilters>,
    token: string
  ): Promise<PaginatedResponse<BillListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.vendorId) params.append("vendorId", filters.vendorId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/bills${query ? `?${query}` : ""}`;

    const response = await request<
      ApiResponse<PaginatedResponse<BillListItem>>
    >(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getBill(billId: string, token: string): Promise<Bill> {
    const response = await request<ApiResponse<Bill>>(
      `${API_BASE_URL}/bills/${billId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createBill(
    payload: CreateBillRequest,
    token: string
  ): Promise<Bill> {
    const response = await request<ApiResponse<Bill>>(
      `${API_BASE_URL}/bills`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async updateBill(
    billId: string,
    payload: UpdateBillRequest,
    token: string
  ): Promise<Bill> {
    const response = await request<ApiResponse<Bill>>(
      `${API_BASE_URL}/bills/${billId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async deleteBill(billId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/bills/${billId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async receiveBill(billId: string, token: string): Promise<Bill> {
    const response = await request<ApiResponse<Bill>>(
      `${API_BASE_URL}/bills/${billId}/receive`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async voidBill(
    billId: string,
    payload: VoidBillRequest,
    token: string
  ): Promise<Bill> {
    const response = await request<ApiResponse<Bill>>(
      `${API_BASE_URL}/bills/${billId}/void`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async recordPayment(
    billId: string,
    payload: RecordBillPaymentRequest,
    token: string
  ): Promise<Bill> {
    const response = await request<ApiResponse<Bill>>(
      `${API_BASE_URL}/bills/${billId}/payments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },
};

export default billsService;
