import { API_BASE_URL, request } from "./apiClient";
import type {
  AuditLogListResponse,
  AuditLogFilters,
  AuditLogItem,
  EntityAuditLogItem,
  AuditEntityType,
} from "@/types/audit";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const auditService = {
  /**
   * GET /api/v1/audit-trail — Paginated audit log list
   */
  async getLogs(
    filters: AuditLogFilters,
    token: string
  ): Promise<AuditLogListResponse> {
    const q = new URLSearchParams();
    if (filters.page) q.append("page", String(filters.page));
    if (filters.limit) q.append("limit", String(filters.limit));
    if (filters.entityType) q.append("entityType", filters.entityType);
    if (filters.entityId) q.append("entityId", filters.entityId);
    if (filters.userId) q.append("userId", filters.userId);
    if (filters.action) q.append("action", filters.action);
    if (filters.dateFrom) q.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) q.append("dateTo", filters.dateTo);
    if (filters.search) q.append("search", filters.search);
    if (filters.sortBy) q.append("sortBy", filters.sortBy);
    if (filters.sortOrder) q.append("sortOrder", filters.sortOrder);

    const url = `${API_BASE_URL}/audit-trail${q.toString() ? `?${q}` : ""}`;
    const response = await request<ApiResponse<AuditLogListResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/audit-trail/entity/:entityType/:entityId — Document history
   */
  async getEntityHistory(
    entityType: AuditEntityType,
    entityId: string,
    token: string
  ): Promise<EntityAuditLogItem[]> {
    const response = await request<ApiResponse<EntityAuditLogItem[]>>(
      `${API_BASE_URL}/audit-trail/entity/${entityType}/${entityId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  /**
   * GET /api/v1/audit-trail/user/:userId — User activity log
   */
  async getUserActivity(
    userId: string,
    params: { page?: number; limit?: number },
    token: string
  ): Promise<AuditLogListResponse> {
    const q = new URLSearchParams();
    if (params.page) q.append("page", String(params.page));
    if (params.limit) q.append("limit", String(params.limit));

    const url = `${API_BASE_URL}/audit-trail/user/${userId}${q.toString() ? `?${q}` : ""}`;
    const response = await request<ApiResponse<AuditLogListResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default auditService;
