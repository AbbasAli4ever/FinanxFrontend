import { API_BASE_URL, request } from "./apiClient";
import type {
  TimeEntry,
  TimeEntryListResponse,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  TimeEntryFilters,
} from "@/types/projects";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const timeEntriesService = {
  /** GET /api/v1/time-entries */
  async getList(
    filters: TimeEntryFilters,
    token: string
  ): Promise<TimeEntryListResponse> {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.append(k, String(v));
    });
    const url = `${API_BASE_URL}/time-entries${q.toString() ? `?${q}` : ""}`;
    const res = await request<ApiResponse<TimeEntryListResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /** POST /api/v1/time-entries */
  async create(body: CreateTimeEntryRequest, token: string): Promise<TimeEntry> {
    const res = await request<ApiResponse<TimeEntry>>(
      `${API_BASE_URL}/time-entries`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** GET /api/v1/time-entries/:id */
  async getById(id: string, token: string): Promise<TimeEntry> {
    const res = await request<ApiResponse<TimeEntry>>(
      `${API_BASE_URL}/time-entries/${id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /** PATCH /api/v1/time-entries/:id */
  async update(
    id: string,
    body: UpdateTimeEntryRequest,
    token: string
  ): Promise<TimeEntry> {
    const res = await request<ApiResponse<TimeEntry>>(
      `${API_BASE_URL}/time-entries/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** DELETE /api/v1/time-entries/:id */
  async delete(id: string, token: string): Promise<{ message: string }> {
    const res = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/time-entries/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /** POST /api/v1/time-entries/:id/submit */
  async submit(id: string, token: string): Promise<TimeEntry> {
    const res = await request<ApiResponse<TimeEntry>>(
      `${API_BASE_URL}/time-entries/${id}/submit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  },

  /** POST /api/v1/time-entries/:id/approve */
  async approve(id: string, token: string): Promise<TimeEntry> {
    const res = await request<ApiResponse<TimeEntry>>(
      `${API_BASE_URL}/time-entries/${id}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  },

  /** POST /api/v1/time-entries/:id/reject */
  async reject(
    id: string,
    reason: string,
    token: string
  ): Promise<TimeEntry> {
    const res = await request<ApiResponse<TimeEntry>>(
      `${API_BASE_URL}/time-entries/${id}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },
};

export default timeEntriesService;
