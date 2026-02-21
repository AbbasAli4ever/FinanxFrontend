import {
  AcceptInvitationRequest,
  ChangePasswordRequest,
  InviteUserRequest,
  InviteUserResponse,
  Invitation,
  UpdateUserRequest,
  User,
  UserDetails,
} from "@/types/users";
import { API_BASE_URL, JSON_HEADERS, request } from "@/services/apiClient";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const withAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const usersService = {
  async getAllUsers(token: string): Promise<User[]> {
    const response = await request<ApiResponse<User[]>>(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: withAuthHeader(token),
    });
    return response.data;
  },

  async getPendingInvitations(token: string): Promise<Invitation[]> {
    const response = await request<ApiResponse<Invitation[]>>(
      `${API_BASE_URL}/users/invitations/pending`,
      {
        method: "GET",
        headers: withAuthHeader(token),
      }
    );
    return response.data;
  },

  async inviteUser(
    payload: InviteUserRequest,
    token: string
  ): Promise<InviteUserResponse> {
    const response = await request<ApiResponse<InviteUserResponse>>(
      `${API_BASE_URL}/users/invite`,
      {
        method: "POST",
        headers: {
          ...withAuthHeader(token),
          ...JSON_HEADERS,
        },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async cancelInvitation(invitationId: string, token: string) {
    const response = await request<ApiResponse<null>>(
      `${API_BASE_URL}/users/invitations/${invitationId}/cancel`,
      {
        method: "PATCH",
        headers: withAuthHeader(token),
      }
    );
    return response;
  },

  async deactivateUser(userId: string, token: string) {
    const response = await request<ApiResponse<null>>(
      `${API_BASE_URL}/users/${userId}/deactivate`,
      {
        method: "PATCH",
        headers: withAuthHeader(token),
      }
    );
    return response;
  },

  async reactivateUser(userId: string, token: string) {
    const response = await request<ApiResponse<null>>(
      `${API_BASE_URL}/users/${userId}/reactivate`,
      {
        method: "PATCH",
        headers: withAuthHeader(token),
      }
    );
    return response;
  },

  async getUser(userId: string, token: string): Promise<UserDetails> {
    const response = await request<ApiResponse<UserDetails>>(
      `${API_BASE_URL}/users/${userId}`,
      {
        method: "GET",
        headers: withAuthHeader(token),
      }
    );
    return response.data;
  },

  async updateUser(
    userId: string,
    payload: UpdateUserRequest,
    token: string
  ): Promise<User> {
    const response = await request<ApiResponse<User>>(
      `${API_BASE_URL}/users/${userId}`,
      {
        method: "PATCH",
        headers: {
          ...withAuthHeader(token),
          ...JSON_HEADERS,
        },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async changePassword(
    payload: ChangePasswordRequest,
    token: string
  ): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/users/me/change-password`,
      {
        method: "POST",
        headers: {
          ...withAuthHeader(token),
          ...JSON_HEADERS,
        },
        body: JSON.stringify(payload),
      }
    );
  },

  async acceptInvitation(payload: AcceptInvitationRequest): Promise<UserDetails> {
    const response = await request<ApiResponse<UserDetails>>(
      `${API_BASE_URL}/users/accept-invitation`,
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },
};
