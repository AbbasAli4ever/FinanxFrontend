export interface Currency {
  id: string;
  companyId: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export interface ExchangeRate {
  id: string;
  companyId?: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: string; // Decimal string for precision
  effectiveDate: string;
  source: string;
  isActive: boolean;
  createdAt: string;
}

export interface ExchangeRateListResponse {
  rates: ExchangeRate[];
  total: number;
  page: number;
  limit: number;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate?: number;       // Direct conversion (from === base or to === base)
  fromRate?: number;   // Cross-currency (e.g. EUR → GBP via base)
  toRate?: number;
}

export interface LiveRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: "LIVE" | "IDENTITY";
  fetchedAt: string;
}

export interface SyncResult {
  synced: number;
  date: string;
  rates: Array<{ currency: string; rate: number }>;
}

export interface CreateCurrencyPayload {
  code: string;
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
}

export interface UpdateCurrencyPayload {
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
}

export interface CreateExchangeRatePayload {
  targetCurrency: string;
  rate: number;
  effectiveDate: string;
  source?: string;
}

export interface BulkExchangeRatesPayload {
  rates: CreateExchangeRatePayload[];
}

export interface ExchangeRateQuery {
  targetCurrency?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Fields added to transaction create/update DTOs
export interface TransactionCurrencyFields {
  currencyCode?: string;
  exchangeRate?: number;
}

// Customer/vendor preference
export interface CurrencyPreference {
  preferredCurrency?: string | null;
}
