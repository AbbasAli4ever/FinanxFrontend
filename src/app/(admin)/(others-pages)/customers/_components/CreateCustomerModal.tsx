"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import customersService from "@/services/customersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Customer, CreateCustomerRequest } from "@/types/customers";

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 10",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Net 90",
];

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { token } = useAuth();

  const [customerType, setCustomerType] = useState<"Business" | "Individual">(
    "Business"
  );
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [autoFilled, setAutoFilled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    fax: "",
    title: "",
    suffix: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "",
    taxNumber: "",
    taxExempt: false,
    paymentTerms: "",
    openingBalance: "",
    openingBalanceDate: "",
    creditLimit: "",
    notes: "",
  });

  // Auto-populate displayName
  useEffect(() => {
    if (!autoFilled) return;

    if (customerType === "Business" && form.companyName) {
      setForm((prev) => ({ ...prev, displayName: form.companyName }));
    } else if (
      customerType === "Individual" &&
      (form.firstName || form.lastName)
    ) {
      const name = [form.firstName, form.lastName].filter(Boolean).join(" ");
      setForm((prev) => ({ ...prev, displayName: name }));
    }
  }, [customerType, form.companyName, form.firstName, form.lastName, autoFilled]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoFilled(false);
    setForm({ ...form, displayName: e.target.value });
  };

  const handleSameAsBilling = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        shippingAddressLine1: prev.billingAddressLine1,
        shippingAddressLine2: prev.billingAddressLine2,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingPostalCode: prev.billingPostalCode,
        shippingCountry: prev.billingCountry,
      }));
    }
  };

  const resetForm = () => {
    setForm({
      displayName: "",
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      mobile: "",
      website: "",
      fax: "",
      title: "",
      suffix: "",
      billingAddressLine1: "",
      billingAddressLine2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "",
      shippingAddressLine1: "",
      shippingAddressLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "",
      taxNumber: "",
      taxExempt: false,
      paymentTerms: "",
      openingBalance: "",
      openingBalanceDate: "",
      creditLimit: "",
      notes: "",
    });
    setCustomerType("Business");
    setSameAsBilling(false);
    setAutoFilled(true);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const body: CreateCustomerRequest = {
        displayName: form.displayName,
        customerType,
      };

      // Only include non-empty fields
      if (form.companyName) body.companyName = form.companyName;
      if (form.firstName) body.firstName = form.firstName;
      if (form.lastName) body.lastName = form.lastName;
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      if (form.mobile) body.mobile = form.mobile;
      if (form.website) body.website = form.website;
      if (form.fax) body.fax = form.fax;
      if (form.title) body.title = form.title;
      if (form.suffix) body.suffix = form.suffix;
      if (form.billingAddressLine1)
        body.billingAddressLine1 = form.billingAddressLine1;
      if (form.billingAddressLine2)
        body.billingAddressLine2 = form.billingAddressLine2;
      if (form.billingCity) body.billingCity = form.billingCity;
      if (form.billingState) body.billingState = form.billingState;
      if (form.billingPostalCode)
        body.billingPostalCode = form.billingPostalCode;
      if (form.billingCountry) body.billingCountry = form.billingCountry;

      // Shipping — copy from billing if same, otherwise use shipping fields
      if (sameAsBilling) {
        if (form.billingAddressLine1)
          body.shippingAddressLine1 = form.billingAddressLine1;
        if (form.billingAddressLine2)
          body.shippingAddressLine2 = form.billingAddressLine2;
        if (form.billingCity) body.shippingCity = form.billingCity;
        if (form.billingState) body.shippingState = form.billingState;
        if (form.billingPostalCode)
          body.shippingPostalCode = form.billingPostalCode;
        if (form.billingCountry) body.shippingCountry = form.billingCountry;
      } else {
        if (form.shippingAddressLine1)
          body.shippingAddressLine1 = form.shippingAddressLine1;
        if (form.shippingAddressLine2)
          body.shippingAddressLine2 = form.shippingAddressLine2;
        if (form.shippingCity) body.shippingCity = form.shippingCity;
        if (form.shippingState) body.shippingState = form.shippingState;
        if (form.shippingPostalCode)
          body.shippingPostalCode = form.shippingPostalCode;
        if (form.shippingCountry) body.shippingCountry = form.shippingCountry;
      }

      if (form.taxNumber) body.taxNumber = form.taxNumber;
      if (form.taxExempt) body.taxExempt = true;
      if (form.paymentTerms) body.paymentTerms = form.paymentTerms;
      if (form.openingBalance)
        body.openingBalance = parseFloat(form.openingBalance);
      if (form.openingBalanceDate)
        body.openingBalanceDate = form.openingBalanceDate;
      if (form.creditLimit) body.creditLimit = parseFloat(form.creditLimit);
      if (form.notes) body.notes = form.notes;

      const customer = await customersService.createCustomer(body, token);
      onCreated(customer);
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-2xl p-6 lg:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          New Customer
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a new customer to your records.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-h-[70vh] space-y-6 overflow-y-auto pr-1"
      >
        {/* Customer Type Toggle */}
        <div>
          <Label>Type</Label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="customerType"
                value="Business"
                checked={customerType === "Business"}
                onChange={() => setCustomerType("Business")}
                className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Business</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="customerType"
                value="Individual"
                checked={customerType === "Individual"}
                onChange={() => setCustomerType("Individual")}
                className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Individual
              </span>
            </label>
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Contact Info
          </h3>
          <div className="space-y-3">
            {/* Title / Suffix */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="title">Title</Label>
                <select
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`${selectClasses} ${form.title ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                >
                  <option value="">Select</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={form.suffix}
                  onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                  placeholder="e.g. Jr., Sr."
                />
              </div>
            </div>

            {/* First / Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="First Name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName">
                Display Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={handleDisplayNameChange}
                placeholder="Display Name"
              />
            </div>

            {/* Company Name — prominent for Business, secondary for Individual */}
            {customerType === "Business" && (
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  placeholder="Company Name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            {/* Phone / Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="Mobile"
                />
              </div>
            </div>

            {/* Fax / Website */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  value={form.fax}
                  onChange={(e) => setForm({ ...form, fax: e.target.value })}
                  placeholder="Fax"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Billing Address ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Billing Address
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="billingAddressLine1">Address Line 1</Label>
              <Input
                id="billingAddressLine1"
                value={form.billingAddressLine1}
                onChange={(e) =>
                  setForm({ ...form, billingAddressLine1: e.target.value })
                }
                placeholder="Street address"
              />
            </div>
            <div>
              <Label htmlFor="billingAddressLine2">Address Line 2</Label>
              <Input
                id="billingAddressLine2"
                value={form.billingAddressLine2}
                onChange={(e) =>
                  setForm({ ...form, billingAddressLine2: e.target.value })
                }
                placeholder="Suite, apt, etc."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  value={form.billingCity}
                  onChange={(e) =>
                    setForm({ ...form, billingCity: e.target.value })
                  }
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="billingState">State</Label>
                <Input
                  id="billingState"
                  value={form.billingState}
                  onChange={(e) =>
                    setForm({ ...form, billingState: e.target.value })
                  }
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="billingPostalCode">ZIP</Label>
                <Input
                  id="billingPostalCode"
                  value={form.billingPostalCode}
                  onChange={(e) =>
                    setForm({ ...form, billingPostalCode: e.target.value })
                  }
                  placeholder="ZIP"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="billingCountry">Country</Label>
              <Input
                id="billingCountry"
                value={form.billingCountry}
                onChange={(e) =>
                  setForm({ ...form, billingCountry: e.target.value })
                }
                placeholder="e.g. US"
              />
            </div>
          </div>
        </div>

        {/* Same as billing checkbox */}
        <Checkbox
          label="Same as billing address"
          checked={sameAsBilling}
          onChange={handleSameAsBilling}
        />

        {/* ── Shipping Address ── */}
        {!sameAsBilling && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
              Shipping Address
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="shippingAddressLine1">Address Line 1</Label>
                <Input
                  id="shippingAddressLine1"
                  value={form.shippingAddressLine1}
                  onChange={(e) =>
                    setForm({ ...form, shippingAddressLine1: e.target.value })
                  }
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label htmlFor="shippingAddressLine2">Address Line 2</Label>
                <Input
                  id="shippingAddressLine2"
                  value={form.shippingAddressLine2}
                  onChange={(e) =>
                    setForm({ ...form, shippingAddressLine2: e.target.value })
                  }
                  placeholder="Suite, apt, etc."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    value={form.shippingCity}
                    onChange={(e) =>
                      setForm({ ...form, shippingCity: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    value={form.shippingState}
                    onChange={(e) =>
                      setForm({ ...form, shippingState: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingPostalCode">ZIP</Label>
                  <Input
                    id="shippingPostalCode"
                    value={form.shippingPostalCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        shippingPostalCode: e.target.value,
                      })
                    }
                    placeholder="ZIP"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="shippingCountry">Country</Label>
                <Input
                  id="shippingCountry"
                  value={form.shippingCountry}
                  onChange={(e) =>
                    setForm({ ...form, shippingCountry: e.target.value })
                  }
                  placeholder="e.g. US"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Tax & Payment ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Tax & Payment
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="taxNumber">Tax Number</Label>
                <Input
                  id="taxNumber"
                  value={form.taxNumber}
                  onChange={(e) =>
                    setForm({ ...form, taxNumber: e.target.value })
                  }
                  placeholder="e.g. 12-3456789"
                />
              </div>
              <div className="flex items-end pb-1">
                <Checkbox
                  label="Tax Exempt"
                  checked={form.taxExempt}
                  onChange={(checked) =>
                    setForm({ ...form, taxExempt: checked })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <select
                  id="paymentTerms"
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm({ ...form, paymentTerms: e.target.value })
                  }
                  className={`${selectClasses} ${form.paymentTerms ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                >
                  <option value="">Select</option>
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={form.creditLimit}
                  onChange={(e) =>
                    setForm({ ...form, creditLimit: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Opening Balance ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Opening Balance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="openingBalance">Amount</Label>
              <Input
                id="openingBalance"
                type="number"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="openingBalanceDate">As of Date</Label>
              <Input
                id="openingBalanceDate"
                type="date"
                value={form.openingBalanceDate}
                onChange={(e) =>
                  setForm({ ...form, openingBalanceDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Notes
          </h3>
          <TextArea
            value={form.notes}
            onChange={(val) => setForm({ ...form, notes: val })}
            placeholder="Additional notes (optional)"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Creating..." : "Save Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCustomerModal;
