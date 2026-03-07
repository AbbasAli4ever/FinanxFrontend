# Day 26 — Multi-Currency Frontend Integration Guide

Base URL: `{{API_URL}}/api/v1`

All endpoints require `Authorization: Bearer <token>` header.

---

## 1. Currency Management API

### List Company Currencies

```
GET /currencies
Permission: currency:view
```

**Response:**
```json
{
  "success": true,
  "message": "Currencies retrieved successfully",
  "data": {
    "currencies": [
      {
        "id": "uuid",
        "companyId": "uuid",
        "code": "INR",
        "name": "Indian Rupee",
        "symbol": "₹",
        "decimalPlaces": 2,
        "isBaseCurrency": true,
        "isActive": true,
        "createdAt": "2026-03-05T...",
        "updatedAt": "2026-03-05T..."
      },
      {
        "id": "uuid",
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "decimalPlaces": 2,
        "isBaseCurrency": false,
        "isActive": true
      }
    ],
    "total": 7
  }
}
```

### Get Supported Currencies (Static List)

```
GET /currencies/supported
Permission: currency:view
```

Returns all 30 available ISO 4217 currencies for selection. Use this to populate a dropdown when enabling new currencies.

**Response:**
```json
{
  "success": true,
  "data": [
    { "code": "USD", "name": "US Dollar", "symbol": "$", "decimalPlaces": 2 },
    { "code": "EUR", "name": "Euro", "symbol": "€", "decimalPlaces": 2 },
    { "code": "GBP", "name": "British Pound", "symbol": "£", "decimalPlaces": 2 },
    { "code": "JPY", "name": "Japanese Yen", "symbol": "¥", "decimalPlaces": 0 }
  ]
}
```

### Get Base Currency

```
GET /currencies/base
Permission: currency:view
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "INR",
    "name": "Indian Rupee",
    "symbol": "₹",
    "decimalPlaces": 2,
    "isBaseCurrency": true
  }
}
```

### Enable a Currency

```
POST /currencies
Permission: currency:manage
```

**Body:**
```json
{
  "code": "SGD",
  "name": "Singapore Dollar",
  "symbol": "S$",
  "decimalPlaces": 2
}
```

- `code` (required): 3-character ISO 4217 code
- `name` (optional): Falls back to supported currencies list
- `symbol` (optional): Falls back to supported currencies list
- `decimalPlaces` (optional): Default 2

> If the currency was previously disabled, it will be reactivated.

### Update a Currency

```
PATCH /currencies/:id
Permission: currency:manage
```

**Body (all optional):**
```json
{
  "name": "Updated Name",
  "symbol": "S$",
  "decimalPlaces": 2
}
```

### Delete (Disable) a Currency

```
DELETE /currencies/:id
Permission: currency:manage
```

- Cannot delete the base currency
- Soft-deletes (sets `isActive: false`)

---

## 2. Exchange Rates API

### How Exchange Rates Work

Exchange rates are fetched **automatically from a live external API** (342 currencies supported). The system:

1. **Auto-fetches** when you request a rate that doesn't exist locally
2. **Auto-syncs daily** at 6 AM via cron job for all enabled currencies
3. **Stores rates locally** in the database for historical records and offline access
4. **Allows manual overrides** — you can still manually create/update rates

**Rate sources** (shown in the `source` field):
- `"AUTO"` — Fetched automatically from live API
- `"MANUAL"` — Entered manually by a user
- `"LIVE"` — Real-time rate (not stored, from `/live/` endpoint only)
- `"IDENTITY"` — Same currency (rate = 1.0)

### List Exchange Rates (Stored)

