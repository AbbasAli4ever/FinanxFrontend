import { API_BASE_URL, request } from "./apiClient";
import type {
  FinancialOverview,
  RevenueTrend,
  InvoiceAnalytics,
  BillAnalytics,
  TopCustomersData,
  TopVendorsData,
  CashFlowOverview,
  ExpenseBreakdown,
  InventoryStats,
  ProjectOverview,
  RecentActivity,
  PeriodComparison,
  PeriodParams,
} from "@/types/dashboard";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

function periodToQuery(p: PeriodParams & { limit?: number }): string {
  const qs = new URLSearchParams();
  if (p.period) qs.set("period", p.period);
  if (p.startDate) qs.set("startDate", p.startDate);
  if (p.endDate) qs.set("endDate", p.endDate);
  if (p.limit !== undefined) qs.set("limit", String(p.limit));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const dashboardService = {
  /** GET /dashboard/financial-overview */
  async getFinancialOverview(params: PeriodParams, token: string): Promise<FinancialOverview> {
    const res = await request<ApiResponse<FinancialOverview>>(
      `${API_BASE_URL}/dashboard/financial-overview${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/revenue-expense-trend */
  async getRevenueTrend(params: PeriodParams, token: string): Promise<RevenueTrend> {
    const res = await request<ApiResponse<RevenueTrend>>(
      `${API_BASE_URL}/dashboard/revenue-expense-trend${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/invoice-analytics */
  async getInvoiceAnalytics(params: PeriodParams, token: string): Promise<InvoiceAnalytics> {
    const res = await request<ApiResponse<InvoiceAnalytics>>(
      `${API_BASE_URL}/dashboard/invoice-analytics${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/bill-analytics */
  async getBillAnalytics(params: PeriodParams, token: string): Promise<BillAnalytics> {
    const res = await request<ApiResponse<BillAnalytics>>(
      `${API_BASE_URL}/dashboard/bill-analytics${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/top-customers */
  async getTopCustomers(params: PeriodParams & { limit?: number }, token: string): Promise<TopCustomersData> {
    const res = await request<ApiResponse<TopCustomersData>>(
      `${API_BASE_URL}/dashboard/top-customers${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/top-vendors */
  async getTopVendors(params: PeriodParams & { limit?: number }, token: string): Promise<TopVendorsData> {
    const res = await request<ApiResponse<TopVendorsData>>(
      `${API_BASE_URL}/dashboard/top-vendors${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/cash-flow-overview (period-independent) */
  async getCashFlow(token: string): Promise<CashFlowOverview> {
    const res = await request<ApiResponse<CashFlowOverview>>(
      `${API_BASE_URL}/dashboard/cash-flow-overview`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/expense-breakdown */
  async getExpenseBreakdown(params: PeriodParams, token: string): Promise<ExpenseBreakdown> {
    const res = await request<ApiResponse<ExpenseBreakdown>>(
      `${API_BASE_URL}/dashboard/expense-breakdown${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/inventory-stats (period-independent) */
  async getInventoryStats(limit: number | undefined, token: string): Promise<InventoryStats> {
    const q = limit ? `?limit=${limit}` : "";
    const res = await request<ApiResponse<InventoryStats>>(
      `${API_BASE_URL}/dashboard/inventory-stats${q}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/project-overview (period-independent) */
  async getProjectOverview(token: string): Promise<ProjectOverview> {
    const res = await request<ApiResponse<ProjectOverview>>(
      `${API_BASE_URL}/dashboard/project-overview`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/recent-activity (period-independent) */
  async getRecentActivity(limit: number | undefined, token: string): Promise<RecentActivity> {
    const q = limit ? `?limit=${limit}` : "";
    const res = await request<ApiResponse<RecentActivity>>(
      `${API_BASE_URL}/dashboard/recent-activity${q}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /dashboard/period-comparison */
  async getPeriodComparison(params: PeriodParams, token: string): Promise<PeriodComparison> {
    const res = await request<ApiResponse<PeriodComparison>>(
      `${API_BASE_URL}/dashboard/period-comparison${periodToQuery(params)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};

export default dashboardService;
