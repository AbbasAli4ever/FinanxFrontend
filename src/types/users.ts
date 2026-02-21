export interface RoleSummary {
  id: string;
  code: string;
  name: string;
}

export interface InvitationRole {
  code: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: RoleSummary | null;
  isPrimaryAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  invitationAcceptedAt: string | null;
  createdAt: string;
}

export interface UserDetails extends User {
  company: {
    id: string;
    name: string;
  };
  permissions: string[];
}

export interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: InvitationRole;
  invitedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  message?: string;
}

export interface InviteUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: InvitationRole;
  invitationToken: string;
  invitedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  expiresAt: string;
  status: string;
  createdAt: string;
  emailSent: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AcceptInvitationRequest {
  invitationToken: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  roleId?: string;
  isActive?: boolean;
}
