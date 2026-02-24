import { API_BASE_URL, request } from "./apiClient";
import type {
  JournalEntry,
  JournalEntryListItem,
  JournalEntrySummary,
  JournalEntryStatusInfo,
  JournalEntryFilters,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  VoidJournalEntryRequest,
} from "@/types/journalEntries";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const journalEntriesService = {
  async getSummary(token: string): Promise<JournalEntrySummary> {
    const response = await request<ApiResponse<JournalEntrySummary>>(
      `${API_BASE_URL}/journal-entries/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextEntryNumber: string }> {
    const response = await request<
      ApiResponse<{ nextEntryNumber: string }>
    >(`${API_BASE_URL}/journal-entries/next-number`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getStatuses(
    token: string
  ): Promise<Record<string, JournalEntryStatusInfo>> {
    const response = await request<
      ApiResponse<Record<string, JournalEntryStatusInfo>>
    >(`${API_BASE_URL}/journal-entries/statuses`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getEntryTypes(
    token: string
  ): Promise<{ value: string; label: string }[]> {
    const response = await request<
      ApiResponse<{ value: string; label: string }[]>
    >(`${API_BASE_URL}/journal-entries/entry-types`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getJournalEntries(
    filters: Partial<JournalEntryFilters>,
    token: string
  ): Promise<PaginatedResponse<JournalEntryListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.entryType) params.append("entryType", filters.entryType);
    if (filters.accountId) params.append("accountId", filters.accountId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.amountMin) params.append("amountMin", filters.amountMin);
    if (filters.amountMax) params.append("amountMax", filters.amountMax);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/journal-entries${query ? `?${query}` : ""}`;

    const response = await request<
      ApiResponse<PaginatedResponse<JournalEntryListItem>>
    >(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getJournalEntry(
    entryId: string,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries/${entryId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createJournalEntry(
    payload: CreateJournalEntryRequest,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries`,
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

  async updateJournalEntry(
    entryId: string,
    payload: UpdateJournalEntryRequest,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries/${entryId}`,
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

  async deleteJournalEntry(
    entryId: string,
    token: string
  ): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/journal-entries/${entryId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async postJournalEntry(
    entryId: string,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries/${entryId}/post`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async voidJournalEntry(
    entryId: string,
    payload: VoidJournalEntryRequest,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries/${entryId}/void`,
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

  async reverseJournalEntry(
    entryId: string,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries/${entryId}/reverse`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async duplicateJournalEntry(
    entryId: string,
    token: string
  ): Promise<JournalEntry> {
    const response = await request<ApiResponse<JournalEntry>>(
      `${API_BASE_URL}/journal-entries/${entryId}/duplicate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};

export default journalEntriesService;
