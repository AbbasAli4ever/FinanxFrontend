import { API_BASE_URL, request } from "./apiClient";

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: {
    id: string;
    code: string;
    name: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  userCount: number;
  createdAt: string;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface PermissionsGrouped {
  all: Permission[];
  grouped: Record<string, Permission[]>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface BackendPermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface BackendRole {
  id: string;
  code?: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  usersCount?: number;
  createdAt: string;
  permissions: BackendPermission[];
}

// Transform backend permission to frontend Permission
const transformPermission = (perm: BackendPermission): Permission => ({
  id: perm.id,
  code: perm.code,
  name: perm.name,
  description: perm.description,
  module: {
    id: perm.category || 'other',
    code: perm.category || 'other',
    name: perm.category ? perm.category.charAt(0).toUpperCase() + perm.category.slice(1).replace(/_/g, ' ') : 'Other',
  },
});

// Transform backend role to frontend Role
const transformRole = (role: BackendRole): Role => ({
  id: role.id,
  name: role.name,
  description: role.description,
  isSystemRole: role.isSystemRole,
  userCount: role.usersCount || 0,
  createdAt: role.createdAt,
  permissions: role.permissions.map(transformPermission),
});

const rolesService = {
  /**
   * Get all roles for the organization
   */
  async getAllRoles(token: string): Promise<Role[]> {
    const response = await request<ApiResponse<BackendRole[]>>(`${API_BASE_URL}/roles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.map(transformRole);
  },

  /**
   * Get single role by ID
   */
  async getRole(roleId: string, token: string): Promise<Role> {
    const response = await request<ApiResponse<BackendRole>>(
      `${API_BASE_URL}/roles/${roleId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return transformRole(response.data);
  },

  /**
   * Create a new custom role
   */
  async createRole(
    payload: CreateRoleRequest,
    token: string
  ): Promise<Role> {
    const response = await request<ApiResponse<Role>>(`${API_BASE_URL}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Update an existing custom role
   */
  async updateRole(
    roleId: string,
    payload: UpdateRoleRequest,
    token: string
  ): Promise<Role> {
    const response = await request<ApiResponse<Role>>(
      `${API_BASE_URL}/roles/${roleId}`,
      {
        method: "PUT",
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
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
    token: string
  ): Promise<Role> {
    const response = await request<ApiResponse<Role>>(
      `${API_BASE_URL}/roles/${roleId}/permissions`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissionIds }),
      }
    );
    return response.data;
  },

  /**
   * Delete a custom role
   */
  async deleteRole(roleId: string, token: string): Promise<void> {
    await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

export default rolesService;
