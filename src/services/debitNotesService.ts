import { API_BASE_URL, request } from "./apiClient";
import type {
  DebitNote,
  DebitNoteListItem,
  DebitNoteSummary,
  DebitNoteStatusInfo,
  CreateDebitNoteRequest,
  UpdateDebitNoteRequest,
  ApplyDebitNoteRequest,
  RefundDebitNoteRequest,
  VoidDebitNoteRequest,
  DebitNoteFilters,
} from "@/types/debitNotes";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const debitNotesService = {
  async getSummary(token: string): Promise<DebitNoteSummary> {
    const response = await request<ApiResponse<DebitNoteSummary>>(
      `${API_BASE_URL}/debit-notes/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextDebitNoteNumber: string }> {
    const response = await request<ApiResponse<{ nextDebitNoteNumber: string }>>(
      `${API_BASE_URL}/debit-notes/next-number`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getStatuses(token: string): Promise<Record<string, DebitNoteStatusInfo>> {
    const response = await request<ApiResponse<Record<string, DebitNoteStatusInfo>>>(
      `${API_BASE_URL}/debit-notes/statuses`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getDebitNotes(
    filters: Partial<DebitNoteFilters>,
    token: string
  ): Promise<PaginatedResponse<DebitNoteListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.vendorId) params.append("vendorId", filters.vendorId);
    if (filters.billId) params.append("billId", filters.billId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/debit-notes${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<PaginatedResponse<DebitNoteListItem>>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getDebitNote(id: string, token: string): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes/${id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createDebitNote(payload: CreateDebitNoteRequest, token: string): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes`,
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

  async updateDebitNote(
    id: string,
    payload: UpdateDebitNoteRequest,
    token: string
  ): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes/${id}`,
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

  async deleteDebitNote(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/debit-notes/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async openDebitNote(id: string, token: string): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes/${id}/open`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async applyDebitNote(
    id: string,
    payload: ApplyDebitNoteRequest,
    token: string
  ): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes/${id}/apply`,
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

  async refundDebitNote(
    id: string,
    payload: RefundDebitNoteRequest,
    token: string
  ): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes/${id}/refund`,
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

  async voidDebitNote(
    id: string,
    payload: VoidDebitNoteRequest,
    token: string
  ): Promise<DebitNote> {
    const response = await request<ApiResponse<DebitNote>>(
      `${API_BASE_URL}/debit-notes/${id}/void`,
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

export default debitNotesService;
