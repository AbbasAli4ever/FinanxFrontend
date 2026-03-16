export interface Company {
  id: string;
  name: string;
}

export interface Role {
  code: string;
  name: string;
}

// Multi-company types
export interface CompanySelectionItem {
  companyId: string;
  companyName: string;
  userId: string;
  role: Role | null;
  isPrimaryAdmin: boolean;
  lastLoginAt: string | null;
}

export interface MyCompanyItem extends CompanySelectionItem {
  isCurrentCompany: boolean;
}

export interface CompanySelectionData {
  requiresCompanySelection: true;
  companies: CompanySelectionItem[];
  tempToken: string;
}

export interface CompanySelectionResponse {
  success: boolean;
  message: string;
  data: CompanySelectionData;
}

export type LoginResponse = AuthResponse | CompanySelectionResponse;

export interface MyCompaniesResponse {
  success: boolean;
  message: string;
  data: MyCompanyItem[];
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
