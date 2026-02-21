import { API_BASE_URL, request } from "./apiClient";
import type {
  Product,
  ProductListItem,
  ProductTypeInfo,
  LowStockItem,
  CreateProductRequest,
  UpdateProductRequest,
  AdjustStockRequest,
  StockAdjustmentResponse,
  ProductFilters,
  PaginatedResponse,
} from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const productsService = {
  async getProductTypes(token: string): Promise<ProductTypeInfo[]> {
    const response = await request<ApiResponse<ProductTypeInfo[]>>(
      `${API_BASE_URL}/products/types`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getProducts(
    filters: Partial<ProductFilters>,
    token: string
  ): Promise<PaginatedResponse<ProductListItem>> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.type) params.append("type", filters.type);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.isActive) params.append("isActive", filters.isActive);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/products${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<PaginatedResponse<ProductListItem>>>(
      url,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getProduct(productId: string, token: string): Promise<Product> {
    const response = await request<ApiResponse<Product>>(
      `${API_BASE_URL}/products/${productId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createProduct(
    payload: CreateProductRequest,
    token: string
  ): Promise<Product> {
    const response = await request<ApiResponse<Product>>(
      `${API_BASE_URL}/products`,
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

  async updateProduct(
    productId: string,
    payload: UpdateProductRequest,
    token: string
  ): Promise<Product> {
    const response = await request<ApiResponse<Product>>(
      `${API_BASE_URL}/products/${productId}`,
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

  async deleteProduct(productId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/products/${productId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async adjustStock(
    productId: string,
    payload: AdjustStockRequest,
    token: string
  ): Promise<StockAdjustmentResponse> {
    const response = await request<ApiResponse<StockAdjustmentResponse>>(
      `${API_BASE_URL}/products/${productId}/adjust-stock`,
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

  async getLowStock(token: string): Promise<LowStockItem[]> {
    const response = await request<ApiResponse<LowStockItem[]>>(
      `${API_BASE_URL}/products/low-stock`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};

export default productsService;
