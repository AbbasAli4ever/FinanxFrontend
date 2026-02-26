export type CreditNoteStatus =
  | "DRAFT"
  | "OPEN"
  | "PARTIALLY_APPLIED"
  | "APPLIED"
  | "VOID";

export type PaymentMethod =
  | "CASH"
  | "CHECK"
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "OTHER";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface CreditNoteStatusInfo {
  label: string;
  color: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowOpen: boolean;
  allowApply: boolean;
  allowRefund: boolean;
  allowVoid: boolean;
}

export interface CreditNoteLineItem {
  id: string;
  product: { id: string; name: string; sku: string } | null;
  account: { id: string; name: string; accountNumber: string } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  sortOrder: number;
}

export interface CreditNoteApplication {
  id: string;
  invoice: { id: string; invoiceNumber: string; totalAmount: number; amountDue: number };
  amount: number;
  appliedAt: string;
}

export interface CreditNoteRefund {
  id: string;
  amount: number;
  refundDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  referenceNumber: string | null;
  status: CreditNoteStatus;
  statusInfo: CreditNoteStatusInfo;
  creditNoteDate: string;
  customer: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
  };
  invoice: { id: string; invoiceNumber: string } | null;
  lineItems: CreditNoteLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  appliedAmount: number;
  remainingCredit: number;
  refundAccount: { id: string; name: string; accountNumber: string } | null;
  reason: string | null;
  notes: string | null;
  applications: CreditNoteApplication[];
  refunds: CreditNoteRefund[];
  openedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteListItem {
  id: string;
  creditNoteNumber: string;
  referenceNumber: string | null;
  status: CreditNoteStatus;
  statusInfo: CreditNoteStatusInfo;
  creditNoteDate: string;
  customer: { id: string; displayName: string };
  invoice: { id: string; invoiceNumber: string } | null;
  totalAmount: number;
  remainingCredit: number;
  createdAt: string;
}

export interface CreditNoteSummaryStatus {
  count: number;
  totalAmount: number;
  remainingCredit?: number;
}

export interface CreditNoteSummary {
  draft: CreditNoteSummaryStatus;
  open: CreditNoteSummaryStatus;
  partiallyApplied: CreditNoteSummaryStatus;
  applied: CreditNoteSummaryStatus;
  void: CreditNoteSummaryStatus;
  totalOutstandingCredit: number;
}

export interface CreditNoteFilters {
  status: string;
  customerId: string;
  invoiceId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface CreateCreditNoteLineItemRequest {
  productId?: string;
  accountId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateCreditNoteRequest {
  customerId: string;
  invoiceId?: string;
  creditNoteNumber?: string;
  referenceNumber?: string;
  creditNoteDate: string;
  discountType?: DiscountType;
  discountValue?: number;
  refundAccountId?: string;
  reason?: string;
  notes?: string;
  lineItems: CreateCreditNoteLineItemRequest[];
}

export interface UpdateCreditNoteRequest {
  customerId?: string;
  invoiceId?: string;
  creditNoteNumber?: string;
  referenceNumber?: string;
  creditNoteDate?: string;
  discountType?: DiscountType;
  discountValue?: number;
  refundAccountId?: string;
  reason?: string;
  notes?: string;
  lineItems?: CreateCreditNoteLineItemRequest[];
}

export interface ApplyCreditNoteApplication {
  invoiceId: string;
  amount: number;
}

export interface ApplyCreditNoteRequest {
  applications: ApplyCreditNoteApplication[];
}

export interface RefundCreditNoteRequest {
  amount: number;
  refundDate: string;
  paymentMethod?: PaymentMethod;
  refundAccountId?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface VoidCreditNoteRequest {
  reason?: string;
}
