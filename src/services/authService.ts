import {
  AuthResponse,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  MyCompaniesResponse,
  MyPermissionsResponse,
  RegisterRequest,
} from "@/types/auth";
import { API_BASE_URL, JSON_HEADERS, request } from "@/services/apiClient";

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export async function selectCompany(tempToken: string, companyId: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${API_BASE_URL}/auth/select-company`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ tempToken, companyId }),
  });
}

export async function getMyCompanies(token: string): Promise<MyCompaniesResponse> {
  return request<MyCompaniesResponse>(`${API_BASE_URL}/auth/my-companies`, {
    method: "GET",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function switchCompany(token: string, companyId: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${API_BASE_URL}/auth/switch-company`, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ companyId }),
  });
}

export async function createCompany(
  token: string,
  data: { companyName: string; companyEmail?: string }
): Promise<AuthResponse> {
  return request<AuthResponse>(`${API_BASE_URL}/auth/create-company`, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// export async function createCompanyWithTemp(
//   tempToken: string,
//   data: { companyName: string; companyEmail?: string }
// ): Promise<AuthResponse> {
//   return request<AuthResponse>(`${API_BASE_URL}/auth/create-company-with-temp`, {
//     method: "POST",
//     headers: JSON_HEADERS,
//     body: JSON.stringify({ tempToken, ...data }),
//   });
// }

export async function getMe(token: string): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyPermissions(token: string): Promise<MyPermissionsResponse> {
  return request<MyPermissionsResponse>(`${API_BASE_URL}/auth/my-permissions`, {
    method: "GET",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logout(refreshToken: string): Promise<void> {
  await request<unknown>(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ refreshToken }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
    `${API_BASE_URL}/auth/refresh`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ refreshToken }),
    }
  );
  return res.data;
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; data: { emailSent: boolean } }> {
  return request<{ success: boolean; message: string; data: { emailSent: boolean } }>(
    `${API_BASE_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email }),
    }
  );
}

export async function validateResetToken(token: string): Promise<{ success: boolean; data: { valid: boolean; email?: string } }> {
  return request<{ success: boolean; data: { valid: boolean; email?: string } }>(
    `${API_BASE_URL}/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
    }
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `${API_BASE_URL}/auth/reset-password`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ token, newPassword }),
    }
  );
}
