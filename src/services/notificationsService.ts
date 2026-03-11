import { API_BASE_URL, request } from "./apiClient";
import type {
  Notification,
  NotificationPreference,
  PaginatedNotifications,
  NotificationFilters,
} from "@/types/notifications";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const notificationsService = {
  async list(
    token: string,
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications> {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.isRead !== undefined) params.set("isRead", String(filters.isRead));
    if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.set("dateTo", filters.dateTo);
    if (filters?.sortBy) params.set("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    const res = await request<ApiResponse<PaginatedNotifications>>(
      `${API_BASE_URL}/notifications${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async getUnreadCount(token: string): Promise<number> {
    const res = await request<ApiResponse<{ unreadCount: number }>>(
      `${API_BASE_URL}/notifications/unread-count`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.unreadCount;
  },

  async getOne(token: string, id: string): Promise<Notification> {
    const res = await request<ApiResponse<Notification>>(
      `${API_BASE_URL}/notifications/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async markRead(token: string, id: string): Promise<Notification> {
    const res = await request<ApiResponse<Notification>>(
      `${API_BASE_URL}/notifications/${id}/read`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async markAllRead(token: string): Promise<{ updated: number }> {
    const res = await request<ApiResponse<{ updated: number }>>(
      `${API_BASE_URL}/notifications/read-all`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async deleteOne(token: string, id: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/notifications/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
  },

  async clearRead(token: string): Promise<{ deleted: number }> {
    const res = await request<ApiResponse<{ deleted: number }>>(
      `${API_BASE_URL}/notifications/clear-read`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async getPreferences(token: string): Promise<NotificationPreference[]> {
    const res = await request<ApiResponse<NotificationPreference[]>>(
      `${API_BASE_URL}/notifications/preferences`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async updatePreferences(
    token: string,
    preferences: Partial<NotificationPreference>[]
  ): Promise<NotificationPreference[]> {
    const res = await request<ApiResponse<NotificationPreference[]>>(
      `${API_BASE_URL}/notifications/preferences`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
      }
    );
    return res.data;
  },

  async sendTest(token: string): Promise<Notification> {
    const res = await request<ApiResponse<Notification>>(
      `${API_BASE_URL}/notifications/test`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};

export default notificationsService;