```
GET /currencies/exchange-rates
Permission: currency:view
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `targetCurrency` | string | Filter by currency code (e.g., "EUR") |
| `startDate` | string | Filter rates from this date (YYYY-MM-DD) |
| `endDate` | string | Filter rates until this date (YYYY-MM-DD) |
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 25) |

**Response:**
```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "id": "uuid",
        "baseCurrency": "INR",
        "targetCurrency": "EUR",
        "rate": "0.0093359120",
        "effectiveDate": "2026-03-05T00:00:00.000Z",
        "source": "AUTO",
        "isActive": true,
        "createdAt": "2026-03-05T..."
      },
      {
        "id": "uuid",
        "baseCurrency": "INR",
        "targetCurrency": "USD",
        "rate": "0.0108518740",
        "effectiveDate": "2026-03-05T00:00:00.000Z",
        "source": "AUTO",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 7,
      "totalPages": 1
    }
  }
}
```

### Get Live Rate (Real-Time, Not Stored)

```
GET /currencies/exchange-rates/live/:currency
Permission: currency:view
```

Fetches the **current real-time rate** from the external API. Does NOT store it in the database. Use this for display purposes (e.g., showing the current rate on a currency settings page).

**Example:** `GET /currencies/exchange-rates/live/EUR`

**Response:**
```json
{
  "success": true,
  "data": {
    "baseCurrency": "INR",
    "targetCurrency": "EUR",
    "rate": 0.009335912,
    "source": "LIVE",
    "fetchedAt": "2026-03-05T21:55:49.406Z"
  }
}
```

### Get Latest Stored Rate (Auto-Fetches if Missing)

```
GET /currencies/exchange-rates/latest/:currency
Permission: currency:view
```

Returns the latest **stored** rate from the database. If no rate exists, it **automatically fetches from the live API, stores it, and returns it**.

**Example:** `GET /currencies/exchange-rates/latest/EUR`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "baseCurrency": "INR",
    "targetCurrency": "EUR",
    "rate": "0.0093359120",
    "effectiveDate": "2026-03-05T00:00:00.000Z",
    "source": "AUTO",
    "isActive": true,
    "createdAt": "2026-03-05T..."
  }
}
```

> **Frontend tip:** Use this endpoint when populating the exchange rate field on transaction forms. It will always return a rate (auto-fetching if needed).

### Sync All Exchange Rates (Manual Trigger)

```
POST /currencies/exchange-rates/sync
Permission: currency:manage
```

Fetches live rates for **all enabled currencies** and stores them in the database for today's date. Use this as a "Refresh Rates" button on the currency settings page.

> This also runs automatically every day at 6 AM.

**Response:**
```json
{
  "success": true,
  "message": "Synced 7 exchange rate(s) from live data",
  "data": {
    "synced": 7,
    "date": "2026-03-05",
    "rates": [
      { "currency": "SGD", "rate": 0.013846714 },
      { "currency": "USD", "rate": 0.010851874 },
      { "currency": "EUR", "rate": 0.009335912 },
      { "currency": "CAD", "rate": 0.014808243 },
      { "currency": "AUD", "rate": 0.015361278 },
      { "currency": "JPY", "rate": 1.70241289 },
      { "currency": "GBP", "rate": 0.0081220548 }
    ]
  }
}
```

### Convert Amount (Auto-Fetches if No Rate)

