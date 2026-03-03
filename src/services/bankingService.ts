import { API_BASE_URL, request } from "./apiClient";
import type {
  BankAccount,
  BankAccountDetail,
  BankTransaction,
  TransactionFilters,
  UpsertBankDetailRequest,
  CreateTransactionRequest,
  ImportTransactionItem,
  ImportResult,
  MatchRequest,
  StartReconciliationRequest,
  CompleteReconciliationRequest,
  BankReconciliation,
  TransferRequest,
  TransferResult,
  PaginatedTransactions,
} from "@/types/banking";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const bankingService = {
  // 1. List bank accounts
  async getAccounts(token: string): Promise<BankAccount[]> {
    const response = await request<ApiResponse<BankAccount[]>>(
      `${API_BASE_URL}/banking/accounts`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 2. Get single bank account (with recent transactions + unmatched count)
  async getAccount(id: string, token: string): Promise<BankAccountDetail> {
    const response = await request<ApiResponse<BankAccountDetail>>(
      `${API_BASE_URL}/banking/accounts/${id}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 3. Upsert bank detail (add/update institution metadata)
  async upsertBankDetail(
    id: string,
    payload: UpsertBankDetailRequest,
    token: string
  ): Promise<void> {
    await request<ApiResponse<unknown>>(
      `${API_BASE_URL}/banking/accounts/${id}/details`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  },

  // 4. List transactions (paginated + filtered)
  async getTransactions(
    accountId: string,
    filters: TransactionFilters,
    token: string
  ): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    const qs = params.toString();
    const response = await request<ApiResponse<PaginatedTransactions>>(
      `${API_BASE_URL}/banking/accounts/${accountId}/transactions${qs ? `?${qs}` : ""}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 5. Create manual transaction
  async createTransaction(
    accountId: string,
    payload: CreateTransactionRequest,
    token: string
  ): Promise<BankTransaction> {
    const response = await request<ApiResponse<BankTransaction>>(
      `${API_BASE_URL}/banking/accounts/${accountId}/transactions`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  // 6. Import bank transactions (CSV batch)
  async importTransactions(
    accountId: string,
    transactions: ImportTransactionItem[],
    token: string
  ): Promise<ImportResult> {
    const response = await request<ApiResponse<ImportResult>>(
      `${API_BASE_URL}/banking/accounts/${accountId}/import`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      }
    );
    return response.data;
  },

  // 7. Update transaction
  async updateTransaction(
    txnId: string,
    payload: Partial<CreateTransactionRequest>,
    token: string
  ): Promise<BankTransaction> {
    const response = await request<ApiResponse<BankTransaction>>(
      `${API_BASE_URL}/banking/transactions/${txnId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  // 8. Delete transaction
  async deleteTransaction(txnId: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/banking/transactions/${txnId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
  },

  // 9. Match transaction to journal entry
  async matchTransaction(
    txnId: string,
    payload: MatchRequest,
    token: string
  ): Promise<BankTransaction> {
    const response = await request<ApiResponse<BankTransaction>>(
      `${API_BASE_URL}/banking/transactions/${txnId}/match`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  // 10. Unmatch transaction
  async unmatchTransaction(txnId: string, token: string): Promise<BankTransaction> {
    const response = await request<ApiResponse<BankTransaction>>(
      `${API_BASE_URL}/banking/transactions/${txnId}/unmatch`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    return response.data;
  },

  // 11. Start reconciliation
  async startReconciliation(
    accountId: string,
    payload: StartReconciliationRequest,
    token: string
  ): Promise<BankReconciliation> {
    const response = await request<ApiResponse<BankReconciliation>>(
      `${API_BASE_URL}/banking/accounts/${accountId}/reconcile/start`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  // 12. Get reconciliation details
  async getReconciliation(reconId: string, token: string): Promise<BankReconciliation> {
    const response = await request<ApiResponse<BankReconciliation>>(
      `${API_BASE_URL}/banking/reconciliations/${reconId}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 13. Complete reconciliation
  async completeReconciliation(
    reconId: string,
    payload: CompleteReconciliationRequest,
    token: string
  ): Promise<{ id: string; status: string; clearedCount: number; statementBalance: number; message: string }> {
    const response = await request<ApiResponse<{ id: string; status: string; clearedCount: number; statementBalance: number; message: string }>>(
      `${API_BASE_URL}/banking/reconciliations/${reconId}/complete`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  // 14. Transfer between accounts
  async transfer(
    sourceAccountId: string,
    payload: TransferRequest,
    token: string
  ): Promise<TransferResult> {
    const response = await request<ApiResponse<TransferResult>>(
      `${API_BASE_URL}/banking/accounts/${sourceAccountId}/transfer`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },
};

export default bankingService;
