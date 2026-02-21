import { API_BASE_URL, request } from "./apiClient";
import { Permission } from "./rolesService";

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
  category?: string | null;
}

interface BackendPermissionsResponse {
  all: (BackendPermission & { category: string | null })[];
  grouped: Record<string, Omit<BackendPermission, 'category'>[]>;
}

interface PermissionsResponse {
  all: Permission[];
  byModule: Record<string, Permission[]>;
}

const permissionsService = {
  /**
   * Get all permissions grouped by category (displayed as modules in UI)
   */
  async getAllPermissions(token: string): Promise<PermissionsResponse> {
    const response = await request<ApiResponse<BackendPermissionsResponse>>(
      `${API_BASE_URL}/roles/permissions/all`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { all: allPermissions, grouped } = response.data;

    // Transform to frontend Permission format
    const all: Permission[] = allPermissions.map((perm) => ({
      id: perm.id,
      code: perm.code,
      name: perm.name,
      description: perm.description,
      module: {
        id: perm.category || 'other',
        code: perm.category || 'other',
        name: perm.category ? perm.category.charAt(0).toUpperCase() + perm.category.slice(1).replace(/_/g, ' ') : 'Other',
      },
    }));

    // Transform grouped by category to byModule format
    const byModule: Record<string, Permission[]> = {};
    Object.entries(grouped).forEach(([category, perms]) => {
      byModule[category] = perms.map((perm) => ({
        id: perm.id,
        code: perm.code,
        name: perm.name,
        description: perm.description,
        module: {
          id: category,
          code: category,
          name: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
        },
      }));
    });

    return {
      all,
      byModule,
    };
  },
};

export default permissionsService;