```
GET /currencies/exchange-rates/convert?from=INR&to=EUR&amount=10000
Permission: currency:view
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | Yes | Source currency code |
| `to` | string | Yes | Target currency code |
| `amount` | number | Yes | Amount to convert |
| `date` | string | No | Rate date (defaults to latest available) |

If no stored rate exists, **automatically fetches and stores from live API**.

**Response (direct conversion):**
```json
{
  "success": true,
  "data": {
    "from": "INR",
    "to": "EUR",
    "amount": 10000,
    "convertedAmount": 93.3591,
    "rate": 0.009335912
  }
}
```

**Response (cross-currency, e.g. EUR → GBP):**
```json
{
  "success": true,
  "data": {
    "from": "EUR",
    "to": "GBP",
    "amount": 100,
    "convertedAmount": 86.998,
    "fromRate": 0.009335912,
    "toRate": 0.0081220548
  }
}
```

> Cross-currency goes through base: EUR → INR → GBP

### Create/Update Exchange Rate (Manual Override)

```
POST /currencies/exchange-rates
Permission: currency:manage
```

**Body:**
```json
{
  "targetCurrency": "EUR",
  "rate": 0.0094,
  "effectiveDate": "2026-03-05",
  "source": "MANUAL"
}
```

- `targetCurrency` (required): 3-character currency code
- `rate` (required): Exchange rate (1 base = X target), must be > 0
- `effectiveDate` (required): Date string (YYYY-MM-DD)
- `source` (optional): Default "MANUAL"

> If a rate already exists for the same currency + date, it will be updated (upsert). Manual rates take precedence — they won't be overwritten by auto-sync.

### Bulk Create Exchange Rates

```
POST /currencies/exchange-rates/bulk
Permission: currency:manage
```

**Body:**
```json
{
  "rates": [
    { "targetCurrency": "EUR", "rate": 0.0094, "effectiveDate": "2026-03-05" },
    { "targetCurrency": "GBP", "rate": 0.0082, "effectiveDate": "2026-03-05" },
    { "targetCurrency": "CAD", "rate": 0.0148, "effectiveDate": "2026-03-05" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 exchange rate(s) saved",
  "data": { "rates": [...], "count": 3 }
}
```

### Delete Exchange Rate

```
DELETE /currencies/exchange-rates/:id
Permission: currency:manage
```

---

## 3. Using Currencies on Transactions

### Invoice with Foreign Currency

```
POST /invoices
```

```json
{
  "customerId": "uuid",
  "dueDate": "2026-04-05",
  "currencyCode": "EUR",
  "exchangeRate": 0.009335912,
  "lineItems": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 150,
      "accountId": "uuid"
    }
  ]
}
```

- `currencyCode` (optional): Defaults to "USD". The currency the invoice is denominated in.
- `exchangeRate` (optional): Defaults to 1. Rate at time of invoice (1 base = X foreign).
- Line item amounts are in the foreign currency.

### Bill with Foreign Currency

```
POST /bills
```

```json
{
  "vendorId": "uuid",
  "dueDate": "2026-04-05",
  "currencyCode": "GBP",
  "exchangeRate": 0.0081220548,
  "lineItems": [
    {
      "description": "Raw Materials",
      "quantity": 100,
      "unitPrice": 25,
      "expenseAccountId": "uuid"
    }
  ]
}
```

### Expense with Foreign Currency

```
POST /expenses
```

```json
{
  "expenseAccountId": "uuid",
  "paymentAccountId": "uuid",
  "expenseDate": "2026-03-05",
  "currencyCode": "CAD",
  "exchangeRate": 0.014808243,
  "lineItems": [
    {
      "description": "Office Supplies",
      "quantity": 1,
      "unitPrice": 250,
      "categoryId": "uuid"
    }
  ]
}
```

### Journal Entry with Foreign Currency

```
POST /journal-entries
```

```json
{
  "entryDate": "2026-03-05",
  "currencyCode": "EUR",
  "exchangeRate": 0.009335912,
  "lines": [
    { "accountId": "uuid", "debit": 1000, "credit": 0, "description": "Foreign purchase" },
    { "accountId": "uuid", "debit": 0, "credit": 1000, "description": "Foreign purchase" }
  ]
}
```

### Customer with Preferred Currency

```
POST /customers
```

```json
{
  "displayName": "European Client",
  "email": "client@eu.com",
  "preferredCurrency": "EUR"
}
```

When creating invoices for this customer, the frontend should auto-suggest `currencyCode: "EUR"` and auto-fetch the latest rate.

### Vendor with Preferred Currency

```
POST /vendors
```

```json
{
  "displayName": "UK Supplier",
  "email": "supplier@uk.com",
  "preferredCurrency": "GBP"
}
```

---

## 4. Permissions Reference

| Permission | Admin | Standard | Limited | Reports Only |
|-----------|-------|----------|---------|-------------|
| `currency:view` | Yes | Yes | Yes | No |
| `currency:manage` | Yes | No | No | No |

**What each permission allows:**

`currency:view` — List currencies, get rates, get live rates, convert amounts
`currency:manage` — Enable/disable currencies, create/delete rates, manual override, sync rates

---

## 5. Frontend Implementation Suggestions

### Currency Settings Page

```
┌─ Currency Settings ──────────────────────────────────────────────────┐
│                                                                      │
│ Base Currency: ₹ INR (Indian Rupee)                                  │
│                                                                      │
│ ┌─ Enabled Currencies ────────────────────────────────────────────┐  │
│ │ Code │ Name          │ Symbol │ Source     │ Latest Rate │       │  │
│ │ INR  │ Indian Rupee  │ ₹      │ BASE       │ 1.0000      │       │  │
│ │ USD  │ US Dollar     │ $      │ AUTO       │ 0.010852    │       │  │
│ │ EUR  │ Euro          │ €      │ AUTO       │ 0.009336    │       │  │
│ │ GBP  │ British Pound │ £      │ AUTO       │ 0.008122    │       │  │
│ │ JPY  │ Japanese Yen  │ ¥      │ AUTO       │ 1.702413    │       │  │
│ └──────┴───────────────┴────────┴────────────┴─────────────┴───────┘ │
│                                                                      │
│ [+ Add Currency]    [🔄 Refresh All Rates]    Last synced: 6:00 AM   │
│                                                                      │
│ ┌─ Exchange Rate History ─────────────────────────────────────────┐  │
│ │ Currency: [All ▾]  From: [2026-03-01]  To: [2026-03-06]        │  │
│ │                                                                 │  │
│ │ Date       │ Currency │ Rate       │ Source │ Actions           │  │
│ │ 2026-03-05 │ EUR      │ 0.009336   │ AUTO   │ [Edit] [Delete]  │  │
│ │ 2026-03-05 │ USD      │ 0.010852   │ AUTO   │ [Edit] [Delete]  │  │
│ │ 2026-03-04 │ EUR      │ 0.009301   │ MANUAL │ [Edit] [Delete]  │  │
│ └────────────┴──────────┴────────────┴────────┴──────────────────┘  │
│                                                                      │
│ [+ Add Manual Rate]                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation notes:**
- "Refresh All Rates" button calls `POST /currencies/exchange-rates/sync`
- "Latest Rate" column: call `GET /currencies/exchange-rates/latest/:code` for each currency
- Exchange Rate History: call `GET /currencies/exchange-rates` with filters
- Source badge colors: `AUTO` = blue, `MANUAL` = green, `LIVE` = yellow

