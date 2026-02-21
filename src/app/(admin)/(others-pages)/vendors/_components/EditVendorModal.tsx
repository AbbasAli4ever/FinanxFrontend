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
import vendorsService from "@/services/vendorsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Vendor, UpdateVendorRequest } from "@/types/vendors";

interface EditVendorModalProps {
  isOpen: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onUpdated: (vendor: Vendor) => void;
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

const EditVendorModal: React.FC<EditVendorModalProps> = ({
  isOpen,
  vendor,
  onClose,
  onUpdated,
}) => {
  const { token } = useAuth();

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
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    taxNumber: "",
    businessIdNo: "",
    track1099: false,
    paymentTerms: "",
    accountNumber: "",
    notes: "",
    isActive: true,
  });

  useEffect(() => {
    if (vendor) {
      setForm({
        displayName: vendor.displayName,
        companyName: vendor.companyName || "",
        firstName: vendor.firstName || "",
        lastName: vendor.lastName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        mobile: vendor.mobile || "",
        addressLine1: vendor.address?.line1 || "",
        addressLine2: vendor.address?.line2 || "",
        city: vendor.address?.city || "",
        state: vendor.address?.state || "",
        postalCode: vendor.address?.postalCode || "",
        country: vendor.address?.country || "",
        taxNumber: vendor.taxNumber || "",
        businessIdNo: vendor.businessIdNo || "",
        track1099: vendor.track1099,
        paymentTerms: vendor.paymentTerms || "",
        accountNumber: vendor.accountNumber || "",
        notes: vendor.notes || "",
        isActive: vendor.isActive,
      });
      setError("");
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !vendor) return;

    setError("");
    setLoading(true);

    try {
      const payload: UpdateVendorRequest = {};

      if (form.displayName !== vendor.displayName)
        payload.displayName = form.displayName;
      if (form.companyName !== (vendor.companyName || ""))
        payload.companyName = form.companyName;
      if (form.firstName !== (vendor.firstName || ""))
        payload.firstName = form.firstName;
      if (form.lastName !== (vendor.lastName || ""))
        payload.lastName = form.lastName;
      if (form.email !== (vendor.email || "")) payload.email = form.email;
      if (form.phone !== (vendor.phone || "")) payload.phone = form.phone;
      if (form.mobile !== (vendor.mobile || ""))
        payload.mobile = form.mobile;
      if (form.addressLine1 !== (vendor.address?.line1 || ""))
        payload.addressLine1 = form.addressLine1;
      if (form.addressLine2 !== (vendor.address?.line2 || ""))
        payload.addressLine2 = form.addressLine2;
      if (form.city !== (vendor.address?.city || ""))
        payload.city = form.city;
      if (form.state !== (vendor.address?.state || ""))
        payload.state = form.state;
      if (form.postalCode !== (vendor.address?.postalCode || ""))
        payload.postalCode = form.postalCode;
      if (form.country !== (vendor.address?.country || ""))
        payload.country = form.country;
      if (form.taxNumber !== (vendor.taxNumber || ""))
        payload.taxNumber = form.taxNumber;
      if (form.businessIdNo !== (vendor.businessIdNo || ""))
        payload.businessIdNo = form.businessIdNo;
      if (form.track1099 !== vendor.track1099)
        payload.track1099 = form.track1099;
      if (form.paymentTerms !== (vendor.paymentTerms || ""))
        payload.paymentTerms = form.paymentTerms;
      if (form.accountNumber !== (vendor.accountNumber || ""))
        payload.accountNumber = form.accountNumber;
      if (form.notes !== (vendor.notes || "")) payload.notes = form.notes;
      if (form.isActive !== vendor.isActive)
        payload.isActive = form.isActive;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const updated = await vendorsService.updateVendor(
        vendor.id,
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

  if (!vendor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Vendor
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update vendor details.
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
          <Label htmlFor="editVendorName">
            Display Name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="editVendorName"
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
            placeholder="Display Name"
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editVendorFirst">First Name</Label>
            <Input
              id="editVendorFirst"
              value={form.firstName}
              onChange={(e) =>
                setForm({ ...form, firstName: e.target.value })
              }
              placeholder="First Name"
            />
          </div>
          <div>
            <Label htmlFor="editVendorLast">Last Name</Label>
            <Input
              id="editVendorLast"
              value={form.lastName}
              onChange={(e) =>
                setForm({ ...form, lastName: e.target.value })
              }
              placeholder="Last Name"
            />
          </div>
        </div>

        {/* Company */}
        <div>
          <Label htmlFor="editVendorCompany">Company Name</Label>
          <Input
            id="editVendorCompany"
            value={form.companyName}
            onChange={(e) =>
              setForm({ ...form, companyName: e.target.value })
            }
            placeholder="Company Name"
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editVendorEmail">Email</Label>
            <Input
              id="editVendorEmail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="editVendorPhone">Phone</Label>
            <Input
              id="editVendorPhone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />
          </div>
        </div>

        {/* Tax & 1099 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editVendorTax">Tax Number</Label>
            <Input
              id="editVendorTax"
              value={form.taxNumber}
              onChange={(e) =>
                setForm({ ...form, taxNumber: e.target.value })
              }
              placeholder="Tax Number"
            />
          </div>
          <div>
            <Label htmlFor="editVendorBizId">Business ID</Label>
            <Input
              id="editVendorBizId"
              value={form.businessIdNo}
              onChange={(e) =>
                setForm({ ...form, businessIdNo: e.target.value })
              }
              placeholder="Business ID"
            />
          </div>
        </div>

        <Checkbox
          label="Track payments for 1099"
          checked={form.track1099}
          onChange={(checked) => setForm({ ...form, track1099: checked })}
        />

        {/* Payment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="editVendorTerms">Payment Terms</Label>
            <select
              id="editVendorTerms"
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
            <Label htmlFor="editVendorAccNum">Account Number</Label>
            <Input
              id="editVendorAccNum"
              value={form.accountNumber}
              onChange={(e) =>
                setForm({ ...form, accountNumber: e.target.value })
              }
              placeholder="Account Number"
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

export default EditVendorModal;
