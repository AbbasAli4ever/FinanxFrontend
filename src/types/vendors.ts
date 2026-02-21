// Types based on DAY_8_CUSTOMERS_VENDORS_FRONTEND_GUIDE.md

export interface VendorAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface Vendor {
  id: string;
  vendorType: "Business" | "Individual";
  displayName: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: VendorAddress;
  taxNumber: string | null;
  businessIdNo: string | null;
  track1099: boolean;
  paymentTerms: string | null;
  accountNumber: string | null;
  openingBalance: number;
  currentBalance: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  displayName: string;
  vendorType: "Business" | "Individual";
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  businessIdNo?: string;
  track1099?: boolean;
  paymentTerms?: string;
  accountNumber?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  notes?: string;
}

export interface UpdateVendorRequest {
  displayName?: string;
  vendorType?: "Business" | "Individual";
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  businessIdNo?: string;
  track1099?: boolean;
  paymentTerms?: string;
  accountNumber?: string;
  notes?: string;
  isActive?: boolean;
}

export interface VendorFilters {
  search: string;
  vendorType: string;
  isActive: string;
  track1099: string;
  sortBy: string;
  sortOrder: string;
}
