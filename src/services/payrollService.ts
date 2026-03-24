import { API_BASE_URL, request } from "./apiClient";
import type {
  Employee,
  EmployeeListItem,
  EmployeePayHistoryResponse,
  PaginatedEmployees,
  PaginatedPayRuns,
  PayRun,
  PayRunListItem,
  PayRunItem,
  Payslip,
  PayrollSummaryReport,
  TaxLiabilityReport,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CreatePayRunRequest,
  UpdatePayRunRequest,
  CreatePayRunItemRequest,
  UpdatePayRunItemRequest,
  EmployeeFilters,
  PayRunFilters,
  ReportFilters,
} from "@/types/payroll";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const payrollService = {
  // ─── Employees ──────────────────────────────────────────────────────────────

  async getEmployees(
    filters: EmployeeFilters,
    token: string
  ): Promise<PaginatedEmployees> {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    if (filters.search) params.set("search", filters.search);
    if (filters.employmentType) params.set("employmentType", filters.employmentType);
    if (filters.payType) params.set("payType", filters.payType);
    if (filters.payFrequency) params.set("payFrequency", filters.payFrequency);
    if (filters.isActive !== undefined) params.set("isActive", filters.isActive);

    const qs = params.toString();
    const res = await request<ApiResponse<PaginatedEmployees | EmployeeListItem[]>>(
      `${API_BASE_URL}/payroll/employees${qs ? `?${qs}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Normalize: backend may return paginated or flat array
    const raw = res.data;
    if (Array.isArray(raw)) {
      return { items: raw, pagination: { total: raw.length, page: 1, limit: raw.length, totalPages: 1 } };
    }
    return raw as PaginatedEmployees;
  },

  async getEmployee(id: string, token: string): Promise<Employee> {
    const res = await request<ApiResponse<Employee>>(
      `${API_BASE_URL}/payroll/employees/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async createEmployee(
    payload: CreateEmployeeRequest,
    token: string
  ): Promise<Employee> {
    const res = await request<ApiResponse<Employee>>(
      `${API_BASE_URL}/payroll/employees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async updateEmployee(
    id: string,
    payload: UpdateEmployeeRequest,
    token: string
  ): Promise<Employee> {
    const res = await request<ApiResponse<Employee>>(
      `${API_BASE_URL}/payroll/employees/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async deactivateEmployee(id: string, token: string): Promise<void> {
    await request<ApiResponse<void>>(
      `${API_BASE_URL}/payroll/employees/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async getEmployeePayHistory(
    id: string,
    page: number,
    limit: number,
    token: string
  ): Promise<EmployeePayHistoryResponse> {
    const res = await request<ApiResponse<EmployeePayHistoryResponse>>(
      `${API_BASE_URL}/payroll/employees/${id}/pay-history?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async linkUser(
    employeeId: string,
    userId: string,
    token: string
  ): Promise<Employee> {
    const res = await request<ApiResponse<Employee>>(
      `${API_BASE_URL}/payroll/employees/${employeeId}/link-user`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );
    return res.data;
  },

  async unlinkUser(employeeId: string, token: string): Promise<Employee> {
    const res = await request<ApiResponse<Employee>>(
      `${API_BASE_URL}/payroll/employees/${employeeId}/link-user`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  // ─── Pay Runs ────────────────────────────────────────────────────────────────

  async getPayRuns(
    filters: PayRunFilters,
    token: string
  ): Promise<PaginatedPayRuns> {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    if (filters.status) params.set("status", filters.status);
    if (filters.payFrequency) params.set("payFrequency", filters.payFrequency);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    const qs = params.toString();
    const res = await request<ApiResponse<PaginatedPayRuns | PayRunListItem[]>>(
      `${API_BASE_URL}/payroll/pay-runs${qs ? `?${qs}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const raw = res.data;
    if (Array.isArray(raw)) {
      return { items: raw, pagination: { total: raw.length, page: 1, limit: raw.length, totalPages: 1 } };
    }
    return raw as PaginatedPayRuns;
  },

  async getPayRun(id: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async createPayRun(
    payload: CreatePayRunRequest,
    token: string
  ): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async updatePayRun(
    id: string,
    payload: UpdatePayRunRequest,
    token: string
  ): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async deletePayRun(id: string, token: string): Promise<void> {
    await request<ApiResponse<void>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  // ─── Pay Run Items ───────────────────────────────────────────────────────────

  async generatePayRunItems(payRunId: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${payRunId}/generate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  async addPayRunItem(
    payRunId: string,
    payload: CreatePayRunItemRequest,
    token: string
  ): Promise<PayRunItem> {
    const res = await request<ApiResponse<PayRunItem>>(
      `${API_BASE_URL}/payroll/pay-runs/${payRunId}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async updatePayRunItem(
    payRunId: string,
    itemId: string,
    payload: UpdatePayRunItemRequest,
    token: string
  ): Promise<PayRunItem> {
    const res = await request<ApiResponse<PayRunItem>>(
      `${API_BASE_URL}/payroll/pay-runs/${payRunId}/items/${itemId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async removePayRunItem(
    payRunId: string,
    itemId: string,
    token: string
  ): Promise<void> {
    await request<ApiResponse<void>>(
      `${API_BASE_URL}/payroll/pay-runs/${payRunId}/items/${itemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  async submitPayRun(id: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  async approvePayRun(id: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  async rejectPayRun(
    id: string,
    reason: string,
    token: string
  ): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  async postPayRun(id: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}/post`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  async markPaidPayRun(id: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}/mark-paid`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  async voidPayRun(id: string, reason: string, token: string): Promise<PayRun> {
    const res = await request<ApiResponse<PayRun>>(
      `${API_BASE_URL}/payroll/pay-runs/${id}/void`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  // ─── Payslips ────────────────────────────────────────────────────────────────

  async getPayslips(payRunId: string, token: string): Promise<Payslip[]> {
    const res = await request<ApiResponse<Payslip[]>>(
      `${API_BASE_URL}/payroll/pay-runs/${payRunId}/payslips`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async getPayslip(itemId: string, token: string): Promise<Payslip> {
    const res = await request<ApiResponse<Payslip>>(
      `${API_BASE_URL}/payroll/payslips/${itemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  // ─── Reports ─────────────────────────────────────────────────────────────────

  async getPayrollSummary(
    filters: ReportFilters,
    token: string
  ): Promise<PayrollSummaryReport> {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
    const res = await request<ApiResponse<PayrollSummaryReport>>(
      `${API_BASE_URL}/payroll/reports/summary?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const raw = res.data as unknown as Record<string, unknown>;
    return {
      totalGrossPay: Number(raw.totalGrossPay ?? 0),
      totalNetPay: Number(raw.totalNetPay ?? 0),
      totalDeductions: Number(raw.totalDeductions ?? 0),
      totalEmployerTaxes: Number(raw.totalEmployerTaxes ?? 0),
      payRunCount: Number(raw.payRunCount ?? raw.payRunsCount ?? raw.totalPayRuns ?? 0),
      employeeCount: Number(raw.employeeCount ?? raw.totalEmployees ?? raw.employeesPaid ?? 0),
      monthlyBreakdown: Array.isArray(raw.monthlyBreakdown) ? (raw.monthlyBreakdown as PayrollSummaryReport["monthlyBreakdown"]) : [],
      payRuns: Array.isArray(raw.payRuns) ? (raw.payRuns as PayRunListItem[]) : [],
    };
  },

  async getTaxLiability(
    filters: ReportFilters,
    token: string
  ): Promise<TaxLiabilityReport> {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
    const res = await request<ApiResponse<TaxLiabilityReport>>(
      `${API_BASE_URL}/payroll/reports/tax-liability?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};

export default payrollService;
