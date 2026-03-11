import { API_BASE_URL, request } from "./apiClient";
import type {
  GlobalSearchData,
  QuickSearchData,
  EntitySearchData,
  EntitySearchType,
} from "@/types/search";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const searchService = {
  async globalSearch(
    query: string,
    token: string,
    limit = 20
  ): Promise<GlobalSearchData> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await request<ApiResponse<GlobalSearchData>>(
      `${API_BASE_URL}/search/global?${params}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async quickSearch(
    query: string,
    token: string,
    limit = 5
  ): Promise<QuickSearchData> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await request<ApiResponse<QuickSearchData>>(
      `${API_BASE_URL}/search/quick?${params}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async entitySearch(
    entityType: EntitySearchType,
    query: string,
    token: string,
    page = 1,
    limit = 20
  ): Promise<EntitySearchData> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      page: String(page),
    });
    const response = await request<ApiResponse<EntitySearchData>>(
      `${API_BASE_URL}/search/${entityType}?${params}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

export default searchService;
