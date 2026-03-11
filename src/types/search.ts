export type EntityType =
  | "CUSTOMER"
  | "VENDOR"
  | "PRODUCT"
  | "ACCOUNT"
  | "INVOICE"
  | "BILL"
  | "EXPENSE"
  | "JOURNAL_ENTRY"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "ESTIMATE"
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "PROJECT";

export interface SearchResult {
  id: string;
  entityType: EntityType;
  title: string;
  subtitle: string | null;
  amount: number | null;
  status: string | null;
  date: string;
  url: string;
}

export interface GlobalSearchCategories {
  customers: number;
  vendors: number;
  products: number;
  accounts: number;
  invoices: number;
  bills: number;
  expenses: number;
  journalEntries: number;
  creditNotes: number;
  debitNotes: number;
  estimates: number;
  purchaseOrders: number;
  salesOrders: number;
  projects: number;
}

export interface GlobalSearchData {
  query: string;
  totalMatches: number;
  categories: GlobalSearchCategories;
  results: SearchResult[];
}

export interface QuickSearchData {
  query: string;
  results: SearchResult[];
}

export interface EntitySearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EntitySearchData {
  query: string;
  entityType: string;
  results: SearchResult[];
  pagination: EntitySearchPagination;
}

export type EntitySearchType =
  | "customer"
  | "vendor"
  | "product"
  | "account"
  | "invoice"
  | "bill"
  | "expense"
  | "journal_entry"
  | "credit_note"
  | "debit_note"
  | "estimate"
  | "purchase_order"
  | "sales_order"
  | "project";
