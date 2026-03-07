import { API_BASE_URL, request } from "./apiClient";
import type {
  UpcomingResponse,
  TemplatesResponse,
  ProcessResult,
  UpdateRecurringSettingsRequest,
  ResumeResult,
  RecurringType,
} from "@/types/recurring";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const recurringService = {
  /**
   * GET /api/v1/recurring/upcoming?daysAhead=30&type=all
   */
  async getUpcoming(
    params: { daysAhead?: number; type?: string },
    token: string
  ): Promise<UpcomingResponse> {
    const q = new URLSearchParams();
    if (params.daysAhead !== undefined)
      q.append("daysAhead", String(params.daysAhead));
    if (params.type && params.type !== "all") q.append("type", params.type);

    const url = `${API_BASE_URL}/recurring/upcoming${q.toString() ? `?${q}` : ""}`;
    const response = await request<ApiResponse<UpcomingResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/recurring/templates
   */
  async getTemplates(token: string): Promise<TemplatesResponse> {
    const response = await request<ApiResponse<TemplatesResponse>>(
      `${API_BASE_URL}/recurring/templates`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  /**
   * POST /api/v1/recurring/process
   */
  async processOverdue(token: string): Promise<ProcessResult> {
    const response = await request<ApiResponse<ProcessResult>>(
      `${API_BASE_URL}/recurring/process`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * PATCH /api/v1/recurring/:type/:id/pause
   */
  async pause(
    type: RecurringType,
    id: string,
    token: string
  ): Promise<{ message: string }> {
    const response = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/recurring/${type}/${id}/pause`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * PATCH /api/v1/recurring/:type/:id/resume
   */
  async resume(
    type: RecurringType,
    id: string,
    token: string
  ): Promise<ResumeResult> {
    const response = await request<ApiResponse<ResumeResult>>(
      `${API_BASE_URL}/recurring/${type}/${id}/resume`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * PATCH /api/v1/recurring/:type/:id/settings
   */
  async updateSettings(
    type: RecurringType,
    id: string,
    body: UpdateRecurringSettingsRequest,
    token: string
  ): Promise<{ message: string }> {
    const response = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/recurring/${type}/${id}/settings`,
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
};

export default recurringService;
