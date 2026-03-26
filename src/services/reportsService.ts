import { API_BASE_URL, request } from "./apiClient";
import type {
  TrialBalanceResponse,
  AccountLedgerResponse,
  IncomeStatementResponse,
  BalanceSheetResponse,
  CashFlowStatement,
  ArAgingReport,
  ApAgingReport,
  SalesByCustomerReport,
  PurchasesByVendorReport,
  ExpenseByCategoryReport,
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

  /**
   * GET /api/v1/reports/cash-flow-statement?startDate=...&endDate=...
   */
  async getCashFlowStatement(
    filters: { startDate?: string; endDate?: string },
    token: string
  ): Promise<CashFlowStatement> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/cash-flow-statement${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<CashFlowStatement>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/ar-aging?asOfDate=YYYY-MM-DD
   */
  async getArAging(
    filters: { asOfDate?: string },
    token: string
  ): Promise<ArAgingReport> {
    const params = new URLSearchParams();
    if (filters.asOfDate) params.append("asOfDate", filters.asOfDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/ar-aging${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<ArAgingReport>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/ap-aging?asOfDate=YYYY-MM-DD
   */
  async getApAging(
    filters: { asOfDate?: string },
    token: string
  ): Promise<ApAgingReport> {
    const params = new URLSearchParams();
    if (filters.asOfDate) params.append("asOfDate", filters.asOfDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/ap-aging${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<ApAgingReport>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/sales-by-customer?startDate=...&endDate=...
   */
  async getSalesByCustomer(
    filters: { startDate?: string; endDate?: string },
    token: string
  ): Promise<SalesByCustomerReport> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/sales-by-customer${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<SalesByCustomerReport>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/purchases-by-vendor?startDate=...&endDate=...
   */
  async getPurchasesByVendor(
    filters: { startDate?: string; endDate?: string },
    token: string
  ): Promise<PurchasesByVendorReport> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/purchases-by-vendor${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<PurchasesByVendorReport>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * GET /api/v1/reports/expense-by-category?startDate=...&endDate=...
   */
  async getExpenseByCategory(
    filters: { startDate?: string; endDate?: string },
    token: string
  ): Promise<ExpenseByCategoryReport> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/expense-by-category${query ? `?${query}` : ""}`;

    const response = await request<ApiResponse<ExpenseByCategoryReport>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  /**
   * Export a report as PDF or Excel.
   * Returns a Blob that can be downloaded by the browser.
   */
  async exportReport(
    reportType: string,
    format: "pdf" | "excel",
    filters: Record<string, string>,
    token: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.append(key, value);
    }

    const query = params.toString();
    const url = `${API_BASE_URL}/reports/${reportType}/export/${format}${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  },
};

export default reportsService;
