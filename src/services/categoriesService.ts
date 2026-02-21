import { API_BASE_URL, request } from "./apiClient";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/categories";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const categoriesService = {
  async getCategories(token: string): Promise<Category[]> {
    const response = await request<ApiResponse<Category[]>>(
      `${API_BASE_URL}/categories`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createCategory(
    payload: CreateCategoryRequest,
    token: string
  ): Promise<Category> {
    const response = await request<ApiResponse<Category>>(
      `${API_BASE_URL}/categories`,
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

  async updateCategory(
    categoryId: string,
    payload: UpdateCategoryRequest,
    token: string
  ): Promise<Category> {
    const response = await request<ApiResponse<Category>>(
      `${API_BASE_URL}/categories/${categoryId}`,
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

  async deleteCategory(categoryId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/categories/${categoryId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};

export default categoriesService;
