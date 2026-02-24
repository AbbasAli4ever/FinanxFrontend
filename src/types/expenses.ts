export type ExpenseStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "REIMBURSED"
  | "VOID";

export type RecurringFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export type PaymentMethod =
  | "CASH"
  | "CHECK"
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "OTHER";

export interface ExpenseStatusInfo {
  key: string;
  label: string;
  color: string;
  description: string;
  allowEdit: boolean;
  allowDelete: boolean;
  allowSubmit: boolean;
  allowApprove: boolean;
  allowReject: boolean;
  allowMarkPaid: boolean;
  allowVoid: boolean;
}

export interface ExpenseLineItem {
  id: string;
  expenseAccount: {
    id: string;
    name: string;
    accountNumber: string | null;
    accountType: string;
  };
  description: string;
  amount: number;
  taxPercent: number;
  taxAmount: number;
  sortOrder: number;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  referenceNumber: string | null;
  description: string | null;
  notes: string | null;
  status: ExpenseStatus;
  expenseDate: string;

  // Amounts
  amount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;

  // Vendor & Category
  vendor: { id: string; displayName: string } | null;
  category: { id: string; name: string } | null;

  // Accounts
  expenseAccount: {
    id: string;
    name: string;
    accountNumber: string | null;
    accountType: string;
  };
  paymentAccount: {
    id: string;
    name: string;
    accountNumber: string | null;
    accountType: string;
  } | null;
  paymentMethod: PaymentMethod | null;

  // Tax
  isTaxDeductible: boolean;

  // Billable
  isBillable: boolean;
  billableCustomer: { id: string; displayName: string } | null;
  markupPercent: number | null;
  markedUpAmount: number | null;

  // Reimbursable
  isReimbursable: boolean;
  reimbursedAt: string | null;
  reimbursedAmount: number | null;

  // Mileage
  isMileage: boolean;
  mileageDistance: number | null;
  mileageRate: number | null;

  // Receipt
  receiptUrl: string | null;
  receiptFileName: string | null;

  // Recurring
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  nextRecurringDate: string | null;
  recurringEndDate: string | null;

  // Approval
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  rejectedAt: string | null;
  rejectionReason: string | null;

  // Terminal
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;

  // Created by
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  // Line items (split expenses)
  lineItems: ExpenseLineItem[];

  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListItem {
  id: string;
  expenseNumber: string;
  referenceNumber: string | null;
  description: string | null;
  status: ExpenseStatus;
  expenseDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  vendor: { id: string; displayName: string } | null;
  category: { id: string; name: string } | null;
  expenseAccount: { id: string; name: string };
  isBillable: boolean;
  isReimbursable: boolean;
  isMileage: boolean;
  isRecurring: boolean;
  createdAt: string;
}

export interface ExpenseSummary {
  draft: { count: number };
  pendingApproval: { count: number; amount: number };
  approved: { count: number; amount: number };
  rejected: { count: number };
  paid: { count: number; amount: number };
  reimbursed: { count: number; amount: number };
  voided: { count: number };
  totalExpenses: number;
  totalAmount: number;
}

export interface ExpenseFilters {
  status: string;
  vendorId: string;
  categoryId: string;
  expenseAccountId: string;
  isBillable: string;
  isReimbursable: string;
  isMileage: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: string;
  limit: string;
}

export interface CreateExpenseLineItemRequest {
  expenseAccountId: string;
  description: string;
  amount: number;
  taxPercent?: number;
  sortOrder?: number;
}

export interface CreateExpenseRequest {
  expenseDate: string;
  expenseAccountId: string;
  amount: number;
  expenseNumber?: string;
  description?: string;
  referenceNumber?: string;
  notes?: string;
  vendorId?: string;
  categoryId?: string;
  paymentAccountId?: string;
  paymentMethod?: PaymentMethod;
  taxPercent?: number;
  isTaxDeductible?: boolean;
  isBillable?: boolean;
  billableCustomerId?: string;
  markupPercent?: number;
  isReimbursable?: boolean;
  isMileage?: boolean;
  mileageDistance?: number;
  mileageRate?: number;
  receiptUrl?: string;
  receiptFileName?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  lineItems?: CreateExpenseLineItemRequest[];
}

export interface UpdateExpenseRequest {
  expenseDate?: string;
  expenseAccountId?: string;
  amount?: number;
  expenseNumber?: string;
  description?: string;
  referenceNumber?: string;
  notes?: string;
  vendorId?: string;
  categoryId?: string;
  paymentAccountId?: string;
  paymentMethod?: PaymentMethod;
  taxPercent?: number;
  isTaxDeductible?: boolean;
  isBillable?: boolean;
  billableCustomerId?: string;
  markupPercent?: number;
  isReimbursable?: boolean;
  isMileage?: boolean;
  mileageDistance?: number;
  mileageRate?: number;
  receiptUrl?: string;
  receiptFileName?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  lineItems?: CreateExpenseLineItemRequest[];
}

export interface MarkPaidRequest {
  paymentMethod?: PaymentMethod;
  paymentAccountId?: string;
}

export interface RejectExpenseRequest {
  reason: string;
}

export interface VoidExpenseRequest {
  reason?: string;
}
