// Types based on DAY_7_COA_FRONTEND_INTEGRATION_GUIDE.md

export interface Account {
  id: string;
  accountNumber: string;
  name: string;
  description: string | null;
  accountType: string;
  detailType: string;
  normalBalance: "DEBIT" | "CREDIT";
  parentAccount: { id: string; name: string; accountNumber: string } | null;
  isSubAccount: boolean;
  depth: number;
  fullPath: string;
  currentBalance: number;
  isSystemAccount: boolean;
  isActive: boolean;
  displayOrder: number;
  subAccountsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountTreeNode {
  id: string;
  accountNumber: string;
  name: string;
  accountType: string;
  detailType: string;
  normalBalance: "DEBIT" | "CREDIT";
  currentBalance: number;
  isSystemAccount: boolean;
  isActive: boolean;
  depth: number;
  subAccountsCount?: number;
  children: AccountTreeNode[];
}

export type AccountTreeData = Record<string, AccountTreeNode[]>;

export interface AccountTypeInfo {
  value: string;
  label: string;
  group: string;
  normalBalance: "DEBIT" | "CREDIT";
  numberRange: string;
  isBalanceSheet: boolean;
  description: string;
  detailTypes: string[];
}

export interface AccountTypesData {
  all: AccountTypeInfo[];
  grouped: Record<string, AccountTypeInfo[]>;
  groups: string[];
}

export interface CreateAccountRequest {
  name: string;
  accountType: string;
  detailType: string;
  accountNumber?: string;
  description?: string;
  parentAccountId?: string;
  isSubAccount?: boolean;
}

export interface UpdateAccountRequest {
  name?: string;
  accountNumber?: string;
  description?: string;
  detailType?: string;
  isActive?: boolean;
}

export interface AccountFilters {
  accountType: string;
  search: string;
  isActive: string;
  sortBy: string;
  sortOrder: string;
}