### Currency Selector on Transaction Forms

Add a currency selector to Invoice, Bill, Expense, and Journal Entry create/edit forms:

```
┌─────────────────────────────────────────────────────┐
│ Currency: [EUR ▾]   Exchange Rate: [0.009336]  [🔄] │
│                                                     │
│ ℹ️ 1 INR = 0.009336 EUR (Auto • Mar 5, 2026)       │
│                                                     │
│ Total: €1,380.00 (≈ ₹147,836.00 INR)               │
└─────────────────────────────────────────────────────┘
```

**Behavior:**
1. Default currency from customer/vendor `preferredCurrency`, or company base currency
2. When currency changes, auto-fetch rate: `GET /currencies/exchange-rates/latest/:code` (this auto-fetches from live API if no stored rate exists)
3. Auto-populate exchange rate (user can override for manual entry)
4. 🔄 button fetches fresh live rate: `GET /currencies/exchange-rates/live/:code`
5. Show conversion preview: "Total: €1,380.00 (≈ ₹147,836.00 INR)"
6. Show rate source and date so user knows if it's fresh

### Currency Display Helper

Format amounts with the correct currency symbol and decimal places:

```typescript
function formatCurrency(amount: number, currencyCode: string, currencies: Currency[]): string {
  const currency = currencies.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  const decimals = currency?.decimalPlaces ?? 2;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// Examples:
// formatCurrency(1500, "USD", currencies) → "$1,500.00"
// formatCurrency(1500, "JPY", currencies) → "¥1,500"
// formatCurrency(1500, "EUR", currencies) → "€1,500.00"
// formatCurrency(147836, "INR", currencies) → "₹1,47,836.00"
```

### Conversion Widget

A quick conversion tool accessible from the currency settings or dashboard:

```
┌─ Currency Converter ──────────────────────────────┐
│                                                    │
│ From: [INR ▾]    Amount: [10,000.00]               │
│ To:   [EUR ▾]    Result:  93.36                    │
│                                                    │
│ Rate: 1 INR = 0.009336 EUR (Live • Just now)       │
│                                                    │
│ [Swap ⇄]                                           │
└────────────────────────────────────────────────────┘
```

Uses: `GET /currencies/exchange-rates/convert?from=INR&to=EUR&amount=10000`

---

## 6. TypeScript Interfaces

