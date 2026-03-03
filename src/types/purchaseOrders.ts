export type POStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CLOSED" | "VOID";
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface POStatusInfo {
  value: POStatus;
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowSend: boolean;
  allowReceive: boolean;
  allowConvert: boolean;
  allowClose: boolean;
  allowVoid: boolean;
}

export interface POLineItem {
  id: string;
  product: { id: string; name: string; sku: string | null } | null;
  expenseAccount: { id: string; name: string; accountNumber: string } | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  quantityReceived: number;
  sortOrder: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  referenceNumber: string | null;
  status: POStatus;
  statusInfo: POStatusInfo;
  poDate: string;
  expectedDeliveryDate: string | null;
  paymentTerms: string | null;
  vendor: { id: string; displayName: string; email: string | null; phone: string | null };
  lineItems: POLineItem[];
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  notes: string | null;
  memo: string | null;
  vendorMessage: string | null;
  convertedBill: { id: string; billNumber: string; status: string; totalAmount: string } | null;
  sentAt: string | null;
  receivedAt: string | null;
  closedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface POListItem {
  id: string;
  poNumber: string;
  status: POStatus;
  statusInfo: POStatusInfo;
  poDate: string;
  expectedDeliveryDate: string | null;
  vendor: { id: string; displayName: string };
  totalAmount: string;
  lineItemCount: number;
  convertedBill: { id: string; billNumber: string } | null;
  createdAt: string;
}

export interface POSummary {
  draft: { count: number };
  sent: { count: number; amount: number };
  partial: { count: number; amount: number };
  received: { count: number; amount: number };
  closed: { count: number; amount: number };
  void: { count: number };
  overdueDelivery: { count: number; amount: number };
  totals: { totalPending: number; totalReceived: number };
}

export interface POFilters {
  status?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}

export interface CreatePOLineItemRequest {
  productId?: string;
  expenseAccountId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreatePORequest {
  vendorId: string;
  poDate: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  referenceNumber?: string;
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
  vendorMessage?: string;
  lineItems: CreatePOLineItemRequest[];
}

export interface UpdatePORequest extends Partial<Omit<CreatePORequest, "vendorId">> {
  vendorId?: string;
}

export interface ReceiveItemsRequest {
  receivedDate?: string;
  items: { lineItemId: string; quantityReceived: number }[];
}

export interface VoidPORequest {
  reason?: string;
}
