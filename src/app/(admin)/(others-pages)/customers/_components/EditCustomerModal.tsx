"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Checkbox from "@/components/form/input/Checkbox";
import Switch from "@/components/form/switch/Switch";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import customersService from "@/services/customersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Customer, UpdateCustomerRequest } from "@/types/customers";

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onUpdated: (customer: Customer) => void;
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

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onUpdated,
}) => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    customerType: "Business" as "Business" | "Individual",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
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
    creditLimit: "",
    notes: "",
    isActive: true,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        displayName: customer.displayName,
        customerType: customer.customerType,
        companyName: customer.companyName || "",
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        mobile: customer.mobile || "",
        billingAddressLine1: customer.billingAddress?.line1 || "",
        billingAddressLine2: customer.billingAddress?.line2 || "",
        billingCity: customer.billingAddress?.city || "",
        billingState: customer.billingAddress?.state || "",
        billingPostalCode: customer.billingAddress?.postalCode || "",
        billingCountry: customer.billingAddress?.country || "",
        shippingAddressLine1: customer.shippingAddress?.line1 || "",
        shippingAddressLine2: customer.shippingAddress?.line2 || "",
        shippingCity: customer.shippingAddress?.city || "",
        shippingState: customer.shippingAddress?.state || "",
        shippingPostalCode: customer.shippingAddress?.postalCode || "",
        shippingCountry: customer.shippingAddress?.country || "",
        taxNumber: customer.taxNumber || "",
        taxExempt: customer.taxExempt,
        paymentTerms: customer.paymentTerms || "",
        creditLimit: customer.creditLimit?.toString() || "",
        notes: customer.notes || "",
        isActive: customer.isActive,
      });
      setError("");
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !customer) return;

    setError("");
    setLoading(true);

    try {
      const payload: UpdateCustomerRequest = {};

      if (form.displayName !== customer.displayName)
        payload.displayName = form.displayName;
      if (form.customerType !== customer.customerType)
        payload.customerType = form.customerType;
      if (form.companyName !== (customer.companyName || ""))
        payload.companyName = form.companyName;
      if (form.firstName !== (customer.firstName || ""))
        payload.firstName = form.firstName;
      if (form.lastName !== (customer.lastName || ""))
        payload.lastName = form.lastName;
      if (form.email !== (customer.email || "")) payload.email = form.email;
      if (form.phone !== (customer.phone || "")) payload.phone = form.phone;
      if (form.mobile !== (customer.mobile || ""))
        payload.mobile = form.mobile;
      if (form.billingAddressLine1 !== (customer.billingAddress?.line1 || ""))
        payload.billingAddressLine1 = form.billingAddressLine1;
      if (form.billingAddressLine2 !== (customer.billingAddress?.line2 || ""))
        payload.billingAddressLine2 = form.billingAddressLine2;
      if (form.billingCity !== (customer.billingAddress?.city || ""))
        payload.billingCity = form.billingCity;
      if (form.billingState !== (customer.billingAddress?.state || ""))
        payload.billingState = form.billingState;
      if (
        form.billingPostalCode !==
        (customer.billingAddress?.postalCode || "")
      )
        payload.billingPostalCode = form.billingPostalCode;
      if (form.billingCountry !== (customer.billingAddress?.country || ""))
        payload.billingCountry = form.billingCountry;
      if (
        form.shippingAddressLine1 !==
        (customer.shippingAddress?.line1 || "")
      )
        payload.shippingAddressLine1 = form.shippingAddressLine1;
      if (
        form.shippingAddressLine2 !==
        (customer.shippingAddress?.line2 || "")
      )
        payload.shippingAddressLine2 = form.shippingAddressLine2;
      if (form.shippingCity !== (customer.shippingAddress?.city || ""))
        payload.shippingCity = form.shippingCity;
      if (form.shippingState !== (customer.shippingAddress?.state || ""))
        payload.shippingState = form.shippingState;
      if (
        form.shippingPostalCode !==
        (customer.shippingAddress?.postalCode || "")
      )
        payload.shippingPostalCode = form.shippingPostalCode;
      if (form.shippingCountry !== (customer.shippingAddress?.country || ""))
        payload.shippingCountry = form.shippingCountry;
      if (form.taxNumber !== (customer.taxNumber || ""))
        payload.taxNumber = form.taxNumber;
      if (form.taxExempt !== customer.taxExempt)
        payload.taxExempt = form.taxExempt;
      if (form.paymentTerms !== (customer.paymentTerms || ""))
        payload.paymentTerms = form.paymentTerms;
      const creditVal = form.creditLimit
        ? parseFloat(form.creditLimit)
        : undefined;
      if (creditVal !== (customer.creditLimit ?? undefined))
        payload.creditLimit = creditVal;
      if (form.notes !== (customer.notes || "")) payload.notes = form.notes;
      if (form.isActive !== customer.isActive)
        payload.isActive = form.isActive;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const updated = await customersService.updateCustomer(
        customer.id,
        payload,
        token
      );
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Customer
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update customer details.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-h-[70vh] space-y-5 overflow-y-auto pr-1"
      >
        {/* Display Name */}
        <div>
          <Label htmlFor="editDisplayName">
            Display Name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="editDisplayName"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Display Name"
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editFirstName">First Name</Label>
            <Input
              id="editFirstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="First Name"
            />
          </div>
          <div>
            <Label htmlFor="editLastName">Last Name</Label>
            <Input
              id="editLastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Last Name"
            />
          </div>
        </div>

        {/* Company */}
        <div>
          <Label htmlFor="editCompany">Company Name</Label>
          <Input
            id="editCompany"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="Company Name"
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editEmail">Email</Label>
            <Input
              id="editEmail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="editPhone">Phone</Label>
            <Input
              id="editPhone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />
          </div>
        </div>

        {/* Tax & Payment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editTaxNumber">Tax Number</Label>
            <Input
              id="editTaxNumber"
              value={form.taxNumber}
              onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
              placeholder="Tax Number"
            />
          </div>
          <div>
            <Label htmlFor="editPaymentTerms">Payment Terms</Label>
            <select
              id="editPaymentTerms"
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editCreditLimit">Credit Limit</Label>
            <Input
              id="editCreditLimit"
              type="number"
              value={form.creditLimit}
              onChange={(e) =>
                setForm({ ...form, creditLimit: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
          <div className="flex items-end pb-1">
            <Checkbox
              label="Tax Exempt"
              checked={form.taxExempt}
              onChange={(checked) => setForm({ ...form, taxExempt: checked })}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <TextArea
            value={form.notes}
            onChange={(val) => setForm({ ...form, notes: val })}
            placeholder="Notes"
            rows={2}
          />
        </div>

        {/* Active Status */}
        <Switch
          label="Active"
          defaultChecked={form.isActive}
          onChange={(checked) => setForm({ ...form, isActive: checked })}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCustomerModal;
