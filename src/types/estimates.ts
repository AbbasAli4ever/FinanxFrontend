export type EstimateStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED"
  | "VOID";

export type DiscountType = "PERCENTAGE" | "FIXED";

export type PaymentTerms =
  | "DUE_ON_RECEIPT"
  | "NET_10"
  | "NET_15"
  | "NET_30"
  | "NET_45"
  | "NET_60"
  | "NET_90"
  | "CUSTOM";

export interface EstimateStatusInfo {
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowSend: boolean;
  allowAccept: boolean;
  allowReject: boolean;
  allowConvert: boolean;
  allowVoid: boolean;
}

export interface EstimateLineItem {
  id: string;
  product: { id: string; name: string; sku: string | null } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  sortOrder: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  referenceNumber: string | null;
  status: EstimateStatus;
  statusInfo: EstimateStatusInfo;
  estimateDate: string;
  expirationDate: string | null;
  paymentTerms: PaymentTerms | null;
  customer: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
  };
  lineItems: EstimateLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  depositAccount: { id: string; name: string; accountNumber: string } | null;
  notes: string | null;
  termsAndConditions: string | null;
  customerMessage: string | null;
  convertedInvoice: { id: string; invoiceNumber: string } | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateListItem {
  id: string;
  estimateNumber: string;
  referenceNumber: string | null;
  status: EstimateStatus;
  statusInfo: EstimateStatusInfo;
  estimateDate: string;
  expirationDate: string | null;
  customer: { id: string; displayName: string };
  totalAmount: number;
  createdAt: string;
}

export interface EstimateSummaryCount {
  count: number;
}

export interface EstimateSummaryWithAmount {
  count: number;
  amount: number;
}

export interface EstimateSummary {
  draft: EstimateSummaryCount;
  sent: EstimateSummaryCount;
  viewed: EstimateSummaryCount;
  accepted: EstimateSummaryWithAmount;
  rejected: EstimateSummaryCount;
  converted: EstimateSummaryWithAmount;
  void: EstimateSummaryCount;
  expiring: EstimateSummaryWithAmount;
  totals: {
    totalEstimated: number;
    totalPending: number;
    conversionRate: number;
  };
}

export interface EstimateFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}

export interface CreateEstimateLineItemRequest {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateEstimateRequest {
  customerId: string;
  estimateDate: string;
  expirationDate?: string;
  paymentTerms?: PaymentTerms;
  discountType?: DiscountType;
  discountValue?: number;
  depositAccountId?: string;
  notes?: string;
  termsAndConditions?: string;
  customerMessage?: string;
  lineItems: CreateEstimateLineItemRequest[];
}

export interface UpdateEstimateRequest {
  customerId?: string;
  estimateDate?: string;
  expirationDate?: string;
  paymentTerms?: PaymentTerms;
  discountType?: DiscountType;
  discountValue?: number;
  depositAccountId?: string;
  notes?: string;
  termsAndConditions?: string;
  customerMessage?: string;
  lineItems?: CreateEstimateLineItemRequest[];
}

export interface RejectEstimateRequest {
  reason?: string;
}

export interface VoidEstimateRequest {
  reason?: string;
}
