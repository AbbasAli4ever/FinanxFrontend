import { API_BASE_URL, request } from "./apiClient";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
} from "@/types/customers";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const customersService = {
  async getCustomers(
    filters: Partial<CustomerFilters>,
    token: string
  ): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.customerType) params.append("customerType", filters.customerType);
    if (filters.isActive) params.append("isActive", filters.isActive);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const query = params.toString();
    const url = `${API_BASE_URL}/customers${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<Customer[]>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createCustomer(
    payload: CreateCustomerRequest,
    token: string
  ): Promise<Customer> {
    const response = await request<ApiResponse<Customer>>(
      `${API_BASE_URL}/customers`,
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

  async updateCustomer(
    customerId: string,
    payload: UpdateCustomerRequest,
    token: string
  ): Promise<Customer> {
    const response = await request<ApiResponse<Customer>>(
      `${API_BASE_URL}/customers/${customerId}`,
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

  async deleteCustomer(customerId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/customers/${customerId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};

export default customersService;
