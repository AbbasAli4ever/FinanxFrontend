import { API_BASE_URL, request } from "./apiClient";
import type {
  Project,
  ProjectDetail,
  ProjectListResponse,
  ProjectProfitability,
  ProjectSummary,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamMember,
} from "@/types/projects";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const projectsService = {
  /** GET /api/v1/projects */
  async getList(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      customerId?: string;
      billingMethod?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    },
    token: string
  ): Promise<ProjectListResponse> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.append(k, String(v));
    });
    const url = `${API_BASE_URL}/projects${q.toString() ? `?${q}` : ""}`;
    const res = await request<ApiResponse<ProjectListResponse>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /** POST /api/v1/projects */
  async create(body: CreateProjectRequest, token: string): Promise<Project> {
    const res = await request<ApiResponse<Project>>(
      `${API_BASE_URL}/projects`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** GET /api/v1/projects/:id */
  async getById(id: string, token: string): Promise<ProjectDetail> {
    const res = await request<ApiResponse<ProjectDetail>>(
      `${API_BASE_URL}/projects/${id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /** PATCH /api/v1/projects/:id */
  async update(
    id: string,
    body: UpdateProjectRequest,
    token: string
  ): Promise<Project> {
    const res = await request<ApiResponse<Project>>(
      `${API_BASE_URL}/projects/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** DELETE /api/v1/projects/:id */
  async delete(id: string, token: string): Promise<{ message: string }> {
    const res = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/projects/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /** PATCH /api/v1/projects/:id/status */
  async updateStatus(
    id: string,
    status: string,
    token: string
  ): Promise<Project> {
    const res = await request<ApiResponse<Project>>(
      `${API_BASE_URL}/projects/${id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );
    return res.data;
  },

  /** GET /api/v1/projects/:id/profitability */
  async getProfitability(
    id: string,
    token: string
  ): Promise<ProjectProfitability> {
    const res = await request<ApiResponse<ProjectProfitability>>(
      `${API_BASE_URL}/projects/${id}/profitability`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /** GET /api/v1/projects/summary */
  async getSummary(token: string): Promise<ProjectSummary> {
    const res = await request<ApiResponse<ProjectSummary>>(
      `${API_BASE_URL}/projects/summary`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  // ── Team Members ─────────────────────────────────────────────

  /** GET /api/v1/projects/:id/team */
  async getTeam(id: string, token: string): Promise<TeamMember[]> {
    const res = await request<ApiResponse<TeamMember[]>>(
      `${API_BASE_URL}/projects/${id}/team`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /** POST /api/v1/projects/:id/team */
  async addTeamMember(
    id: string,
    body: AddTeamMemberRequest,
    token: string
  ): Promise<TeamMember> {
    const res = await request<ApiResponse<TeamMember>>(
      `${API_BASE_URL}/projects/${id}/team`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** PATCH /api/v1/projects/:id/team/:userId */
  async updateTeamMember(
    id: string,
    userId: string,
    body: UpdateTeamMemberRequest,
    token: string
  ): Promise<TeamMember> {
    const res = await request<ApiResponse<TeamMember>>(
      `${API_BASE_URL}/projects/${id}/team/${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** DELETE /api/v1/projects/:id/team/:userId */
  async removeTeamMember(
    id: string,
    userId: string,
    token: string
  ): Promise<{ message: string }> {
    const res = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/projects/${id}/team/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },
};

export default projectsService;