```typescript
interface Currency {
  id: string;
  companyId: string;
  code: string;           // "USD", "EUR", "GBP"
  name: string;           // "US Dollar"
  symbol: string;         // "$"
  decimalPlaces: number;  // 2 (0 for JPY)
  isBaseCurrency: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

interface ExchangeRate {
  id: string;
  companyId: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: string;           // Decimal as string for precision
  effectiveDate: string;
  source: 'AUTO' | 'MANUAL';
  isActive: boolean;
  createdAt: string;
}

interface LiveRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: 'LIVE' | 'IDENTITY';
  fetchedAt: string;
}

interface ExchangeRateListResponse {
  rates: ExchangeRate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SyncResult {
  synced: number;
  date: string;
  rates: Array<{ currency: string; rate: number }>;
}

interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate?: number;          // For direct conversions
  fromRate?: number;      // For cross-currency conversions
  toRate?: number;        // For cross-currency conversions
}

interface CreateCurrencyPayload {
  code: string;           // Required, 3 chars
  name?: string;
  symbol?: string;
  decimalPlaces?: number; // Default 2
}

interface UpdateCurrencyPayload {
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
}

interface CreateExchangeRatePayload {
  targetCurrency: string; // Required, 3 chars
  rate: number;           // Required, > 0
  effectiveDate: string;  // Required, YYYY-MM-DD
  source?: string;        // Default "MANUAL"
}

interface BulkExchangeRatesPayload {
  rates: CreateExchangeRatePayload[];
}

interface ExchangeRateQuery {
  targetCurrency?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Transaction currency fields (added to existing DTOs)
interface TransactionCurrencyFields {
  currencyCode?: string;  // Default "USD"
  exchangeRate?: number;  // Default 1
}

// Customer/Vendor preference
interface CurrencyPreference {
  preferredCurrency?: string; // 3-char ISO code or null
}
```

---

## 7. Workflow: Creating a Foreign Currency Invoice

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ 1. Select    │────▶│ 2. Check         │────▶│ 3. Auto-fetch    │
│    Customer  │     │    preferredCurr  │     │    exchange rate  │
└──────────────┘     └──────────────────┘     └──────────────────┘
                                                      │
                                                      ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ 6. Submit    │◀────│ 5. Show dual     │◀────│ 4. Auto-populate │
│    invoice   │     │    currency view  │     │    rate field     │
└──────────────┘     └──────────────────┘     └──────────────────┘
```

1. **User selects customer** → Check `customer.preferredCurrency`
2. **Auto-set currency** → If customer has `preferredCurrency: "EUR"`, set `currencyCode: "EUR"`
3. **Auto-fetch rate** → `GET /currencies/exchange-rates/latest/EUR` — this **automatically fetches a live rate** if none exists in DB, so it will never fail with "no rate found"
4. **Auto-populate rate** → Set `exchangeRate` from response (user can override with 🔄 live refresh)
5. **Show dual display** → "Subtotal: €1,380.00 (≈ ₹147,836.00 INR)"
6. **Submit invoice** → POST with `currencyCode: "EUR"`, `exchangeRate: 0.009336`
7. **Backend stores** → Amount in EUR, rate snapshot frozen for this document

---

## 8. API Endpoint Summary (14 total)

| # | Method | Path | Permission | Description |
|---|--------|------|------------|-------------|
| 1 | GET | `/currencies` | `currency:view` | List enabled currencies |
| 2 | POST | `/currencies` | `currency:manage` | Enable a currency |
| 3 | PATCH | `/currencies/:id` | `currency:manage` | Update currency |
| 4 | DELETE | `/currencies/:id` | `currency:manage` | Disable currency |
| 5 | GET | `/currencies/supported` | `currency:view` | Static list of 30 ISO currencies |
| 6 | GET | `/currencies/base` | `currency:view` | Company's base currency |
| 7 | GET | `/currencies/exchange-rates` | `currency:view` | List stored rates (paginated) |
| 8 | POST | `/currencies/exchange-rates` | `currency:manage` | Create/update manual rate |
| 9 | POST | `/currencies/exchange-rates/bulk` | `currency:manage` | Bulk create rates |
| 10 | DELETE | `/currencies/exchange-rates/:id` | `currency:manage` | Delete a rate |
| 11 | **GET** | **`/currencies/exchange-rates/live/:currency`** | `currency:view` | **Real-time rate (not stored)** |
| 12 | **POST** | **`/currencies/exchange-rates/sync`** | `currency:manage` | **Sync all rates from live API** |
| 13 | GET | `/currencies/exchange-rates/latest/:currency` | `currency:view` | Latest stored rate (auto-fetches if missing) |
| 14 | GET | `/currencies/exchange-rates/convert` | `currency:view` | Convert amount (auto-fetches if missing) |

**Bold** = New live rate endpoints

---

## 9. Error Responses

| Status | Scenario |
|--------|----------|
| 400 | Invalid currency code, rate ≤ 0, missing required fields, live API unavailable |
| 404 | Currency not found, no live rate available for exotic currency |
| 409 | Currency already enabled for this company |
| 403 | Cannot delete base currency |

> **Note:** The "No exchange rate available" error is now rare — most endpoints auto-fetch from the live API when no local rate exists. You'll only see it for truly exotic/unsupported currencies.
