export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export type PaymentMethod =
  | "CASH"
  | "CHECK"
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "OTHER";

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

export interface StatusInfo {
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowSend: boolean;
  allowVoid: boolean;
  allowPayment: boolean;
}

export interface InvoiceLineItem {
  id: string;
  product: { id: string; name: string; sku: string; type: string } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  sortOrder: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  referenceNumber: string | null;
  status: InvoiceStatus;
  statusInfo: StatusInfo;
  invoiceDate: string;
  dueDate: string | null;
  paymentTerms: string | null;
  customer: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPostalCode: string | null;
    billingCountry: string | null;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  depositAccount: { id: string; name: string; accountNumber: string } | null;
  notes: string | null;
  termsAndConditions: string | null;
  payments: InvoicePayment[];
  sentAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  referenceNumber: string | null;
  status: string;
  statusInfo: StatusInfo;
  invoiceDate: string;
  dueDate: string | null;
  customer: { id: string; displayName: string; email: string | null };
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  lineItemCount: number;
  paymentCount: number;
  createdAt: string;
}

export interface InvoiceSummary {
  draft: { count: number };
  sent: { count: number };
  partiallyPaid: { count: number };
  paid: { count: number; amount: number };
  overdue: { count: number; amount: number };
  void: { count: number };
  totals: {
    totalInvoiced: number;
    totalUnpaid: number;
    totalPaid: number;
  };
}

export interface InvoiceFilters {
  status: string;
  customerId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface CreateInvoiceLineItemRequest {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateInvoiceRequest {
  customerId: string;
  invoiceDate: string;
  dueDate?: string;
  paymentTerms?: PaymentTerms;
  invoiceNumber?: string;
  referenceNumber?: string;
  discountType?: DiscountType;
  discountValue?: number;
  depositAccountId?: string;
  notes?: string;
  termsAndConditions?: string;
  lineItems: CreateInvoiceLineItemRequest[];
}

export interface UpdateInvoiceRequest {
  customerId?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentTerms?: PaymentTerms;
  invoiceNumber?: string;
  referenceNumber?: string;
  discountType?: DiscountType;
  discountValue?: number;
  depositAccountId?: string;
  notes?: string;
  termsAndConditions?: string;
  lineItems?: CreateInvoiceLineItemRequest[];
}

export interface RecordPaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  depositAccountId?: string;
}

export interface VoidInvoiceRequest {
  reason?: string;
}
