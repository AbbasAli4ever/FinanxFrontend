export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type BillingMethod = "FIXED_PRICE" | "TIME_AND_MATERIALS" | "NON_BILLABLE";
export type TimeEntryStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "INVOICED";

export interface ProjectStatusInfo {
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowComplete: boolean;
  allowHold: boolean;
  allowCancel: boolean;
  allowReactivate: boolean;
}

export interface ProjectCustomer {
  id: string;
  displayName: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string | null;
  hourlyRate: number | null;
}

export interface ProjectStats {
  totalTimeEntries: number;
  totalLoggedHours: number;
  totalAmount: number;
  billableHours: number;
  billableAmount: number;
  budgetHoursUsed: number | null;
  budgetAmountUsed: number | null;
}

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  billingMethod: BillingMethod;
  startDate: string | null;
  endDate: string | null;
  budgetAmount: number | null;
  budgetHours: number | null;
  hourlyRate: number | null;
  color: string | null;
  customer: ProjectCustomer | null;
  createdAt: string;
  updatedAt: string;
  // List view extra fields
  timeEntryCount?: number;
  teamMemberCount?: number;
  totalLoggedHours?: number;
  totalBilledAmount?: number;
}

export interface ProjectDetail extends Project {
  teamMembers: TeamMember[];
  stats: ProjectStats;
}

export interface ProjectProfitability {
  projectNumber: string;
  projectName: string;
  billingMethod: string;
  budgetAmount: number | null;
  budgetHours: number | null;
  revenue: { total: number; invoiceCount: number };
  cost: {
    total: number;
    labor: number;
    laborHours: number;
    timeEntryCount: number;
    expenses: number;
    expenseCount: number;
  };
  profit: number;
  margin: number;
}

export interface ProjectSummary {
  byStatus: Record<string, number>;
  totalProjects: number;
  totalLoggedHours: number;
  totalBilledAmount: number;
}

export interface ProjectListResponse {
  items: Project[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  customerId?: string;
  projectNumber?: string;
  billingMethod?: BillingMethod;
  startDate?: string;
  endDate?: string;
  budgetAmount?: number;
  budgetHours?: number;
  hourlyRate?: number;
  color?: string;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export interface AddTeamMemberRequest {
  userId: string;
  role?: string;
  hourlyRate?: number;
}

export interface UpdateTeamMemberRequest {
  role?: string;
  hourlyRate?: number;
}

// ── Time Entries ────────────────────────────────────────────────

export interface TimeEntryProject {
  id: string;
  projectNumber: string;
  name: string;
}

export interface TimeEntryUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  project: TimeEntryProject | null;
  userId: string;
  user: TimeEntryUser | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  description: string | null;
  notes: string | null;
  isBillable: boolean;
  hourlyRate: number;
  totalAmount: number;
  status: TimeEntryStatus;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  invoiceId: string | null;
  invoice: { id: string; invoiceNumber: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryListResponse {
  items: TimeEntry[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreateTimeEntryRequest {
  projectId: string;
  date: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  notes?: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

export type UpdateTimeEntryRequest = Partial<CreateTimeEntryRequest>;

export interface TimeEntryFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  userId?: string;
  status?: TimeEntryStatus | "";
  startDate?: string;
  endDate?: string;
  isBillable?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
