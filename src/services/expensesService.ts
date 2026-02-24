import { API_BASE_URL, request } from "./apiClient";
import type {
  Expense,
  ExpenseListItem,
  ExpenseSummary,
  ExpenseStatusInfo,
  ExpenseFilters,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  MarkPaidRequest,
  RejectExpenseRequest,
  VoidExpenseRequest,
} from "@/types/expenses";
import type { PaginatedResponse } from "@/types/products";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const expensesService = {
  async getSummary(token: string): Promise<ExpenseSummary> {
    const response = await request<ApiResponse<ExpenseSummary>>(
      `${API_BASE_URL}/expenses/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getNextNumber(token: string): Promise<{ nextExpenseNumber: string }> {
    const response = await request<
      ApiResponse<{ nextExpenseNumber: string }>
    >(`${API_BASE_URL}/expenses/next-number`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getStatuses(
    token: string
  ): Promise<Record<string, ExpenseStatusInfo>> {
    const response = await request<
      ApiResponse<Record<string, ExpenseStatusInfo>>
    >(`${API_BASE_URL}/expenses/statuses`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getRecurringFrequencies(
    token: string
  ): Promise<{ value: string; label: string }[]> {
    const response = await request<
      ApiResponse<{ value: string; label: string }[]>
    >(`${API_BASE_URL}/expenses/recurring-frequencies`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getExpenses(
    filters: Partial<ExpenseFilters>,
    token: string
  ): Promise<PaginatedResponse<ExpenseListItem>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.vendorId) params.append("vendorId", filters.vendorId);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.expenseAccountId) params.append("expenseAccountId", filters.expenseAccountId);
    if (filters.isBillable) params.append("isBillable", filters.isBillable);
    if (filters.isReimbursable) params.append("isReimbursable", filters.isReimbursable);
    if (filters.isMileage) params.append("isMileage", filters.isMileage);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.amountMin) params.append("amountMin", filters.amountMin);
    if (filters.amountMax) params.append("amountMax", filters.amountMax);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const url = `${API_BASE_URL}/expenses${query ? `?${query}` : ""}`;

    const response = await request<
      ApiResponse<PaginatedResponse<ExpenseListItem>>
    >(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getExpense(expenseId: string, token: string): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createExpense(
    payload: CreateExpenseRequest,
    token: string
  ): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses`,
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

  async updateExpense(
    expenseId: string,
    payload: UpdateExpenseRequest,
    token: string
  ): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}`,
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

  async deleteExpense(expenseId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/expenses/${expenseId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async submitExpense(expenseId: string, token: string): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async approveExpense(expenseId: string, token: string): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async rejectExpense(
    expenseId: string,
    payload: RejectExpenseRequest,
    token: string
  ): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}/reject`,
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

  async markPaid(
    expenseId: string,
    payload: MarkPaidRequest,
    token: string
  ): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}/mark-paid`,
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

  async voidExpense(
    expenseId: string,
    payload: VoidExpenseRequest,
    token: string
  ): Promise<Expense> {
    const response = await request<ApiResponse<Expense>>(
      `${API_BASE_URL}/expenses/${expenseId}/void`,
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
};

export default expensesService;
