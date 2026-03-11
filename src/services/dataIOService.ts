import { API_BASE_URL, request } from "./apiClient";
import type {
  SupportedEntity,
  TemplateResponse,
  ValidationResult,
  ImportJobListItem,
  ImportJobListResponse,
  ImportHistoryFilters,
  ExportResult,
  ExportFilters,
  ImportEntityType,
  ExportEntityType,
  DuplicateStrategy,
} from "@/types/dataIO";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const dataIOService = {
  async getSupportedEntities(token: string): Promise<SupportedEntity[]> {
    const response = await request<ApiResponse<SupportedEntity[]>>(
      `${API_BASE_URL}/data/export/supported-entities`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getTemplate(
    entityType: ImportEntityType,
    token: string
  ): Promise<TemplateResponse> {
    const response = await request<ApiResponse<TemplateResponse>>(
      `${API_BASE_URL}/data/templates/${entityType}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async validateImport(
    entityType: ImportEntityType,
    csvData: string,
    fileName: string,
    token: string
  ): Promise<ValidationResult> {
    const response = await request<ApiResponse<ValidationResult>>(
      `${API_BASE_URL}/data/import/${entityType}/validate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData, fileName }),
      }
    );
    return response.data;
  },

  async importData(
    entityType: ImportEntityType,
    csvData: string,
    fileName: string,
    duplicateStrategy: DuplicateStrategy,
    token: string
  ): Promise<ImportJobListItem> {
    const response = await request<ApiResponse<ImportJobListItem>>(
      `${API_BASE_URL}/data/import/${entityType}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData, fileName, duplicateStrategy }),
      }
    );
    return response.data;
  },

  async getImportHistory(
    filters: ImportHistoryFilters,
    token: string
  ): Promise<ImportJobListResponse> {
    const params = new URLSearchParams();
    if (filters.entityType) params.append("entityType", filters.entityType);
    if (filters.status) params.append("status", filters.status);
    params.append("page", filters.page.toString());
    params.append("limit", filters.limit.toString());

    const query = params.toString();
    const url = `${API_BASE_URL}/data/import/history${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<ImportJobListResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getImportJob(
    id: string,
    token: string
  ): Promise<ImportJobListItem> {
    const response = await request<ApiResponse<ImportJobListItem>>(
      `${API_BASE_URL}/data/import/history/${id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async deleteImportJob(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/data/import/history/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async exportData(
    entityType: ExportEntityType,
    filters: ExportFilters,
    token: string
  ): Promise<ExportResult> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.status) params.append("status", filters.status);

    const query = params.toString();
    const url = `${API_BASE_URL}/data/export/${entityType}${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<ExportResult>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default dataIOService;
