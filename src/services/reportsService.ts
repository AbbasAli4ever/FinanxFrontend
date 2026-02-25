import { API_BASE_URL, request } from "./apiClient";
import type {
  TrialBalanceResponse,
  AccountLedgerResponse,
  IncomeStatementResponse,
  BalanceSheetResponse,
} from "@/types/reports";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const reportsService = {
  /**
   * GET /api/v1/reports/trial-balance?asOfDate=YYYY-MM-DD
   */
  async getTrialBalance(
    filters: { asOfDate?: string },
    token: string
  ): Promise<TrialBalanceResponse> {
    const params = new URLSearchParams();
    if (filters.asOfDate) params.append("asOfDate", filters.asOfDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/trial-balance${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<TrialBalanceResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/account-ledger/:accountId?startDate=...&endDate=...
   */
  async getAccountLedger(
    accountId: string,
    filters: { startDate?: string; endDate?: string },
    token: string
  ): Promise<AccountLedgerResponse> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/account-ledger/${accountId}${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<AccountLedgerResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/income-statement?startDate=...&endDate=...
   */
  async getIncomeStatement(
    filters: { startDate?: string; endDate?: string },
    token: string
  ): Promise<IncomeStatementResponse> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/income-statement${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<IncomeStatementResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/balance-sheet?asOfDate=YYYY-MM-DD
   */
  async getBalanceSheet(
    filters: { asOfDate?: string },
    token: string
  ): Promise<BalanceSheetResponse> {
    const params = new URLSearchParams();
    if (filters.asOfDate) params.append("asOfDate", filters.asOfDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/balance-sheet${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<BalanceSheetResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default reportsService;
