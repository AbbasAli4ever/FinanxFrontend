import { API_BASE_URL, request } from "./apiClient";
import type {
  Vendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  VendorFilters,
} from "@/types/vendors";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const vendorsService = {
  async getVendors(
    filters: Partial<VendorFilters>,
    token: string
  ): Promise<Vendor[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.vendorType) params.append("vendorType", filters.vendorType);
    if (filters.isActive) params.append("isActive", filters.isActive);
    if (filters.track1099) params.append("track1099", filters.track1099);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const query = params.toString();
    const url = `${API_BASE_URL}/vendors${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<Vendor[]>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createVendor(
    payload: CreateVendorRequest,
    token: string
  ): Promise<Vendor> {
    const response = await request<ApiResponse<Vendor>>(
      `${API_BASE_URL}/vendors`,
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

  async updateVendor(
    vendorId: string,
    payload: UpdateVendorRequest,
    token: string
  ): Promise<Vendor> {
    const response = await request<ApiResponse<Vendor>>(
      `${API_BASE_URL}/vendors/${vendorId}`,
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

  async deleteVendor(vendorId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/vendors/${vendorId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};

export default vendorsService;
