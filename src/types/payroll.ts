// ─── Enums ────────────────────────────────────────────────────────────────────

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "TEMPORARY";
export type PayType = "SALARY" | "HOURLY";
export type PayFrequency = "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY";
export type TaxFilingStatus = "SINGLE" | "MARRIED" | "HEAD_OF_HOUSEHOLD";
export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";

export type PayRunStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "POSTED"
  | "PAID"
  | "VOID";

export type EarningType =
  | "REGULAR"
  | "OVERTIME"
  | "BONUS"
  | "COMMISSION"
  | "ALLOWANCE"
  | "OTHER";

export type DeductionType =
  | "FEDERAL_TAX"
  | "STATE_TAX"
  | "LOCAL_TAX"
  | "SOCIAL_SECURITY"
  | "MEDICARE"
  | "HEALTH_INSURANCE"
  | "RETIREMENT_401K"
  | "LOAN_REPAYMENT"
  | "UNION_DUES"
  | "GARNISHMENT"
  | "OTHER";

// ─── Employee ─────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  hireDate: string;
  terminationDate?: string;
  isActive: boolean;
  department?: string;
  jobTitle?: string;
  employmentType: EmploymentType;
  payType: PayType;
  payFrequency: PayFrequency;
  payRate: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  taxFilingStatus?: TaxFilingStatus;
  federalAllowances?: number;
  stateAllowances?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  department?: string;
  jobTitle?: string;
  employmentType: EmploymentType;
  payType: PayType;
  payFrequency: PayFrequency;
  payRate: number;
  isActive: boolean;
  hireDate: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  hireDate: string;
  employeeNumber?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  department?: string;
  jobTitle?: string;
  employmentType: EmploymentType;
  payType: PayType;
  payFrequency: PayFrequency;
  payRate: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  taxFilingStatus?: TaxFilingStatus;
  federalAllowances?: number;
  stateAllowances?: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  userId?: string;
}

export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest>;

export interface EmployeePayHistoryItem {
  id: string;
  payRun: {
    id: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    payFrequency: PayFrequency;
    status: PayRunStatus;
  };
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalEmployerTaxes: number;
  regularPay: number;
  overtimePay: number;
  bonusAndOther: number;
}

export interface EmployeePayHistoryResponse {
  items: EmployeePayHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Earnings & Deductions ────────────────────────────────────────────────────

export interface PayRunEarning {
  id: string;
  earningType: EarningType;
  description?: string;
  amount: number;
}

export interface PayRunDeduction {
  id: string;
  deductionType: DeductionType;
  amount: number;
  isEmployerContribution: boolean;
}

export interface CreateEarningRequest {
  earningType: EarningType;
  description?: string;
  amount: number;
}

export interface CreateDeductionRequest {
  deductionType: DeductionType;
  amount: number;
  isEmployerContribution?: boolean;
}

// ─── Pay Run Items ─────────────────────────────────────────────────────────────

export interface PayRunItem {
  id: string;
  payRunId: string;
  employee: {
    id: string;
    employeeNumber: string;
    fullName: string;
    department?: string;
    jobTitle?: string;
    payType: PayType;
    payRate: number;
  };
  regularHours: number;
  overtimeHours: number;
  overtimeRate: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  totalDeductions: number;
  totalEmployerTaxes: number;
  netPay: number;
  earnings: PayRunEarning[];
  deductions: PayRunDeduction[];
  notes?: string;
}

export interface CreatePayRunItemRequest {
  employeeId: string;
  regularHours?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  earnings?: CreateEarningRequest[];
  deductions?: CreateDeductionRequest[];
  notes?: string;
}

export interface UpdatePayRunItemRequest {
  regularHours?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  earnings?: CreateEarningRequest[];
  deductions?: CreateDeductionRequest[];
  notes?: string;
}

// ─── Pay Run ──────────────────────────────────────────────────────────────────

export interface PayRun {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  payFrequency: PayFrequency;
  status: PayRunStatus;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalEmployerTaxes: number;
  employeeCount: number;
  notes?: string;
  paymentAccountId?: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  postedAt?: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  items: PayRunItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PayRunListItem {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  payFrequency: PayFrequency;
  status: PayRunStatus;
  totalGrossPay: number;
  totalNetPay: number;
  employeeCount: number;
  notes?: string;
  createdAt: string;
}

export interface CreatePayRunRequest {
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  payFrequency: PayFrequency;
  paymentAccountId?: string;
  notes?: string;
}

export interface UpdatePayRunRequest {
  payDate?: string;
  notes?: string;
  paymentAccountId?: string;
}

// ─── Payslip ──────────────────────────────────────────────────────────────────

export interface Payslip {
  id: string;
  employee: {
    id: string;
    employeeNumber: string;
    fullName: string;
    department?: string;
    jobTitle?: string;
    email?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  payRun: {
    id: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    payFrequency: PayFrequency;
    status: PayRunStatus;
  };
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  totalDeductions: number;
  totalEmployerTaxes: number;
  netPay: number;
  earnings: PayRunEarning[];
  deductions: PayRunDeduction[];
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface PayrollSummaryReport {
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalEmployerTaxes: number;
  payRunCount: number;
  employeeCount: number;
  monthlyBreakdown: {
    month: string; // "2026-01"
    grossPay: number;
    netPay: number;
    employeeCount: number;
  }[];
  payRuns: PayRunListItem[];
}

export interface TaxLiabilityReport {
  totalEmployeeTax: number;
  totalEmployerTax: number;
  totalTax: number;
  byType: {
    deductionType: DeductionType;
    label: string;
    employeeAmount: number;
    employerAmount: number;
    totalAmount: number;
  }[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedEmployees {
  items: EmployeeListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedPayRuns {
  items: PayRunListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Filter params ────────────────────────────────────────────────────────────

export interface EmployeeFilters {
  page?: string;
  limit?: string;
  search?: string;
  employmentType?: EmploymentType;
  payType?: PayType;
  payFrequency?: PayFrequency;
  isActive?: string;
}

export interface PayRunFilters {
  page?: string;
  limit?: string;
  status?: PayRunStatus;
  payFrequency?: PayFrequency;
  startDate?: string;
  endDate?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
}
