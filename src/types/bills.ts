export type BillStatus =
  | "DRAFT"
  | "RECEIVED"
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

export interface BillStatusInfo {
  value: BillStatus;
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowReceive: boolean;
  allowVoid: boolean;
  allowPayment: boolean;
}

export interface BillLineItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    type: string;
  } | null;
  expenseAccount: {
    id: string;
    name: string;
    code: string;
    accountType: string;
  } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  sortOrder: number;
}

export interface BillPayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  paymentAccount: {
    id: string;
    name: string;
    code: string;
  } | null;
  notes: string | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string | null;
  referenceNumber: string | null;
  status: BillStatus;
  statusInfo: BillStatusInfo;
  billDate: string;
  dueDate: string | null;
  paymentTerms: string | null;
  vendor: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  lineItems: BillLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentAccount: { id: string; name: string; code: string } | null;
  notes: string | null;
  memo: string | null;
  payments: BillPayment[];
  receivedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillListItem {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string | null;
  referenceNumber: string | null;
  status: BillStatus;
  statusInfo: BillStatusInfo;
  billDate: string;
  dueDate: string | null;
  paymentTerms: string | null;
  vendor: {
    id: string;
    displayName: string;
    email: string | null;
  };
  lineItemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  createdAt: string;
}

export interface BillSummary {
  draft: { count: number };
  received: { count: number; amount?: number };
  partiallyPaid: { count: number; amount?: number };
  paid: { count: number; amount?: number };
  overdue: { count: number; amount?: number };
  void: { count: number };
  totals: {
    totalBilled: number;
    totalUnpaid: number;
    totalPaid: number;
  };
}

export interface BillFilters {
  status: string;
  vendorId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface CreateBillLineItemRequest {
  productId?: string;
  expenseAccountId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateBillRequest {
  vendorId: string;
  billDate: string;
  billNumber?: string;
  vendorInvoiceNumber?: string;
  referenceNumber?: string;
  paymentTerms?: PaymentTerms;
  dueDate?: string;
  discountType?: DiscountType;
  discountValue?: number;
  paymentAccountId?: string;
  notes?: string;
  memo?: string;
  lineItems: CreateBillLineItemRequest[];
}

export interface UpdateBillRequest {
  vendorId?: string;
  billDate?: string;
  billNumber?: string;
  vendorInvoiceNumber?: string;
  referenceNumber?: string;
  paymentTerms?: PaymentTerms;
  dueDate?: string;
  discountType?: DiscountType;
  discountValue?: number;
  paymentAccountId?: string;
  notes?: string;
  memo?: string;
  lineItems?: CreateBillLineItemRequest[];
}

export interface RecordBillPaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  paymentAccountId?: string;
}

export interface VoidBillRequest {
  reason?: string;
}
