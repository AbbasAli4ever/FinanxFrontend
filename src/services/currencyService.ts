import { API_BASE_URL, request } from "./apiClient";
import type {
  Currency,
  SupportedCurrency,
  ExchangeRate,
  ExchangeRateListResponse,
  ConversionResult,
  LiveRate,
  SyncResult,
  CreateCurrencyPayload,
  UpdateCurrencyPayload,
  CreateExchangeRatePayload,
  BulkExchangeRatesPayload,
  ExchangeRateQuery,
} from "@/types/currency";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const currencyService = {
  /** GET /api/v1/currencies — Company enabled currencies */
  async getList(token: string): Promise<Currency[]> {
    const res = await request<ApiResponse<Currency[] | { currencies: Currency[] }>>(
      `${API_BASE_URL}/currencies`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return Array.isArray(res.data) ? res.data : (res.data as { currencies: Currency[] }).currencies ?? [];
  },

  /** GET /api/v1/currencies/supported — All 30 ISO currencies */
  async getSupported(token: string): Promise<SupportedCurrency[]> {
    const res = await request<ApiResponse<SupportedCurrency[] | { currencies: SupportedCurrency[] }>>(
      `${API_BASE_URL}/currencies/supported`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return Array.isArray(res.data) ? res.data : (res.data as { currencies: SupportedCurrency[] }).currencies ?? [];
  },

  /** GET /api/v1/currencies/base */
  async getBase(token: string): Promise<Currency> {
    const res = await request<ApiResponse<Currency>>(
      `${API_BASE_URL}/currencies/base`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** POST /api/v1/currencies — Enable a currency */
  async enable(body: CreateCurrencyPayload, token: string): Promise<Currency> {
    const res = await request<ApiResponse<Currency>>(
      `${API_BASE_URL}/currencies`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** PATCH /api/v1/currencies/:id */
  async update(id: string, body: UpdateCurrencyPayload, token: string): Promise<Currency> {
    const res = await request<ApiResponse<Currency>>(
      `${API_BASE_URL}/currencies/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** DELETE /api/v1/currencies/:id — Soft-disable */
  async disable(id: string, token: string): Promise<{ message: string }> {
    const res = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/currencies/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  // ── Exchange Rates ────────────────────────────────────────────

  /** GET /api/v1/currencies/exchange-rates */
  async getRates(query: ExchangeRateQuery, token: string): Promise<ExchangeRateListResponse> {
    const q = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined) q.append(k, String(v)); });
    const url = `${API_BASE_URL}/currencies/exchange-rates${q.toString() ? `?${q}` : ""}`;
    const res = await request<ApiResponse<ExchangeRateListResponse | ExchangeRate[]>>(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Handle array response shape: [...] or { rates: [...], total, page, limit }
    if (Array.isArray(res.data)) {
      return { rates: res.data, total: res.data.length, page: 1, limit: res.data.length };
    }
    const d = res.data as ExchangeRateListResponse;
    return {
      rates: Array.isArray(d.rates) ? d.rates : [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      limit: d.limit ?? 100,
    };
  },

  /** POST /api/v1/currencies/exchange-rates — Create or upsert */
  async createRate(body: CreateExchangeRatePayload, token: string): Promise<ExchangeRate> {
    const res = await request<ApiResponse<ExchangeRate>>(
      `${API_BASE_URL}/currencies/exchange-rates`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** POST /api/v1/currencies/exchange-rates/bulk */
  async bulkCreateRates(body: BulkExchangeRatesPayload, token: string): Promise<{ count: number }> {
    const res = await request<ApiResponse<{ count: number }>>(
      `${API_BASE_URL}/currencies/exchange-rates/bulk`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.data;
  },

  /** DELETE /api/v1/currencies/exchange-rates/:id */
  async deleteRate(id: string, token: string): Promise<{ message: string }> {
    const res = await request<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/currencies/exchange-rates/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /api/v1/currencies/exchange-rates/latest/:currency — auto-fetches from live API if not stored */
  async getLatestRate(currencyCode: string, token: string): Promise<ExchangeRate> {
    const res = await request<ApiResponse<ExchangeRate>>(
      `${API_BASE_URL}/currencies/exchange-rates/latest/${currencyCode}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** GET /api/v1/currencies/exchange-rates/live/:currency — real-time rate, not stored */
  async getLiveRate(currencyCode: string, token: string): Promise<LiveRate> {
    const res = await request<ApiResponse<LiveRate>>(
      `${API_BASE_URL}/currencies/exchange-rates/live/${currencyCode}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  /** POST /api/v1/currencies/exchange-rates/sync — sync all rates from live API */
  async syncRates(token: string): Promise<SyncResult> {
    const res = await request<ApiResponse<SyncResult>>(
      `${API_BASE_URL}/currencies/exchange-rates/sync`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );
    return res.data;
  },

  /** GET /api/v1/currencies/exchange-rates/convert */
  async convert(
    from: string,
    to: string,
    amount: number,
    date: string | undefined,
    token: string
  ): Promise<ConversionResult> {
    const q = new URLSearchParams({ from, to, amount: String(amount) });
    if (date) q.append("date", date);
    const res = await request<ApiResponse<ConversionResult>>(
      `${API_BASE_URL}/currencies/exchange-rates/convert?${q}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};

export default currencyService;
