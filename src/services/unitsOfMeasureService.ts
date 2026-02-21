import { API_BASE_URL, request } from "./apiClient";
import type {
  UnitOfMeasure,
  CreateUnitOfMeasureRequest,
  UpdateUnitOfMeasureRequest,
} from "@/types/unitsOfMeasure";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const unitsOfMeasureService = {
  async getUnitsOfMeasure(token: string): Promise<UnitOfMeasure[]> {
    const response = await request<ApiResponse<UnitOfMeasure[]>>(
      `${API_BASE_URL}/units-of-measure`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createUnitOfMeasure(
    payload: CreateUnitOfMeasureRequest,
    token: string
  ): Promise<UnitOfMeasure> {
    const response = await request<ApiResponse<UnitOfMeasure>>(
      `${API_BASE_URL}/units-of-measure`,
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

  async updateUnitOfMeasure(
    id: string,
    payload: UpdateUnitOfMeasureRequest,
    token: string
  ): Promise<UnitOfMeasure> {
    const response = await request<ApiResponse<UnitOfMeasure>>(
      `${API_BASE_URL}/units-of-measure/${id}`,
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

  async deleteUnitOfMeasure(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/units-of-measure/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};

export default unitsOfMeasureService;
