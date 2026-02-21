// Types based on DAY_8_CUSTOMERS_VENDORS_FRONTEND_GUIDE.md

export interface Address {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface Customer {
  id: string;
  customerType: "Business" | "Individual";
  displayName: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  billingAddress: Address;
  shippingAddress: Address;
  taxNumber: string | null;
  taxExempt: boolean;
  paymentTerms: string | null;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  displayName: string;
  customerType: "Business" | "Individual";
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  fax?: string;
  title?: string;
  suffix?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  taxNumber?: string;
  taxExempt?: boolean;
  paymentTerms?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateCustomerRequest {
  displayName?: string;
  customerType?: "Business" | "Individual";
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  fax?: string;
  title?: string;
  suffix?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  taxNumber?: string;
  taxExempt?: boolean;
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerFilters {
  search: string;
  customerType: string;
  isActive: string;
  sortBy: string;
  sortOrder: string;
}
