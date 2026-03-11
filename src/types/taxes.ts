export type TaxType = "SALES" | "PURCHASE" | "BOTH";

export interface TaxRate {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  rate: string; // Decimal as string from Prisma
  taxType: TaxType;
  isCompound: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  taxGroupRates?: TaxGroupRateWithGroup[];
}

export interface TaxGroup {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  taxGroupRates: TaxGroupRateWithRate[];
}

export interface TaxGroupRateWithRate {
  id: string;
  taxGroupId: string;
  taxRateId: string;
  sortOrder: number;
  createdAt: string;
  taxRate: TaxRate;
}

export interface TaxGroupRateWithGroup {
  id: string;
  taxGroupId: string;
  taxRateId: string;
  sortOrder: number;
  createdAt: string;
  taxGroup: Pick<TaxGroup, "id" | "name" | "code" | "isActive">;
}

// ─── Report types ─────────────────────────────────────────────────────────────

export interface TaxSummary {
  period: { startDate: string | null; endDate: string | null };
  salesTaxCollected: number;
  purchaseTaxPaid: number;
  expenseTax: {
    total: number;
    deductible: number;
    nonDeductible: number;
  };
  netTaxLiability: number;
}

export interface TaxByRateReport {
  period: { startDate: string | null; endDate: string | null };
  rateBreakdowns: {
    taxRate: { id: string; name: string; code: string; rate: number; isActive: boolean };
    invoiceLineCount: number;
    billLineCount: number;
    invoiceTaxableAmount: number;
    billTaxableAmount: number;
  }[];
  unlinked: {
    invoiceLineCount: number;
    billLineCount: number;
    invoiceTaxableAmount: number;
    billTaxableAmount: number;
  };
}

export interface Vendor1099Report {
  period: { startDate: string | null; endDate: string | null };
  vendors: {
    vendor: {
      id: string;
      displayName: string;
      taxNumber: string | null;
      businessIdNo: string | null;
    };
    totalPayments: number;
    billCount: number;
  }[];
  vendorCount: number;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateTaxRateRequest {
  name: string;
  code: string;
  description?: string;
  rate: number;
  taxType?: TaxType;
  isCompound?: boolean;
  isActive?: boolean;
}

export interface UpdateTaxRateRequest {
  name?: string;
  code?: string;
  description?: string;
  rate?: number;
  taxType?: TaxType;
  isCompound?: boolean;
  isActive?: boolean;
}

export interface CreateTaxGroupRequest {
  name: string;
  code: string;
  description?: string;
  rateIds?: string[];
  isActive?: boolean;
}

export interface UpdateTaxGroupRequest {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface TaxRateFilters {
  isActive?: boolean;
  taxType?: TaxType | "";
  search?: string;
}
