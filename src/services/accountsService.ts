import { API_BASE_URL, request } from "./apiClient";
import type {
  Account,
  AccountTreeData,
  AccountTypesData,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountFilters,
} from "@/types/accounts";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const accountsService = {
  /**
   * GET /api/v1/accounts — Flat list with filters
   */
  async getAccounts(
    filters: Partial<AccountFilters>,
    token: string
  ): Promise<Account[]> {
    const params = new URLSearchParams();
    if (filters.accountType) params.append("accountType", filters.accountType);
    if (filters.search) params.append("search", filters.search);
    if (filters.isActive) params.append("isActive", filters.isActive);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const query = params.toString();
    const url = `${API_BASE_URL}/accounts${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<Account[]>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/accounts/tree — Hierarchical tree grouped by type group
   */
  async getAccountTree(
    filters: Partial<Pick<AccountFilters, "accountType">>,
    token: string
  ): Promise<AccountTreeData> {
    const params = new URLSearchParams();
    if (filters.accountType) params.append("accountType", filters.accountType);

    const query = params.toString();
    const url = `${API_BASE_URL}/accounts/tree${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<AccountTreeData>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/accounts/types — Account types for dropdowns
   */
  async getAccountTypes(token: string): Promise<AccountTypesData> {
    const response = await request<ApiResponse<AccountTypesData>>(
      `${API_BASE_URL}/accounts/types`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  /**
   * POST /api/v1/accounts — Create account
   */
  async createAccount(
    payload: CreateAccountRequest,
    token: string
  ): Promise<Account> {
    const response = await request<ApiResponse<Account>>(
      `${API_BASE_URL}/accounts`,
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

  /**
   * PATCH /api/v1/accounts/:id — Update account
   * Note: accountType and normalBalance CANNOT be changed
   */
  async updateAccount(
    accountId: string,
    payload: UpdateAccountRequest,
    token: string
  ): Promise<Account> {
    const response = await request<ApiResponse<Account>>(
      `${API_BASE_URL}/accounts/${accountId}`,
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

  /**
   * DELETE /api/v1/accounts/:id — Delete account
   */
  async deleteAccount(accountId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/accounts/${accountId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};

export default accountsService;
