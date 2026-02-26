import { API_BASE_URL, request } from "./apiClient";
import type {
  CreditNote,
  CreditNoteListItem,
  CreditNoteSummary,
  CreditNoteStatusInfo,
  CreateCreditNoteRequest,
  UpdateCreditNoteRequest,
  ApplyCreditNoteRequest,
  RefundCreditNoteRequest,
  VoidCreditNoteRequest,
  CreditNoteFilters,
} from "@/types/creditNotes";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const creditNotesService = {
  async getSummary(token: string): Promise<CreditNoteSummary> {
    const response = await request<ApiResponse<CreditNoteSummary>>(
      `${API_BASE_URL}/credit-notes/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextCreditNoteNumber: string }> {
    const response = await request<ApiResponse<{ nextCreditNoteNumber: string }>>(
      `${API_BASE_URL}/credit-notes/next-number`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getStatuses(token: string): Promise<Record<string, CreditNoteStatusInfo>> {
    const response = await request<ApiResponse<Record<string, CreditNoteStatusInfo>>>(
      `${API_BASE_URL}/credit-notes/statuses`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getCreditNotes(
    filters: Partial<CreditNoteFilters>,
    token: string
  ): Promise<PaginatedResponse<CreditNoteListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.customerId) params.append("customerId", filters.customerId);
    if (filters.invoiceId) params.append("invoiceId", filters.invoiceId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/credit-notes${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<PaginatedResponse<CreditNoteListItem>>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getCreditNote(id: string, token: string): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes/${id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createCreditNote(payload: CreateCreditNoteRequest, token: string): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes`,
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

  async updateCreditNote(
    id: string,
    payload: UpdateCreditNoteRequest,
    token: string
  ): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes/${id}`,
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

  async deleteCreditNote(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/credit-notes/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async openCreditNote(id: string, token: string): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes/${id}/open`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async applyCreditNote(
    id: string,
    payload: ApplyCreditNoteRequest,
    token: string
  ): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes/${id}/apply`,
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

  async refundCreditNote(
    id: string,
    payload: RefundCreditNoteRequest,
    token: string
  ): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes/${id}/refund`,
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

  async voidCreditNote(
    id: string,
    payload: VoidCreditNoteRequest,
    token: string
  ): Promise<CreditNote> {
    const response = await request<ApiResponse<CreditNote>>(
      `${API_BASE_URL}/credit-notes/${id}/void`,
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

export default creditNotesService;
