export type DebitNoteStatus =
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

export interface DebitNoteStatusInfo {
  label: string;
  color: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowOpen: boolean;
  allowApply: boolean;
  allowRefund: boolean;
  allowVoid: boolean;
}

export interface DebitNoteLineItem {
  id: string;
  product: { id: string; name: string; sku: string } | null;
  expenseAccount: { id: string; name: string; accountNumber: string } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  sortOrder: number;
}

export interface DebitNoteApplication {
  id: string;
  bill: { id: string; billNumber: string; totalAmount: number; amountDue: number };
  amount: number;
  appliedAt: string;
}

export interface DebitNoteRefund {
  id: string;
  amount: number;
  refundDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DebitNote {
  id: string;
  debitNoteNumber: string;
  referenceNumber: string | null;
  status: DebitNoteStatus;
  statusInfo: DebitNoteStatusInfo;
  debitNoteDate: string;
  vendor: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
  };
  bill: { id: string; billNumber: string } | null;
  lineItems: DebitNoteLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  appliedAmount: number;
  remainingDebit: number;
  refundAccount: { id: string; name: string; accountNumber: string } | null;
  reason: string | null;
  notes: string | null;
  applications: DebitNoteApplication[];
  refunds: DebitNoteRefund[];
  openedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DebitNoteListItem {
  id: string;
  debitNoteNumber: string;
  referenceNumber: string | null;
  status: DebitNoteStatus;
  statusInfo: DebitNoteStatusInfo;
  debitNoteDate: string;
  vendor: { id: string; displayName: string };
  bill: { id: string; billNumber: string } | null;
  totalAmount: number;
  remainingDebit: number;
  createdAt: string;
}

export interface DebitNoteSummaryStatus {
  count: number;
  totalAmount: number;
  remainingDebit?: number;
}

export interface DebitNoteSummary {
  draft: DebitNoteSummaryStatus;
  open: DebitNoteSummaryStatus;
  partiallyApplied: DebitNoteSummaryStatus;
  applied: DebitNoteSummaryStatus;
  void: DebitNoteSummaryStatus;
  totalOutstandingDebit: number;
}

export interface DebitNoteFilters {
  status: string;
  vendorId: string;
  billId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface CreateDebitNoteLineItemRequest {
  productId?: string;
  expenseAccountId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateDebitNoteRequest {
  vendorId: string;
  billId?: string;
  debitNoteNumber?: string;
  referenceNumber?: string;
  debitNoteDate: string;
  discountType?: DiscountType;
  discountValue?: number;
  refundAccountId?: string;
  reason?: string;
  notes?: string;
  lineItems: CreateDebitNoteLineItemRequest[];
}

export interface UpdateDebitNoteRequest {
  vendorId?: string;
  billId?: string;
  debitNoteNumber?: string;
  referenceNumber?: string;
  debitNoteDate?: string;
  discountType?: DiscountType;
  discountValue?: number;
  refundAccountId?: string;
  reason?: string;
  notes?: string;
  lineItems?: CreateDebitNoteLineItemRequest[];
}

export interface ApplyDebitNoteApplication {
  billId: string;
  amount: number;
}

export interface ApplyDebitNoteRequest {
  applications: ApplyDebitNoteApplication[];
}

export interface RefundDebitNoteRequest {
  amount: number;
  refundDate: string;
  paymentMethod?: PaymentMethod;
  refundAccountId?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface VoidDebitNoteRequest {
  reason?: string;
}
