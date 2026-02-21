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
import vendorsService from "@/services/vendorsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Vendor, CreateVendorRequest } from "@/types/vendors";

interface CreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
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

const CreateVendorModal: React.FC<CreateVendorModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { token } = useAuth();

  const [vendorType, setVendorType] = useState<"Business" | "Individual">(
    "Business"
  );
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
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    taxNumber: "",
    businessIdNo: "",
    track1099: true,
    paymentTerms: "",
    accountNumber: "",
    openingBalance: "",
    openingBalanceDate: "",
    notes: "",
  });

  // Auto-populate displayName (same logic as customer but for vendor)
  useEffect(() => {
    if (!autoFilled) return;

    if (vendorType === "Business" && form.companyName) {
      setForm((prev) => ({ ...prev, displayName: form.companyName }));
    } else if (
      vendorType === "Individual" &&
      (form.firstName || form.lastName)
    ) {
      const name = [form.firstName, form.lastName].filter(Boolean).join(" ");
      setForm((prev) => ({ ...prev, displayName: name }));
    }
  }, [vendorType, form.companyName, form.firstName, form.lastName, autoFilled]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoFilled(false);
    setForm({ ...form, displayName: e.target.value });
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
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      taxNumber: "",
      businessIdNo: "",
      track1099: true,
      paymentTerms: "",
      accountNumber: "",
      openingBalance: "",
      openingBalanceDate: "",
      notes: "",
    });
    setVendorType("Business");
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
      const body: CreateVendorRequest = {
        displayName: form.displayName,
        vendorType,
      };

      if (form.companyName) body.companyName = form.companyName;
      if (form.firstName) body.firstName = form.firstName;
      if (form.lastName) body.lastName = form.lastName;
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      if (form.mobile) body.mobile = form.mobile;
      if (form.website) body.website = form.website;
      if (form.addressLine1) body.addressLine1 = form.addressLine1;
      if (form.addressLine2) body.addressLine2 = form.addressLine2;
      if (form.city) body.city = form.city;
      if (form.state) body.state = form.state;
      if (form.postalCode) body.postalCode = form.postalCode;
      if (form.country) body.country = form.country;
      if (form.taxNumber) body.taxNumber = form.taxNumber;
      if (form.businessIdNo) body.businessIdNo = form.businessIdNo;
      body.track1099 = form.track1099;
      if (form.paymentTerms) body.paymentTerms = form.paymentTerms;
      if (form.accountNumber) body.accountNumber = form.accountNumber;
      if (form.openingBalance)
        body.openingBalance = parseFloat(form.openingBalance);
      if (form.openingBalanceDate)
        body.openingBalanceDate = form.openingBalanceDate;
      if (form.notes) body.notes = form.notes;

      const vendor = await vendorsService.createVendor(body, token);
      onCreated(vendor);
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
          New Vendor
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a new vendor to your records.
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
        {/* Vendor Type Toggle */}
        <div>
          <Label>Type</Label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="vendorType"
                value="Business"
                checked={vendorType === "Business"}
                onChange={() => setVendorType("Business")}
                className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Business</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="vendorType"
                value="Individual"
                checked={vendorType === "Individual"}
                onChange={() => setVendorType("Individual")}
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
            <div>
              <Label htmlFor="vendorDisplayName">
                Display Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="vendorDisplayName"
                value={form.displayName}
                onChange={handleDisplayNameChange}
                placeholder="Display Name"
              />
            </div>

            {vendorType === "Business" && (
              <div>
                <Label htmlFor="vendorCompanyName">Company Name</Label>
                <Input
                  id="vendorCompanyName"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  placeholder="Company Name"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vendorFirstName">First Name</Label>
                <Input
                  id="vendorFirstName"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="First Name"
                />
              </div>
              <div>
                <Label htmlFor="vendorLastName">Last Name</Label>
                <Input
                  id="vendorLastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vendorEmail">Email</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vendorPhone">Phone</Label>
                <Input
                  id="vendorPhone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone"
                />
              </div>
              <div>
                <Label htmlFor="vendorMobile">Mobile</Label>
                <Input
                  id="vendorMobile"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({ ...form, mobile: e.target.value })
                  }
                  placeholder="Mobile"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vendorWebsite">Website</Label>
              <Input
                id="vendorWebsite"
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* ── Address (single address for vendors) ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Address
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="vendorAddr1">Address Line 1</Label>
              <Input
                id="vendorAddr1"
                value={form.addressLine1}
                onChange={(e) =>
                  setForm({ ...form, addressLine1: e.target.value })
                }
                placeholder="Street address"
              />
            </div>
            <div>
              <Label htmlFor="vendorAddr2">Address Line 2</Label>
              <Input
                id="vendorAddr2"
                value={form.addressLine2}
                onChange={(e) =>
                  setForm({ ...form, addressLine2: e.target.value })
                }
                placeholder="Suite, apt, etc."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="vendorCity">City</Label>
                <Input
                  id="vendorCity"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="vendorState">State</Label>
                <Input
                  id="vendorState"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="vendorZip">ZIP</Label>
                <Input
                  id="vendorZip"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  placeholder="ZIP"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vendorCountry">Country</Label>
              <Input
                id="vendorCountry"
                value={form.country}
                onChange={(e) =>
                  setForm({ ...form, country: e.target.value })
                }
                placeholder="e.g. US"
              />
            </div>
          </div>
        </div>

        {/* ── Tax & Compliance ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Tax & Compliance
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vendorTaxNumber">Tax Number</Label>
                <Input
                  id="vendorTaxNumber"
                  value={form.taxNumber}
                  onChange={(e) =>
                    setForm({ ...form, taxNumber: e.target.value })
                  }
                  placeholder="e.g. 59-2663954"
                />
              </div>
              <div>
                <Label htmlFor="vendorBusinessId">Business ID</Label>
                <Input
                  id="vendorBusinessId"
                  value={form.businessIdNo}
                  onChange={(e) =>
                    setForm({ ...form, businessIdNo: e.target.value })
                  }
                  placeholder="Business ID Number"
                />
              </div>
            </div>
            <Checkbox
              label="Track payments for 1099"
              checked={form.track1099}
              onChange={(checked) => setForm({ ...form, track1099: checked })}
            />
          </div>
        </div>

        {/* ── Payment ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
            Payment
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vendorPaymentTerms">Payment Terms</Label>
              <select
                id="vendorPaymentTerms"
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
              <Label htmlFor="vendorAccountNumber">Account Number</Label>
              <Input
                id="vendorAccountNumber"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
                placeholder="e.g. ACC-12345"
              />
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
              <Label htmlFor="vendorOpeningBalance">Amount</Label>
              <Input
                id="vendorOpeningBalance"
                type="number"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="vendorOpeningDate">As of Date</Label>
              <Input
                id="vendorOpeningDate"
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
            {loading ? "Creating..." : "Save Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateVendorModal;
