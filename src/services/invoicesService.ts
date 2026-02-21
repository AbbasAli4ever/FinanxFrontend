import { API_BASE_URL, request } from "./apiClient";
import type {
  Invoice,
  InvoiceListItem,
  InvoiceSummary,
  StatusInfo,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  RecordPaymentRequest,
  VoidInvoiceRequest,
  InvoiceFilters,
} from "@/types/invoices";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const invoicesService = {
  async getSummary(token: string): Promise<InvoiceSummary> {
    const response = await request<ApiResponse<InvoiceSummary>>(
      `${API_BASE_URL}/invoices/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextInvoiceNumber: string }> {
    const response = await request<
      ApiResponse<{ nextInvoiceNumber: string }>
    >(`${API_BASE_URL}/invoices/next-number`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getStatuses(
    token: string
  ): Promise<Record<string, StatusInfo>> {
    const response = await request<ApiResponse<Record<string, StatusInfo>>>(
      `${API_BASE_URL}/invoices/statuses`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getInvoices(
    filters: Partial<InvoiceFilters>,
    token: string
  ): Promise<PaginatedResponse<InvoiceListItem>> {
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
    const url = `${API_BASE_URL}/invoices${query ? `?${query}` : ""}`;

    const response = await request<
      ApiResponse<PaginatedResponse<InvoiceListItem>>
    >(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getInvoice(invoiceId: string, token: string): Promise<Invoice> {
    const response = await request<ApiResponse<Invoice>>(
      `${API_BASE_URL}/invoices/${invoiceId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createInvoice(
    payload: CreateInvoiceRequest,
    token: string
  ): Promise<Invoice> {
    const response = await request<ApiResponse<Invoice>>(
      `${API_BASE_URL}/invoices`,
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

  async updateInvoice(
    invoiceId: string,
    payload: UpdateInvoiceRequest,
    token: string
  ): Promise<Invoice> {
    const response = await request<ApiResponse<Invoice>>(
      `${API_BASE_URL}/invoices/${invoiceId}`,
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

  async deleteInvoice(invoiceId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/invoices/${invoiceId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async sendInvoice(invoiceId: string, token: string): Promise<Invoice> {
    const response = await request<ApiResponse<Invoice>>(
      `${API_BASE_URL}/invoices/${invoiceId}/send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async voidInvoice(
    invoiceId: string,
    payload: VoidInvoiceRequest,
    token: string
  ): Promise<Invoice> {
    const response = await request<ApiResponse<Invoice>>(
      `${API_BASE_URL}/invoices/${invoiceId}/void`,
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
    invoiceId: string,
    payload: RecordPaymentRequest,
    token: string
  ): Promise<Invoice> {
    const response = await request<ApiResponse<Invoice>>(
      `${API_BASE_URL}/invoices/${invoiceId}/payments`,
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

export default invoicesService;
