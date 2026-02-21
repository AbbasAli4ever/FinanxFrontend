export interface Company {
  id: string;
  name: string;
}

export interface Role {
  code: string;
  name: string;
}

export interface RegisterRequest {
  company: {
    name: string;
    email?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPrimaryAdmin: boolean;
  role: Role | null;
  company?: Company;
  permissions?: string[];
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  company: Company;
  permissions: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthData;
}

export interface CurrentUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPrimaryAdmin: boolean;
  role: Role | null;
  company: Company;
  permissions: string[];
}

export interface CurrentUserResponse {
  success: boolean;
  message: string;
  data: CurrentUserData;
}

export interface MyPermissionsData {
  permissions: string[];
  isPrimaryAdmin: boolean;
  role: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface MyPermissionsResponse {
  success: boolean;
  message: string;
  data: MyPermissionsData;
}
