export type SOStatus = "DRAFT" | "SENT" | "CONFIRMED" | "PARTIAL" | "FULFILLED" | "CLOSED" | "VOID";
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface SOStatusInfo {
  key: SOStatus;
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowSend: boolean;
  allowConfirm: boolean;
  allowFulfill: boolean;
  allowConvert: boolean;
  allowClose: boolean;
  allowVoid: boolean;
}

export interface SOLineItem {
  id: string;
  product: { id: string; name: string; sku: string | null; type: string } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  quantityFulfilled: number;
  sortOrder: number;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  referenceNumber: string | null;
  status: SOStatus;
  statusInfo: SOStatusInfo;
  orderDate: string;
  expectedDeliveryDate: string | null;
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
  depositAccount: { id: string; name: string; accountNumber: string } | null;
  lineItems: SOLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  convertedInvoice: { id: string; invoiceNumber: string; status: string; totalAmount: string } | null;
  notes: string | null;
  memo: string | null;
  customerMessage: string | null;
  termsAndConditions: string | null;
  sentAt: string | null;
  confirmedAt: string | null;
  fulfilledAt: string | null;
  closedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SOListItem {
  id: string;
  soNumber: string;
  referenceNumber: string | null;
  status: SOStatus;
  statusInfo: SOStatusInfo;
  orderDate: string;
  expectedDeliveryDate: string | null;
  customer: { id: string; displayName: string; email: string | null };
  totalAmount: number;
  lineItemCount: number;
  createdAt: string;
}

export interface SOSummary {
  draft: { count: number };
  sent: { count: number; amount: number };
  confirmed: { count: number; amount: number };
  partial: { count: number; amount: number };
  fulfilled: { count: number; amount: number };
  closed: { count: number; amount: number };
  void: { count: number };
  overdueDelivery: { count: number; amount: number };
  totals: { totalPending: number; totalFulfilled: number };
}

export interface SOFilters {
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

export interface CreateSOLineItemRequest {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateSORequest {
  customerId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  referenceNumber?: string;
  depositAccountId?: string;
  discountType?: DiscountType;
  discountValue?: number;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
  memo?: string;
  customerMessage?: string;
  termsAndConditions?: string;
  lineItems: CreateSOLineItemRequest[];
}

export interface UpdateSORequest extends Partial<Omit<CreateSORequest, "customerId">> {
  customerId?: string;
}

export interface FulfillItemsRequest {
  fulfilledDate?: string;
  items: { lineItemId: string; quantityFulfilled: number }[];
}

export interface VoidSORequest {
  reason?: string;
}
